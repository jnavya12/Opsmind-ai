
require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require('fs');

async function checkFlash() {
    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        await model.generateContent("Test");
        fs.writeFileSync("error_msg.txt", "SUCCESS");
    } catch (error) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            response: error.response
        };
        fs.writeFileSync("error_msg.txt", JSON.stringify(errorInfo, null, 2));
    }
}

checkFlash();
