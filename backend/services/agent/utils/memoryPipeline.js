import axios from "axios";

// Local cache database mock if Qdrant isn't available
const localVectorDb = [];

/**
 * Generates embeddings using Gemini API (or OpenAI).
 */
async function generateEmbedding(text) {
  try {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey || apiKey.startsWith("mock")) {
      // Fake embedding array for local mock setup
      return Array.from({ length: 768 }, () => Math.random());
    }
    
    // Call Google Gemini Embeddings API
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
      {
        model: "models/text-embedding-004",
        content: { parts: [{ text }] }
      }
    );
    return response.data.embedding.values;
  } catch (err) {
    console.warn("⚠️ Embedding generation failed, using mock embedding:", err.message);
    return Array.from({ length: 768 }, () => Math.random());
  }
}

/**
 * Stores memory with embedding vector.
 * @param {string} category 'conversation' | 'semantic' | 'project' | 'knowledge'
 * @param {string} text 
 * @param {Object} metadata 
 */
export async function saveMemory(category, text, metadata = {}) {
  const vector = await generateEmbedding(text);
  const record = {
    id: Math.random().toString(36).substr(2, 9),
    category,
    text,
    metadata,
    vector,
    timestamp: Date.now()
  };
  
  // Save to local list (in production, insert into Qdrant index)
  localVectorDb.push(record);
  console.log(`[MemoryPipeline] Saved [${category}] memory. ID: ${record.id}`);
  return record;
}

/**
 * Query memories semantically.
 */
export async function queryMemory(category, queryText, limit = 5) {
  const queryVector = await generateEmbedding(queryText);
  
  // Basic Cosine Similarity
  function cosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  const results = localVectorDb
    .filter(mem => mem.category === category)
    .map(mem => ({
      text: mem.text,
      metadata: mem.metadata,
      similarity: cosineSimilarity(queryVector, mem.vector)
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);

  return results;
}
