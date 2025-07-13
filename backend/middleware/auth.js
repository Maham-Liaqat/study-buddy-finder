const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('No token provided or invalid format:', authHeader);
    return res.status(401).json({ error: 'No token provided or invalid format' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    console.log('Token is empty after splitting:', authHeader);
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    if (!decoded.userId) {
      console.log('Token payload does not contain userId:', decoded);
      return res.status(401).json({ error: 'Invalid token payload' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification error:', err.message, err.stack);
    if (err.name === 'TokenExpiredError') {
      console.log('Token has expired:', { token });
      return res.status(401).json({ error: 'Token has expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = verifyToken;