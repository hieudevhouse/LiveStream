const mongoose = require('mongoose');
require('dotenv').config();

async function checkMainDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Main DB');
    const collections = await mongoose.connection.db.listCollections().toArray();
    for (const col of collections) {
      const count = await mongoose.connection.db.collection(col.name).countDocuments();
      console.log(`${col.name}: ${count} documents`);
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkMainDB();