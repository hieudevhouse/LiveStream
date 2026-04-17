const mongoose = require('mongoose');
const Gift = require('./models/Gift');
require('dotenv').config();

const seedGift = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tvad');
    console.log('Connected to DB');

    await Gift.deleteMany({ codes: 'GIFT24' });

    const newGift = new Gift({
      codes: ['GIFT24', 'PHUCQUY', 'SPRING2024'],
      name: 'Giỏ Quà Nông Sản Xuân 2024',
      description: 'Giỏ quà gồm các loại nông sản tươi ngon chọn lọc, tặng kèm voucher giảm giá 20k.',
      imageUrl: 'https://images.pexels.com/photos/3952044/pexels-photo-3952044.jpeg',
      stock: 100,
      price: 0
    });

    await newGift.save();
    console.log('Seed gift success: GIFT24');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedGift();
