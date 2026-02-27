// Simple local embedding using word hashing (no API needed)
const generateEmbedding = async (text) => {
  try {
    const DIMS = 384;
    const embedding = new Array(DIMS).fill(0);
    const words = text.toLowerCase().split(/\s+/);

    for (const word of words) {
      let hash = 5381;
      for (let i = 0; i < word.length; i++) {
        hash = (hash << 5) + hash + word.charCodeAt(i);
        hash = hash & hash;
      }
      const idx = Math.abs(hash) % DIMS;
      embedding[idx] += 1;
    }

    // Normalize
    const magnitude = Math.sqrt(
      embedding.reduce((sum, val) => sum + val * val, 0),
    );
    return magnitude > 0 ? embedding.map((v) => v / magnitude) : embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

module.exports = { generateEmbedding };
