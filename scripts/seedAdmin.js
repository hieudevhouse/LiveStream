require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB...');

    const adminEmail = 'admin@tvad.com';
    const adminPassword = 'admin123';

    let admin = await User.findOne({ email: adminEmail });

    if (admin) {
      console.log('Admin user already exists. Updating password...');
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash(adminPassword, salt);
      admin.role = 'admin';
      await admin.save();
    } else {
      console.log('Creating new admin user...');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(adminPassword, salt);

      admin = new User({
        email: adminEmail,
        password: hashedPassword,
        role: 'admin',
        isVerified: true
      });
      await admin.save();
    }

    console.log('Admin account seeded successfully:');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err);
    process.exit(1);
  }
};

seedAdmin();
