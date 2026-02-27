require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

async function listModels() {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // We use this purely to get access to the list method if possible, or just use the SDK utility if available. 
        // Actually, the SDK doesn't always expose listModels directly on the main class in older versions, 
        // but typically we can try to infer or just try 'gemini-1.5-flash'.

        console.log("Checking commonly available models...");

        const modelsToCheck = ["gemini-1.0-pro", "gemini-1.5-flash", "gemini-pro", "gemini-1.5-pro-latest"];

        for (const m of modelsToCheck) {
            console.log(`Testing model: ${m}`);
            try {
                const modelInstance = genAI.getGenerativeModel({ model: m });
                const result = await modelInstance.generateContent("Hello");
                console.log(`✅ Model ${m} is WORKING!`);
                return; // Stop after finding one
            } catch (e) {
                console.log(`❌ Model ${m} failed: ${e.message}`);
            }
        }

    } catch (error) {
        console.error("Error:", error);
    }
}

listModels();
