const express = require("express");
const router = express.Router();

const VectorDocument = require("../models/vectorDocument");
const { createEmbedding } = require("../services/embedding.service");
const { removeAccents, generateSearchVariations } = require("../utils/vietnamese-search");
const { findNearestNeighbors, cosineSimilarity } = require("../utils/vector-similarity");
const { searchInLakehouse } = require("../services/vector.service");

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.render("vector-search", {
        query: q,
        results: [],
        error: null
      });
    }

    console.log(`🔍 Vector search query: "${q}"`);

    const queryEmbedding = await createEmbedding(q);
    console.log(`✅ Embedding created: ${queryEmbedding.length} dimensions`);

    const maxResults = 4;
    let results = [];
    let searchMethod = "unknown";
    
    // Direct lakehouse vector similarity search
    try {
      console.log('🎯 Searching directly in lakehouse with vector similarity...');
      
      results = await searchInLakehouse(q, maxResults);
      
      if (results.length > 0) {
        results = results.map(doc => ({
          ...doc,
          searchMethod: 'lakehouse-vector',
          similarityPercent: doc.similarityPercent ?? (typeof doc.similarity === 'number' ? (doc.similarity * 100).toFixed(2) : doc.similarity)
        }));
        console.log(`📊 Lakehouse vector search found ${results.length} results`);
        searchMethod = "lakehouse-vector";
      } else {
        console.warn('⚠️ Lakehouse search returned 0 results');
        searchMethod = "none";
      }
    } catch (lakehouseError) {
      console.warn('⚠️ Lakehouse search error:', lakehouseError.message);
      searchMethod = "error";
    }

    // Fallback to vectorDocument if lakehouse fails
    if (results.length === 0) {
      console.warn('⚠️ Lakehouse search returned 0 results, trying vectorDocument fallback...');
      try {
        // Get ALL vector documents with embeddings
        const allDocs = await VectorDocument.find({
          embedding: { $exists: true, $type: "array" }
        }).lean();
        
        if (allDocs.length > 0) {
          // Convert embedding field to array if needed
          const docsWithValidEmbeddings = allDocs
            .filter(doc => Array.isArray(doc.embedding) && doc.embedding.length > 0)
            .map(doc => ({
              ...doc,
              similarity: cosineSimilarity(queryEmbedding, doc.embedding)
            }));
          
          // Sort by similarity and get top matches
          results = docsWithValidEmbeddings
            .filter(doc => doc.similarity > 0.3) // Threshold: 0.3 similarity
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, maxResults)
            .map(doc => {
              const { similarity, embedding, ...rest } = doc;
              return {
                ...rest,
                similarity: (similarity * 100).toFixed(2), // Convert to percentage
                searchMethod: 'vector-fallback'
              };
            });
          
          console.log(`📊 Vector fallback found ${results.length} results (similarity > 0.3)`);
          searchMethod = "vector-fallback";
        }
      } catch (vectorError) {
        console.warn('⚠️ Vector fallback error:', vectorError.message);
      }
    }

    // Final fallback to text search if all vector searches fail
    if (results.length === 0) {
      console.warn('⚠️ All vector searches failed, trying text search fallback...');
      results = await searchByText(q);
      results = results
        .slice(0, maxResults)
        .map(doc => ({ ...doc, searchMethod: 'text' }));
      console.log(`📊 Text search fallback returned ${results.length} results`);
      searchMethod = "text";
    }

    res.render("vector-search", {
      query: q,
      results: results || [],
      error: null,
      searchMethod
    });
  } catch (error) {
    console.error('❌ Vector search error:', error.message);
    console.error('Stack:', error.stack);
    
    res.status(500).render("vector-search", {
      query: req.query.q,
      results: [],
      error: `Search error: ${error.message}`
    });
  }
});

/**
 * Advanced text search with multiple criteria
 * 1. Accent-normalized search (van tai = vận tải)
 * 2. Regex search on title/content
 * 3. Keyword/field search
 * 4. Typo tolerance with partial word matching
 */
async function searchByText(query) {
  const normalizedQuery = removeAccents(query);
  const searchVariations = generateSearchVariations(query);
  
  console.log(`  Searching with variations: [${searchVariations.join(", ")}]`);
  
  // Build complex search query
  const regexQueries = searchVariations.map(variation => ({
    $or: [
      { title: { $regex: variation, $options: 'i' } },
      { content: { $regex: variation, $options: 'i' } },
      { normalizedContent: { $regex: removeAccents(variation), $options: 'i' } },
      { "metadata.businessField": { $regex: variation, $options: 'i' } },
      { "metadata.keywords": { $in: [new RegExp(variation, 'i')] } }
    ]
  }));
  
  // Search using MongoDB text index
  const textSearchResults = await VectorDocument.find({
    $or: regexQueries
  }).limit(10).lean();
  
  return textSearchResults || [];
}

// Similarity comparison endpoint - searches directly in lakehouse
router.get("/compare", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        query: null,
        error: "Search query required"
      });
    }

    console.log(`📊 Similarity comparison for: "${q}"`);

    // Search directly in lakehouse with higher limit for comparison
    const results = await searchInLakehouse(q, 20);

    res.json({
      query: q,
      totalDocuments: results.length,
      searchMethod: 'lakehouse-vector',
      comparisons: results.map(doc => ({
        title: doc.title,
        refType: doc.refType,
        similarity: doc.similarity,
        similarityPercent: doc.similarityPercent,
        metadata: doc.metadata
      }))
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
});

// New endpoint to check vector database status
router.get("/status", async (req, res) => {
  try {
    const ProductService = require("../models/productService.model");
    
    const totalVectorDocs = await VectorDocument.countDocuments();
    const totalProducts = await ProductService.countDocuments();
    const sampleDoc = await VectorDocument.findOne();

    // Check lakehouse status
    let lakehouseStatus = { connected: false, collections: 0, totalDocs: 0 };
    try {
      const connectLakehouseDB = require("../config/db-lakehouse");
      const lakeConn = await connectLakehouseDB();
      
      const collections = await lakeConn.db.listCollections().toArray();
      const productCollections = collections.filter(col => col.name.startsWith('Ingest_Bronze_ProductService_'));
      
      let totalLakehouseDocs = 0;
      for (const col of productCollections) {
        const count = await lakeConn.collection(col.name).countDocuments();
        totalLakehouseDocs += count;
      }
      
      lakehouseStatus = {
        connected: true,
        collections: productCollections.length,
        totalDocs: totalLakehouseDocs
      };
      
      await lakeConn.close();
    } catch (lakeError) {
      lakehouseStatus.error = lakeError.message;
    }
    
    res.json({
      status: "ok",
      vectorDocuments: totalVectorDocs,
      productServices: totalProducts,
      hasSampleDocument: !!sampleDoc,
      sampleDocument: sampleDoc || null,
      lakehouse: lakehouseStatus
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Index all products endpoint
router.post("/reindex-all", async (req, res) => {
  try {
    const ProductService = require("../models/productService.model");
    const { indexProductService } = require("../services/vector.service");
    
    const products = await ProductService.find();
    console.log(`Found ${products.length} products to index`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const product of products) {
      try {
        await indexProductService(product);
        successCount++;
      } catch (err) {
        console.error(`Error indexing product ${product._id}:`, err.message);
        errorCount++;
      }
    }
    
    res.json({
      status: "ok",
      message: `Reindexed ${successCount} products, ${errorCount} errors`,
      totalProducts: products.length,
      successCount,
      errorCount
    });
  } catch (error) {
    console.error('Reindex error:', error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Rebuild vector index from lakehouse data
router.post("/rebuild-from-lakehouse", async (req, res) => {
  try {
    const { rebuildFromLakehouse } = require("../services/vector.service");

    console.log('🚀 Starting rebuild from lakehouse...');
    const result = await rebuildFromLakehouse();

    res.json({
      status: "ok",
      ...result
    });
  } catch (error) {
    console.error('Rebuild from lakehouse error:', error);
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Direct lakehouse search endpoint (no fallbacks)
router.get("/search-lakehouse", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim().length === 0) {
      return res.json({
        query: q,
        results: [],
        error: "Search query required"
      });
    }

    console.log(`🔍 Direct lakehouse search query: "${q}"`);

    const results = await searchInLakehouse(q, 10);

    res.json({
      query: q,
      results: results,
      totalResults: results.length,
      searchMethod: 'lakehouse-vector'
    });
  } catch (error) {
    console.error('❌ Direct lakehouse search error:', error.message);
    res.status(500).json({
      error: error.message
    });
  }
});

// List lakehouse collections
router.get("/lakehouse-collections", async (req, res) => {
  try {
    const connectLakehouseDB = require("../config/db-lakehouse");
    const lakeConn = await connectLakehouseDB();
    
    const collections = await lakeConn.db.listCollections().toArray();
    const bronzeCollections = collections.filter(col => col.name.startsWith('Ingest_Bronze_'));
    
    const collectionDetails = [];
    for (const col of bronzeCollections) {
      const count = await lakeConn.collection(col.name).countDocuments();
      const sample = await lakeConn.collection(col.name).findOne();
      
      // Determine document type from collection name
      let docType = 'Unknown';
      if (col.name.includes('ProductService')) docType = 'ProductService';
      else if (col.name.includes('CollaborationNeed')) docType = 'CollaborationNeed';
      else if (col.name.includes('BusinessOwner')) docType = 'BusinessOwner';
      
      collectionDetails.push({
        name: col.name,
        documentType: docType,
        documentCount: count,
        sampleDocument: sample ? {
          id: sample.originalId,
          title: sample.name || sample.businessName || sample.individualName || `Collaboration-${sample.businessOwnerId}`,
          type: sample.type || sample.ownershipType || 'N/A'
        } : null
      });
    }
    
    await lakeConn.close();
    
    res.json({
      status: "ok",
      totalCollections: collections.length,
      bronzeCollections: bronzeCollections.length,
      collections: collectionDetails
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

// Check what products are available
router.get("/products-check", async (req, res) => {
  try {
    const ProductService = require("../models/productService.model");
    
    const products = await ProductService.find().limit(5);
    
    res.json({
      status: "ok",
      totalProducts: await ProductService.countDocuments(),
      sampleProducts: products.map(p => ({
        id: p._id,
        name: p.name,
        businessField: p.businessField,
        hasDescription: !!p.description?.general
      }))
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

module.exports = router;