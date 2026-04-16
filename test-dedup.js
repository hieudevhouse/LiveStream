// Test deduplication
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function testDeduplication() {
  try {
    console.log('🔍 Testing deduplication with: "vận tải"');
    const res = await axios.get(BASE_URL + '/vector/search-lakehouse?q=vận tải');
    console.log('✅ Found ' + res.data.totalResults + ' results');

    // Show details
    res.data.results.forEach((r, i) => {
      console.log('  ' + (i+1) + '. ' + r.title + ' (ID: ' + r.refId + ') - ' + r.similarityPercent + '%');
      console.log('     Collection: ' + r.metadata.collection);
      console.log('     Ingested: ' + r.metadata.ingestedAt);
    });

  } catch (err) {
    console.log('❌ Error:', err.response?.data || err.message);
  }
}

testDeduplication();