/**
 * Script để sửa lỗi duplicate key error
 * Xóa các unique index không cần thiết trên businessOwnerId
 * Run: node scripts/fix-duplicate-index.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/tvad';

async function fixDuplicateIndex() {
  try {
    console.log('🔄 Đang kết nối MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✓ Kết nối thành công!');

    const db = mongoose.connection.db;

    // Kiểm tra và xóa index từ ProductService collection
    console.log('\n📋 Đang kiểm tra ProductService collection...');
    const productServiceIndexes = await db.collection('productservices').listIndexes().toArray();
    console.log('Các index hiện tại:', productServiceIndexes.map(idx => idx.name));

    for (const indexSpec of productServiceIndexes) {
      // Xóa unique index nếu nó chỉ có businessOwnerId và là unique
      if (indexSpec.unique && indexSpec.key && Object.keys(indexSpec.key).length === 1 && indexSpec.key.businessOwnerId === 1) {
        console.log(`⚠️ Tìm thấy unique index không cần thiết: ${indexSpec.name}`);
        try {
          await db.collection('productservices').dropIndex(indexSpec.name);
          console.log(`✓ Đã xóa index: ${indexSpec.name}`);
        } catch (error) {
          console.log(`⚠️ Không thể xóa index ${indexSpec.name}: ${error.message}`);
        }
      }
    }

    // Kiểm tra và xóa index từ CollaborationNeed collection
    console.log('\n📋 Đang kiểm tra CollaborationNeed collection...');
    const collaborationIndexes = await db.collection('collaborationneeds').listIndexes().toArray();
    console.log('Các index hiện tại:', collaborationIndexes.map(idx => idx.name));

    for (const indexSpec of collaborationIndexes) {
      // Xóa unique index nếu nó chỉ có businessOwnerId và là unique
      if (indexSpec.unique && indexSpec.key && Object.keys(indexSpec.key).length === 1 && indexSpec.key.businessOwnerId === 1) {
        console.log(`⚠️ Tìm thấy unique index không cần thiết: ${indexSpec.name}`);
        try {
          await db.collection('collaborationneeds').dropIndex(indexSpec.name);
          console.log(`✓ Đã xóa index: ${indexSpec.name}`);
        } catch (error) {
          console.log(`⚠️ Không thể xóa index ${indexSpec.name}: ${error.message}`);
        }
      }
    }

    console.log('\n✅ Hoàn tất! Lỗi duplicate key đã được sửa.');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối MongoDB');
  }
}

fixDuplicateIndex();
