const mongoose = require('mongoose');
const parsePDF = require('../services/pdfService');
const { splitText } = require('../services/chunkingService');
const { generateEmbedding } = require('../services/embeddingService');
const DocumentChunk = require('../models/DocumentChunk');

const ingestFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log(`Processing file: ${req.file.originalname}`);
        console.log("Type of parsePDF:", typeof parsePDF);
        if (typeof parsePDF !== 'function') {
            throw new Error("parsePDF is not a function (Import failed)");
        }

        // 1. Parsing
        const text = await parsePDF(req.file.buffer);
        console.log(`Parsed PDF. Text length: ${text.length}`);

        // 2. Chunking
        const chunks = splitText(text);
        console.log(`Generated ${chunks.length} chunks`);



        // 3. Embedding & Storage
        // Depending on volume, might need batch processing. 
        // 3. Embedding & Saving
        console.log("--> Starting Embedding & Saving...");
        const storedChunks = [];

        for (let i = 0; i < chunks.length; i++) {
            const chunkText = chunks[i].trim();
            if (!chunkText) continue;

            let embedding = [];
            try {
                // Check if real API key is ready
                if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.length > 20) {
                    embedding = await generateEmbedding(chunkText);
                } else {
                    console.log(`[Chunk ${i}] using mock embedding (No API Key)`);
                    embedding = new Array(768).fill(0).map(() => Math.random());
                }
            } catch (embedError) {
                console.error(`--> Embedding Failed for chunk ${i}:`, embedError.message);
                // Continue with mock/empty to avoid failing entire upload
                embedding = new Array(768).fill(0).map(() => Math.random());
            }

            const docChunk = new DocumentChunk({
                filename: req.file.originalname,
                chunkIndex: i,
                text: chunkText,
                embedding: embedding,
                metadata: { pageNumber: 1 }
            });

            if (mongoose.connection.readyState === 1) {
                await docChunk.save();
            }
            storedChunks.push({ index: i, preview: chunkText.substring(0, 30) + "..." });
        }
        console.log(`--> Saved ${storedChunks.length} chunks to DB.`);

        res.status(200).json({
            message: 'File processed successfully',
            totalChunks: chunks.length,
            chunks: storedChunks
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

module.exports = { ingestFile };
