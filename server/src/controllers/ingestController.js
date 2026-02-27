const mongoose = require("mongoose");
const parsePDF = require("../services/pdfService");
const { splitText } = require("../services/chunkingService");
const { generateEmbedding } = require("../services/embeddingService");
const DocumentChunk = require("../models/DocumentChunk");
const Chat = require("../models/Chat");

const ingestFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    console.log(`Processing file: ${req.file.originalname}`);

    // ✅ Auto-clear: purane chunks aur chat history delete karo
    const userId = req.user ? req.user._id : null;
    if (mongoose.connection.readyState === 1) {
      await DocumentChunk.deleteMany({});
      await Chat.deleteMany({ user: userId });
      console.log(`--> Cleared old chunks and chat history.`);
    }

    // 1. Parse PDF - pages array milega
    const pages = await parsePDF(req.file.buffer);
    console.log(`Parsed PDF. Total pages: ${pages.length}`);

    // 2. Har page ka text chunk karo with page number
    const storedChunks = [];
    let chunkIndex = 0;

    for (const page of pages) {
      if (!page.text.trim()) continue;

      const chunks = splitText(page.text);

      for (const chunkText of chunks) {
        const trimmed = chunkText.trim();
        if (!trimmed) continue;

        let embedding = [];
        try {
          embedding = await generateEmbedding(trimmed);
        } catch (embedError) {
          console.error(
            `--> Embedding Failed for chunk ${chunkIndex}:`,
            embedError.message,
          );
          embedding = new Array(384).fill(0).map(() => Math.random());
        }

        const docChunk = new DocumentChunk({
          filename: req.file.originalname,
          chunkIndex: chunkIndex,
          text: trimmed,
          embedding: embedding,
          metadata: { pageNumber: page.pageNumber },
          user: userId,
        });

        if (mongoose.connection.readyState === 1) {
          await docChunk.save();
        }

        storedChunks.push({
          index: chunkIndex,
          page: page.pageNumber,
          preview: trimmed.substring(0, 30) + "...",
        });

        chunkIndex++;
      }
    }

    console.log(`--> Saved ${storedChunks.length} chunks to DB.`);

    res.status(200).json({
      message: "File processed successfully",
      totalChunks: storedChunks.length,
      chunks: storedChunks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

module.exports = { ingestFile };
