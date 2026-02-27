
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

const candidates = [
    "gemini-1.5-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-flash-001",
    "gemini-1.5-flash-002",
    "gemini-pro",
    "gemini-1.0-pro"
];

async function scan() {
    console.log("Scanning models...");
    for (const m of candidates) {
        try {
            process.stdout.write(`Testing ${m}... `);
            const model = genAI.getGenerativeModel({ model: m });
            await model.generateContent("Hi");
            console.log("WORKING ✅");
            console.log(`RECOMMENDATION: Use "${m}"`);
            process.exit(0);
        } catch (error) {
            console.log("FAILED ❌");
            // console.log(error.message); // Commented out to keep output clean and avoid truncation
        }
    }
    console.log("All failed.");
}

scan();
