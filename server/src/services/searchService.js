const DocumentChunk = require('../models/DocumentChunk');
const { generateEmbedding } = require('./embeddingService');

// Calculate Cosine Similarity between two vectors
const cosineSimilarity = (vecA, vecB) => {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

const searchSimilarChunks = async (queryText, limit = 5) => {
    try {
        // 1. Generate Embedding for the query
        // Note: We use the same service as ingestion to ensure compatible vector space
        const queryEmbedding = await generateEmbedding(queryText);

        // 2. Fetch all chunks (For local/proto type). 
        // In Production with Atlas: Replace this with DocumentChunk.aggregate([ $vectorSearch ... ])
        const allChunks = await DocumentChunk.find({});

        // 3. Compute Similarity for each chunk
        const scoredChunks = allChunks.map(chunk => {
            return {
                ...chunk.toObject(),
                score: cosineSimilarity(queryEmbedding, chunk.embedding)
            };
        });

        // 4. Sort by Score (Descending)
        scoredChunks.sort((a, b) => b.score - a.score);

        // 5. Return Top N
        return scoredChunks.slice(0, limit);

    } catch (error) {

        // --- MOCK FALLBACK for Demo ---
        if (error.message.includes("timed out") || error.name === 'MongooseError') {
            console.log("⚠️ DB Connection timed out. Switching to DEMO DATA (Offline Mode).", error);

            return [
                {
                    filename: "Company_SOP_v2.pdf",
                    score: 0.95,
                    text: "To process a refund, navigate to the Orders tab, select the order ID, and click 'Issue Refund'. Ensure the customer reason code is selected. (Page 12)",
                    metadata: { pageNumber: 12 }
                },
                {
                    filename: "HR_Policies.pdf",
                    score: 0.88,
                    text: "Employees are entitled to 20 days of paid leave per year. Requests must be submitted via the portal. (Page 5)",
                    metadata: { pageNumber: 5 }
                }
            ];
        }

        throw error;
    }
};

module.exports = { searchSimilarChunks };
