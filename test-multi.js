// Test multiple results and deduplication
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function testMultipleResults() {
  const queries = ['dịch vụ', 'nguyễn'];

  for (const query of queries) {
    try {
      console.log('\n🔍 Testing: "' + query + '"');
      const res = await axios.get(BASE_URL + '/vector/search-lakehouse?q=' + encodeURIComponent(query));
      console.log('✅ Found ' + res.data.totalResults + ' results');

      const refIds = new Set();
      res.data.results.forEach((r, i) => {
        console.log('  ' + (i+1) + '. ' + r.title + ' (ID: ' + r.refId + ') - ' + r.similarityPercent + '%');
        refIds.add(r.refId);
      });

      console.log('Unique IDs: ' + refIds.size + ' (should equal total results)');

    } catch (err) {
      console.log('❌ Error: ' + err.message);
    }
  }
}

testMultipleResults();