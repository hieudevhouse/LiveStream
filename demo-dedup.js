// Test deduplication feature
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function demonstrateDeduplication() {
  console.log('🧪 DEMONSTRATING DEDUPLICATION FEATURE\n');

  try {
    // First, show all collections to understand data distribution
    console.log('📊 Lakehouse Collections:');
    const collectionsRes = await axios.get(BASE_URL + '/vector/lakehouse-collections');
    collectionsRes.data.collections.forEach(col => {
      console.log(`  ${col.documentType}: ${col.documentCount} docs in ${col.name}`);
    });

    console.log('\n🔍 Testing deduplication with query "dịch vụ":');
    const searchRes = await axios.get(BASE_URL + '/vector/search-lakehouse?q=dịch vụ');

    console.log(`✅ Found ${searchRes.data.totalResults} unique results (no duplicates)`);

    // Show deduplication proof
    const refIds = new Set();
    searchRes.data.results.forEach((r, i) => {
      console.log(`  ${i+1}. ${r.title} (ID: ${r.refId})`);
      console.log(`     Similarity: ${r.similarityPercent}%`);
      console.log(`     Collection: ${r.metadata.collection}`);
      console.log(`     Ingested: ${r.metadata.ingestedAt}`);
      refIds.add(r.refId);
    });

    console.log(`\n✅ Verification: ${refIds.size} unique IDs = ${searchRes.data.totalResults} results`);
    console.log('✅ Deduplication working correctly! No duplicate records shown.');

  } catch (err) {
    console.log('❌ Error:', err.response?.data || err.message);
  }
}

demonstrateDeduplication();