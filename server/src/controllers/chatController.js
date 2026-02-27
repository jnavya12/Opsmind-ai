const { searchSimilarChunks } = require('../services/searchService');
const { generateResponseStream } = require('../services/llmService');
const Chat = require('../models/Chat');

const getChatHistory = async (req, res) => {
    try {
        const chats = await Chat.find({ user: req.user._id }).sort({ createdAt: 1 });
        res.json(chats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching chat history' });
    }
};

const handleChat = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ message: 'Query is needed' });
        }

        // User ID should be available if route is protected
        const userId = req.user ? req.user._id : null;

        // 1. Save User Query to DB (if authenticated)
        if (userId) {
            await Chat.create({
                user: userId,
                role: 'user',
                content: query
            });
        }

        // 2. Set Headers for Server-Sent Events (SSE)
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        // 3. Retrieve Context
        const relevantChunks = await searchSimilarChunks(query);

        const sourcesMetadata = relevantChunks.map((chunk, index) => ({
            id: index + 1,
            filename: chunk.filename,
            page: chunk.metadata?.pageNumber || 'N/A',
            score: (chunk.score * 100).toFixed(1)
        }));

        res.write(`data: ${JSON.stringify({ type: 'sources', sources: sourcesMetadata })}\n\n`);

        // 4. Format Context for LLM
        const contextParts = relevantChunks.map((chunk, index) => {
            return `
[SOURCE START]
Source ID: ${index + 1}
Document: ${chunk.filename}
Content:
${chunk.text}
[SOURCE END]
            `.trim();
        });

        const fullContext = contextParts.join('\n\n');

        // 5. Stream LLM Response & Capture for Saving
        let fullResponse = "";

        // Intercept res.write to capture the full text
        const originalWrite = res.write;
        res.write = function (chunk) {
            if (arguments[0] && typeof arguments[0] === 'string') {
                // Try to parse 'data: { "text": "..." } \n\n'
                // Use a broader regex to catch variations
                const match = arguments[0].match(/data: (.*)\n\n/);
                if (match) {
                    try {
                        const data = JSON.parse(match[1]);
                        if (data.text) fullResponse += data.text;
                    } catch (e) {
                        // Ignore parsing errors
                    }
                }
            }
            return originalWrite.apply(res, arguments);
        };

        // Intercept res.end to save when done
        const originalEnd = res.end;
        res.end = async function (chunk) {
            if (userId && fullResponse.length > 0) {
                try {
                    await Chat.create({
                        user: userId,
                        role: 'bot',
                        content: fullResponse
                    });
                } catch (err) {
                    console.error("Failed to save bot response:", err);
                }
            }
            return originalEnd.apply(res, arguments);
        };

        await generateResponseStream(fullContext, query, res);

    } catch (error) {
        console.error("Chat Handler Error:", error);
        if (!res.headersSent) res.status(500).send("Error");
        res.end();
    }
};

module.exports = { handleChat, getChatHistory };
