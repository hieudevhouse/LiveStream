const authService = require('../services/auth.service');

const register = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.register(email, password);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const registerAuto = async (req, res) => {
  try {
    const { email } = req.body; // ❌ bỏ typeUser
    const { user, isDuplicate } = await authService.registerAuto(email);

    if (isDuplicate) {
      return res.json({
        user,
        message: 'Email đã được sử dụng, vui lòng sử dụng email khác'
      });
    }

    res.status(201).json({ user });
  } catch (error) {
    res.status(error.status || 500).json({
      message: error.message || 'Lỗi server'
    });
  }
};

const checkEmailExists = async (req, res) => {
  try {
    const { email } = req.query;
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({ message: 'Email là bắt buộc', exists: false });
    }

    const exists = await authService.checkEmailExists(email.trim());
    res.json({ exists, email: email.trim() });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message, exists: false });
  }
};

module.exports = { register, login, registerAuto, checkEmailExists };
