const mongoose = require('mongoose');
require('dotenv').config();
const { indexProductService } = require('../services/vector.service');
const ProductService = require('../models/ProductService');

async function runReindex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tvad-form-api');
    console.log('Connected to MongoDB');

    const products = await ProductService.find();
    console.log(`Found ${products.length} products to index.`);

    for (const p of products) {
      try {
        await indexProductService(p);
        console.log(`✓ Indexed: ${p.name}`);
      } catch (e) {
        console.error(`✗ Failed: ${p.name} - ${e.message}`);
      }
    }

    console.log('Reindexing complete.');
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err);
    process.exit(1);
  }
}

runReindex();
