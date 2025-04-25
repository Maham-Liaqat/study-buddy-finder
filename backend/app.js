const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/users');
const requestRoutes = require('./routes/requests');
const messageRoutes = require('./routes/messages');
const matchRoutes = require('./routes/matches');
require('dotenv').config();

const app = express();

console.log('Starting backend server...');
console.log('EMAIL_USER in app.js:', process.env.EMAIL_USER);
console.log('EMAIL_PASS in app.js:', process.env.EMAIL_PASS ? 'Present' : 'Missing');
console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);

// Middleware
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err.message, err.stack));

// Routes
app.use('/api/users', userRoutes);
console.log('Users route loaded successfully');

try {
  app.use('/api/requests', requestRoutes);
  console.log('Requests route loaded successfully');
} catch (err) {
  console.error('Error loading request routes:', err.message);
}

try {
  app.use('/api/messages', messageRoutes);
  console.log('Messages route loaded successfully');
} catch (err) {
  console.error('Error loading message routes:', err.message);
}

try {
  app.use('/api/matches', matchRoutes);
  console.log('Matches route loaded successfully');
} catch (err) {
  console.error('Error loading match routes:', err.message);
}

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}`);
});