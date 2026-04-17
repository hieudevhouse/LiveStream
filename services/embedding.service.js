async function createEmbedding(text) {
  // Vector search temporarily disabled per user request
  console.log('Vector embedding is currently disabled. Skipping...');
  return [];
}

module.exports = {
  createEmbedding
};