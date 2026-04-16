const VectorDocument = require("../models/vectorDocument");
const { createEmbedding } = require("./embedding.service");
const { removeAccents } = require("../utils/vietnamese-search");
const connectLakehouseDB = require("../config/db-lakehouse");
const { cosineSimilarity } = require("../utils/vector-similarity");

async function indexProductService(product) {
  try {
    // Build comprehensive text for embedding
    const text = `
  Name: ${product.name || 'N/A'}
  Field: ${product.businessField || 'N/A'}
  Description: ${product.description?.general || 'N/A'}
  Keywords: ${(product.description?.keywords && product.description.keywords.length > 0) ? product.description.keywords.join(", ") : 'N/A'}
  Type: ${product.type || 'N/A'}
  `.trim();

    if (!text || text.length === 0) {
      console.warn(`Skipping embedding for product ${product._id}: empty text`);
      return;
    }

    const embedding = await createEmbedding(text);

    // Create normalized Vietnamese version for text search
    const normalizedText = removeAccents(text);

    await VectorDocument.create({
      refId: product._id.toString(),
      refType: "product_service",
      title: product.name || 'Untitled',
      content: text,
      normalizedContent: normalizedText, // For Vietnamese search without accents
      embedding,
      metadata: {
        businessField: product.businessField,
        type: product.type,
        keywords: product.description?.keywords || [],
        productId: product.productId
      }
    });
  } catch (error) {
    console.error(`Error indexing product ${product._id}:`, error.message);
    throw error;
  }
}

async function rebuildFromLakehouse() {
  try {
    console.log('🔄 Starting vector rebuild from lakehouse...');

    // Connect to lakehouse DB
    const lakeConn = await connectLakehouseDB();

    // Get all collection names that match ProductService bronze pattern
    const collections = await lakeConn.db.listCollections().toArray();
    const productCollections = collections
      .filter(col => col.name.startsWith('Ingest_Bronze_ProductService_'))
      .map(col => col.name)
      .sort()
      .reverse(); // Most recent first

    if (productCollections.length === 0) {
      console.warn('⚠️ No ProductService bronze collections found in lakehouse');
      return { success: 0, errors: 0, message: 'No bronze collections found' };
    }

    console.log(`📊 Found ${productCollections.length} bronze collections: ${productCollections.join(', ')}`);

    // Clear existing vector documents for product_service
    await VectorDocument.deleteMany({ refType: 'product_service' });
    console.log('🗑️ Cleared existing product_service vector documents');

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    // Process each collection (most recent first)
    for (const collectionName of productCollections) {
      console.log(`📥 Processing collection: ${collectionName}`);

      const collection = lakeConn.collection(collectionName);
      const docs = await collection.find({}).toArray();

      console.log(`   Found ${docs.length} documents in ${collectionName}`);

      for (const doc of docs) {
        try {
          totalProcessed++;

          // Skip if already processed (check by originalId)
          const existing = await VectorDocument.findOne({
            refId: doc.originalId?.toString(),
            refType: 'product_service'
          });

          if (existing) {
            console.log(`   ⏭️ Skipping ${doc.originalId} (already indexed)`);
            continue;
          }

          // Build text for embedding (same logic as indexProductService)
          const text = `
  Name: ${doc.name || 'N/A'}
  Field: ${doc.businessField || 'N/A'}
  Description: ${doc.description?.general || 'N/A'}
  Keywords: ${(doc.description?.keywords && doc.description.keywords.length > 0) ? doc.description.keywords.join(", ") : 'N/A'}
  Type: ${doc.type || 'N/A'}
          `.trim();

          if (!text || text.length === 0) {
            console.warn(`   ⚠️ Skipping ${doc.originalId}: empty text`);
            continue;
          }

          const embedding = await createEmbedding(text);
          const normalizedText = removeAccents(text);

          await VectorDocument.create({
            refId: doc.originalId?.toString() || doc._id.toString(),
            refType: "product_service",
            title: doc.name || 'Untitled',
            content: text,
            normalizedContent: normalizedText,
            embedding,
            metadata: {
              businessField: doc.businessField,
              type: doc.type,
              keywords: doc.description?.keywords || [],
              productId: doc.productId,
              source: 'lakehouse',
              ingestedAt: doc.ingestedAt
            }
          });

          totalSuccess++;
          console.log(`   ✅ Indexed ${doc.name} (${doc.originalId})`);

        } catch (error) {
          totalErrors++;
          console.error(`   ❌ Error indexing ${doc.originalId}:`, error.message);
        }
      }
    }

    // Close lakehouse connection
    await lakeConn.close();

    const result = {
      success: totalSuccess,
      errors: totalErrors,
      processed: totalProcessed,
      collections: productCollections.length,
      message: `Rebuilt vector index from lakehouse: ${totalSuccess} success, ${totalErrors} errors from ${totalProcessed} documents`
    };

    console.log('🎉 Vector rebuild completed:', result);
    return result;

  } catch (error) {
    console.error('❌ Error rebuilding from lakehouse:', error.message);
    throw error;
  }
}

async function searchInLakehouse(queryText, limit = 10) {
  try {
    console.log(`🔍 Searching lakehouse for: "${queryText}"`);

    // Connect to lakehouse DB
    const lakeConn = await connectLakehouseDB();

    // Get all collection names that match ProductService bronze pattern
    const collections = await lakeConn.db.listCollections().toArray();
    const bronzeCollections = collections
      .filter(col => col.name.startsWith('Ingest_Bronze_'))
      .map(col => col.name)
      .sort()
      .reverse(); // Most recent first

    if (bronzeCollections.length === 0) {
      console.warn('⚠️ No bronze collections found in lakehouse');
      await lakeConn.close();
      return [];
    }

    console.log(`📊 Found ${bronzeCollections.length} bronze collections: ${bronzeCollections.join(', ')}`);

    // Create embedding for query
    const queryEmbedding = await createEmbedding(queryText);
    console.log(`✅ Query embedding created: ${queryEmbedding.length} dimensions`);

    let allResults = [];

    // Process each collection (most recent first, limit to 5 most recent for performance)
    const collectionsToSearch = bronzeCollections.slice(0, 5);

    for (const collectionName of collectionsToSearch) {
      console.log(`📥 Searching collection: ${collectionName}`);

      const collection = lakeConn.collection(collectionName);
      const docs = await collection.find({}).toArray();

      console.log(`   Found ${docs.length} documents in ${collectionName}`);

      // Process documents in batches to avoid overwhelming the embedding service
      const batchSize = 5;
      for (let i = 0; i < docs.length; i += batchSize) {
        const batch = docs.slice(i, i + batchSize);

        for (const doc of batch) {
          try {
            // Build text content based on document type
            let text = '';
            let title = '';
            let refType = '';

            if (collectionName.includes('ProductService')) {
              refType = 'product_service';
              title = doc.name || 'Untitled Product';
              text = `
  Name: ${doc.name || 'N/A'}
  Field: ${doc.businessField || 'N/A'}
  Description: ${doc.description?.general || 'N/A'}
  Keywords: ${(doc.description?.keywords && doc.description.keywords.length > 0) ? doc.description.keywords.join(", ") : 'N/A'}
  Type: ${doc.type || 'N/A'}
              `.trim();
            } else if (collectionName.includes('CollaborationNeed')) {
              refType = 'collaboration_need';
              title = `Collaboration Need - ${doc.businessOwnerId}`;
              text = `
  Business Owner: ${doc.businessOwnerId || 'N/A'}
  Product Service: ${doc.productServiceId || 'N/A'}
  Needs: ${(doc.needs && doc.needs.length > 0) ? doc.needs.map(n => `${n.type}: ${n.description}`).join(", ") : 'N/A'}
  Status: ${doc.status || 'N/A'}
              `.trim();
            } else if (collectionName.includes('BusinessOwner')) {
              refType = 'business_owner';
              title = doc.businessName || doc.individualName || 'Business Owner';
              text = `
  Ownership Type: ${doc.ownershipType || 'N/A'}
  Business Name: ${doc.businessName || 'N/A'}
  Individual Name: ${doc.individualName || 'N/A'}
  Business Field: ${doc.businessField || 'N/A'}
  Address: ${doc.address || doc.individualAddress || 'N/A'}
  Phone: ${doc.phone || doc.individualPhone || 'N/A'}
  Email: ${doc.email || doc.individualEmail || 'N/A'}
  Website: ${doc.website || 'N/A'}
  Tax Code: ${doc.taxCode || doc.individualTaxCode || 'N/A'}
              `.trim();
            } else {
              // Skip unknown collection types
              continue;
            }

            if (!text || text.length === 0) {
              continue;
            }

            // Create embedding for this document
            const docEmbedding = await createEmbedding(text);

            // Calculate similarity
            const similarity = cosineSimilarity(queryEmbedding, docEmbedding);

            // Only keep results above threshold
            if (similarity > 0.3) {
              allResults.push({
                refId: doc.originalId?.toString() || doc._id.toString(),
                refType: refType,
                title: title,
                content: text,
                similarity: similarity,
                similarityPercent: (similarity * 100).toFixed(2),
                metadata: {
                  source: 'lakehouse',
                  ingestedAt: doc.ingestedAt,
                  collection: collectionName,
                  // Include type-specific metadata
                  ...(refType === 'product_service' && {
                    businessField: doc.businessField,
                    type: doc.type,
                    keywords: doc.description?.keywords || []
                  }),
                  ...(refType === 'collaboration_need' && {
                    businessOwnerId: doc.businessOwnerId,
                    productServiceId: doc.productServiceId,
                    needs: doc.needs,
                    status: doc.status
                  }),
                  ...(refType === 'business_owner' && {
                    ownershipType: doc.ownershipType,
                    businessName: doc.businessName,
                    individualName: doc.individualName,
                    businessField: doc.businessField,
                    email: doc.email || doc.individualEmail,
                    phone: doc.phone || doc.individualPhone
                  })
                }
              });
            }

          } catch (error) {
            console.error(`   ❌ Error processing document ${doc.originalId}:`, error.message);
          }
        }
      }
    }

    // Close lakehouse connection
    await lakeConn.close();

    // Deduplicate results by refId - keep only the most recent version
    const deduplicatedResults = [];
    const seenRefIds = new Set();

    // Sort by similarity first (highest similarity), then by recency for same refId
    allResults.sort((a, b) => {
      // First sort by similarity (descending)
      if (b.similarity !== a.similarity) {
        return b.similarity - a.similarity;
      }
      // If same similarity, prefer more recent ingestedAt
      const aDate = new Date(a.metadata.ingestedAt || 0);
      const bDate = new Date(b.metadata.ingestedAt || 0);
      return bDate - aDate;
    });

    for (const result of allResults) {
      if (!seenRefIds.has(result.refId)) {
        seenRefIds.add(result.refId);
        deduplicatedResults.push(result);
      }
    }

    console.log(`📊 After deduplication: ${deduplicatedResults.length} unique results (removed ${allResults.length - deduplicatedResults.length} duplicates)`);
    return deduplicatedResults.slice(0, limit);

  } catch (error) {
    console.error('❌ Error searching lakehouse:', error.message);
    throw error;
  }
}

module.exports = {
  indexProductService,
  rebuildFromLakehouse,
  searchInLakehouse
};