let embeddingPipeline = null;
let pipeline = null;

async function initializeEmbeddingPipeline() {
  if (!embeddingPipeline) {
    try {
      if (!pipeline) {
        const transformers = await import('@xenova/transformers');
        pipeline = transformers.pipeline;
      }
      console.log('Initializing embedding pipeline...');
      embeddingPipeline = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      console.log('Embedding pipeline initialized');
    } catch (error) {
      console.error('Error initializing embedding pipeline:', error);
      throw error;
    }
  }
  return embeddingPipeline;
}

async function createEmbedding(text) {
  try {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Text must be a non-empty string');
    }
    
    const pipe = await initializeEmbeddingPipeline();
    
    const output = await pipe(text, {
      pooling: 'mean',
      normalize: true
    });

    // Convert tensor to array
    const embedding = Array.from(output.data);
    return embedding;
  } catch (error) {
    console.error('Error creating embedding:', error.message);
    throw error;
  }
}

module.exports = {
  createEmbedding
};