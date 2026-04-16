// Test script for vector search APIs
const axios = require('axios');

const BASE_URL = 'http://localhost:3000'; // Adjust if different

async function testVectorAPIs() {
  console.log('🧪 Testing Vector Search APIs...\n');

  try {
    // Test 1: Status check
    console.log('1. Testing /vector/status');
    const statusRes = await axios.get(`${BASE_URL}/vector/status`);
    console.log('✅ Status:', statusRes.data);
    console.log('');

    // Test 2: Lakehouse collections
    console.log('2. Testing /vector/lakehouse-collections');
    const collectionsRes = await axios.get(`${BASE_URL}/vector/lakehouse-collections`);
    console.log('✅ Collections:', collectionsRes.data);
    console.log('');

    // Test 3: Direct lakehouse search - Product Service
    console.log('3. Testing /vector/search-lakehouse?q=dịch vụ vận tải');
    const lakehouseSearchRes = await axios.get(`${BASE_URL}/vector/search-lakehouse?q=dịch vụ vận tải`);
    console.log('✅ Lakehouse Search Results:', lakehouseSearchRes.data);
    console.log('');

    // Test 4: Direct lakehouse search - Business Owner
    console.log('4. Testing /vector/search-lakehouse?q=công ty công nghệ');
    const businessSearchRes = await axios.get(`${BASE_URL}/vector/search-lakehouse?q=công ty công nghệ`);
    console.log('✅ Business Owner Search Results:', businessSearchRes.data);
    console.log('');

    // Test 5: Direct lakehouse search - Collaboration Need
    console.log('5. Testing /vector/search-lakehouse?q=hợp tác đầu tư');
    const collabSearchRes = await axios.get(`${BASE_URL}/vector/search-lakehouse?q=hợp tác đầu tư`);
    console.log('✅ Collaboration Need Search Results:', collabSearchRes.data);
    console.log('');

    // Test 6: Compare similarity
    console.log('6. Testing /vector/compare?q=kinh doanh');
    const compareRes = await axios.get(`${BASE_URL}/vector/compare?q=kinh doanh`);
    console.log('✅ Compare Results:', compareRes.data);
    console.log('');

    // Test 5: Main search (with fallbacks)
    console.log('5. Testing /vector/search?q=du lịch');
    const mainSearchRes = await axios.get(`${BASE_URL}/vector/search?q=du lịch`);
    console.log('✅ Main Search Results:', mainSearchRes.data);

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run tests
testVectorAPIs();