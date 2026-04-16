// Quick test for search
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function testSearch() {
  try {
    console.log('🔍 Testing search with: "dịch vụ vận tải"');
    const res = await axios.get(BASE_URL + '/vector/search?q=dịch vụ vận tải');
    console.log('✅ Search Results:', JSON.stringify(res.data, null, 2));

    console.log('\n🔍 Testing direct lakehouse search...');
    const lakeRes = await axios.get(BASE_URL + '/vector/search-lakehouse?q=dịch vụ vận tải');
    console.log('✅ Lakehouse Search Results:', JSON.stringify(lakeRes.data, null, 2));

  } catch (err) {
    console.log('❌ Error:', err.response?.data || err.message);
  }
}

testSearch();