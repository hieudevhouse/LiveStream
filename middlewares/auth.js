const jwt = require('jsonwebtoken');

const authAdmin = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    if (decoded.role !== 'admin' && decoded.role !== 'operator') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

const onlyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Quyền truy cập bị từ chối. Chỉ dành cho Admin.' });
  }
};

module.exports = { authAdmin, onlyAdmin };
