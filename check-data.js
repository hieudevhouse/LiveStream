// Check lakehouse data
const axios = require('axios');
const BASE_URL = 'http://localhost:5000';

async function checkCollections() {
  try {
    const res = await axios.get(BASE_URL + '/vector/lakehouse-collections');
    console.log('Collections:');
    res.data.collections.forEach(col => {
      console.log(col.documentType + ': ' + col.documentCount + ' docs');
      if (col.sampleDocument) {
        console.log('  Sample: ' + col.sampleDocument.title + ' (' + col.sampleDocument.type + ')');
      }
    });
  } catch (err) {
    console.log('Error:', err.message);
  }
}

checkCollections();