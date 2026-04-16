/**
 * Vector similarity calculations
 */

/**
 * Calculate cosine similarity between two vectors
 * Returns value between -1 and 1 (1 = identical, 0 = orthogonal, -1 = opposite)
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  normA = Math.sqrt(normA);
  normB = Math.sqrt(normB);

  if (normA === 0 || normB === 0) {
    return 0; // One vector is zero
  }

  return dotProduct / (normA * normB);
}

/**
 * Calculate euclidean distance between two vectors
 * Returns distance (0 = identical, larger = more different)
 */
function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length) {
    return Infinity;
  }

  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
}

/**
 * Find k-nearest neighbors by vector similarity
 * Returns results sorted by similarity (highest first)
 */
function findNearestNeighbors(queryVector, documents, k = 10) {
  // Ensure embeddings are arrays of numbers
  const validated = documents
    .filter(doc => doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length > 0)
    .map(doc => ({
      ...doc,
      similarity: cosineSimilarity(queryVector, doc.embedding)
    }));

  return validated
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, k)
    .filter(doc => doc.similarity > 0); // Only return positive similarity
}

module.exports = {
  cosineSimilarity,
  euclideanDistance,
  findNearestNeighbors
};
