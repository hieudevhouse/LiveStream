const mongoose = require('mongoose');

const lakeUri = process.env.MONGODB_LAKEHOUSE_URI;
if (!lakeUri) {
  throw new Error('MONGODB_LAKEHOUSE_URI is required to connect to MongoDB Atlas lakehouse');
}

const connectLakehouseDB = () => {
  return new Promise((resolve, reject) => {
    const lakeConnection = mongoose.createConnection(lakeUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });

    lakeConnection.on('connected', () => {
      console.log('✅ Lakehouse DB connected');
      resolve(lakeConnection);
    });

    lakeConnection.on('error', (err) => {
      console.error('❌ Lakehouse DB error:', err);
      reject(err);
    });
  });
};

module.exports = connectLakehouseDB;