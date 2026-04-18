require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedOperator = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to DB...');

        const operatorEmail = 'staff@tvad.com';
        const operatorPassword = 'staff123';

        let operator = await User.findOne({ email: operatorEmail });

        if (operator) {
            console.log('Operator user already exists. Updating password and role...');
            const salt = await bcrypt.genSalt(10);
            operator.password = await bcrypt.hash(operatorPassword, salt);
            operator.role = 'operator';
            await operator.save();
        } else {
            console.log('Creating new operator user...');
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(operatorPassword, salt);

            operator = new User({
                email: operatorEmail,
                password: hashedPassword,
                role: 'operator',
                isVerified: true
            });
            await operator.save();
        }

        console.log('Operator account seeded successfully:');
        console.log(`Email: ${operatorEmail}`);
        console.log(`Password: ${operatorPassword}`);
        console.log(`Role: operator`);

        process.exit(0);
    } catch (err) {
        console.error('Error seeding operator:', err);
        process.exit(1);
    }
};

seedOperator();
