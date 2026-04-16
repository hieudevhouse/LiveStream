const mongoose = require('mongoose');

const mainUri = process.env.MONGODB_URI;
if (!mainUri) {
  throw new Error('MONGODB_URI is required to connect to MongoDB Atlas');
}

const connectDB = async () => {
  try {
    await mongoose.connect(mainUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    });
    console.log('✅ Main MongoDB connected');
  } catch (error) {
    console.error('❌ Main MongoDB connection error:', error);
    throw error;
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ Main MongoDB disconnected');
});

module.exports = { mongoose, connectDB };
