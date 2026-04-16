const jwt = require('jsonwebtoken');

const authAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized as admin' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

module.exports = { authAdmin };
