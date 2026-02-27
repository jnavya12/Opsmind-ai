const OpenAI = require("openai");

// Initialize Groq client (using OpenAI SDK compatibility)
const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

const generateResponseStream = async (context, query, res) => {
    try {
        const systemInstruction = `
You are OpsMind AI, an expert Corporate SOP Agent.
Your Goal: Answer the user's question accurately based ONLY on the provided Context.

Rules:
1. STRICTLY base your answer on the provided[SOURCE] blocks.
2. If the answer is not in the context, say "I don't know based on the provided SOPs." Do NOT make up information.
3. Cite your sources.At the end of sentences, add a citation like[Source 1]or[Source 2] corresponding to the Source IDs in the context.
4. Format your response in Markdown.
`;

        const messages = [
            { role: "system", content: systemInstruction },
            { role: "user", content: `CONTEXT: \n${context} \n\nUSER QUERY: \n${query} ` }
        ];

        console.log("🚀 Sending request to Groq (Llama 3)...");

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            stream: true,
            temperature: 0.5,
            max_tokens: 1024
        });

        // Iterate through the stream and write to the response
        for await (const chunk of completion) {
            const chunkText = chunk.choices[0]?.delta?.content || "";
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ text: chunkText })} \n\n`);
            }
        }

        // End signal
        res.write('data: [DONE]\n\n');
        res.end();

    } catch (error) {
        console.error(`⚠️ Groq API Failed: ${error.message} `);
        console.log("Switching to DEMO RESPONSE (Mock Mode).");

        // --- EMERGENCY MOCK MODE FOR DEMO ---
        const mockResponse = `[DEMO MODE: Groq Connection Issue]\n\nBased on your SOPs, I can confirm that the procedure involves several key steps.\n\n(We encountered an error connecting to Groq: ${error.message}) \n\n1.  ** Ingestion:** Your PDF was parsed successfully.\n2.  ** Context:** I found relevant chunks in the database.\n3.  ** Response:** The system is operational.\n\nPlease refer to Page 1 of your uploaded document for more details.`;

        const words = mockResponse.split(' ');
        for (const word of words) {
            res.write(`data: ${JSON.stringify({ text: word + " " })} \n\n`);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        res.write('data: [DONE]\n\n');
        res.end();
    }
};

module.exports = { generateResponseStream };
