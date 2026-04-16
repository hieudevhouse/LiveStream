const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const register = async (email, password) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const err = new Error('Email already registered');
    err.status = 400;
    throw err;
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = new User({ email, password: hashedPassword });
  await user.save();

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );

  return { user, token };
};

const login = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const err = new Error('Invalid credentials');
    err.status = 400;
    throw err;
  }

  const token = jwt.sign(
    { userId: user._id },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );

  return { user, token };
};

const registerAuto = async (email) => {
  if (!email) {
    const err = new Error('Thiếu email');
    err.status = 400;
    throw err;
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return { user: existingUser, isDuplicate: true };
  }

  const user = await User.create({
    email,
    password: null, // user sẽ set sau
    role: 'customer',
    isVerified: false
  });

  return { user, isDuplicate: false };
};

const checkEmailExists = async (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }
  const user = await User.findOne({ email: email.trim() });
  return !!user;
};

module.exports = { register, login, registerAuto, checkEmailExists };
