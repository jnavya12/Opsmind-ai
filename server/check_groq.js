
require('dotenv').config();
const OpenAI = require("openai");

const groq = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1"
});

async function checkGroq() {
    console.log("Checking Groq (Llama 3)...");
    try {
        const completion = await groq.chat.completions.create({
            messages: [{ role: "user", content: "Hello, say 'Groq is working'!" }],
            model: "llama-3.3-70b-versatile",
        });
        console.log("Response:", completion.choices[0].message.content);
        console.log("✅ Groq Connection SUCCESS!");
    } catch (error) {
        console.error("❌ Groq Connection FAILED:", error.message);
    }
}

checkGroq();
