// Test different queries
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function testDifferentQueries() {
  const queries = ['công ty', 'hợp tác', 'doanh nghiệp', 'nguyễn'];

  for (const query of queries) {
    try {
      console.log(`\n🔍 Testing: "${query}"`);
      const res = await axios.get(BASE_URL + '/vector/search-lakehouse?q=' + encodeURIComponent(query));
      console.log(`✅ Found ${res.data.totalResults} results`);
      if (res.data.results.length > 0) {
        res.data.results.forEach((r, i) => {
          console.log(`  ${i+1}. ${r.title} (${r.refType}) - ${r.similarityPercent}%`);
        });
      }
    } catch (err) {
      console.log(`❌ Error: ${err.message}`);
    }
  }
}

testDifferentQueries();