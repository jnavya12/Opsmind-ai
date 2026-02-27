const { searchSimilarChunks } = require("../services/searchService");
const { generateResponseStream } = require("../services/llmService");
const Chat = require("../models/Chat");
const DocumentChunk = require("../models/DocumentChunk");

const getChatHistory = async (req, res) => {
  try {
    const docCount = await DocumentChunk.countDocuments({ user: req.user._id });

    if (docCount === 0) {
      await Chat.deleteMany({ user: req.user._id });
      return res.json([]);
    }

    const chats = await Chat.find({ user: req.user._id }).sort({
      createdAt: 1,
    });
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: "Error fetching chat history" });
  }
};

const handleChat = async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ message: "Query is needed" });
    }

    const userId = req.user ? req.user._id : null;

    if (userId) {
      await Chat.create({
        user: userId,
        role: "user",
        content: query,
      });
    }

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const relevantChunks = await searchSimilarChunks(query);

    const sourcesMetadata = relevantChunks.map((chunk, index) => ({
      id: index + 1,
      filename: chunk.filename,
      page: chunk.metadata?.pageNumber || "N/A",
      score: (chunk.score * 100).toFixed(1),
    }));

    res.write(
      `data: ${JSON.stringify({ type: "sources", sources: sourcesMetadata })}\n\n`,
    );

    const contextParts = relevantChunks.map((chunk, index) => {
      return `
[SOURCE START]
Source ID: ${index + 1}
Document: ${chunk.filename}
Page: ${chunk.metadata?.pageNumber || "N/A"}
Content:
${chunk.text}
[SOURCE END]
            `.trim();
    });

    const fullContext = contextParts.join("\n\n");

    console.log(
      "📄 Context being sent to AI:\n",
      fullContext.substring(0, 500),
    );

    let fullResponse = "";

    const originalWrite = res.write;
    res.write = function (chunk) {
      if (arguments[0] && typeof arguments[0] === "string") {
        const match = arguments[0].match(/data: (.*)\n\n/);
        if (match) {
          try {
            const data = JSON.parse(match[1]);
            if (data.text) fullResponse += data.text;
          } catch (e) {}
        }
      }
      return originalWrite.apply(res, arguments);
    };

    const originalEnd = res.end;
    res.end = async function (chunk) {
      if (userId && fullResponse.length > 0) {
        try {
          await Chat.create({
            user: userId,
            role: "bot",
            content: fullResponse,
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
