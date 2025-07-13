const jwt = require('jsonwebtoken');

const verifyTokenMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    console.log('No token provided in request headers');
    return res.status(401).json({ error: 'No token provided' });
  }

  if (!process.env.JWT_SECRET) {
    console.error('JWT_SECRET is not defined in environment variables');
    return res.status(500).json({ error: 'Server configuration error: Missing JWT_SECRET' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decoded successfully:', decoded);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message, err.stack);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

module.exports = verifyTokenMiddleware;