// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const userRoutes = require('./routes/users');
// const requestRoutes = require('./routes/requests');
// const messageRoutes = require('./routes/messages');
// require('dotenv').config();

// const app = express();

// console.log('Starting backend server...');
// console.log('EMAIL_USER in app.js:', process.env.EMAIL_USER);
// console.log('EMAIL_PASS in app.js:', process.env.EMAIL_PASS ? 'Present' : 'Missing');
// console.log('Connecting to MongoDB with URI:', process.env.MONGODB_URI);

// // Validate MONGODB_URI
// if (!process.env.MONGODB_URI) {
//   console.error('MONGODB_URI is not defined in the environment variables. Please check your .env file.');
//   process.exit(1);
// }

// // Middleware
// app.use(cors({ origin: 'http://localhost:5173' }));
// app.use(express.json());

// // MongoDB Connection
// mongoose.connect(process.env.MONGODB_URI, {
//   serverSelectionTimeoutMS: 5001, // Timeout after 5 seconds
// })
//   .then(() => console.log('MongoDB connected'))
//   .catch(err => {
//     console.error('MongoDB connection error:', err.message, err.stack);
//     process.exit(1);
//   });

// // Routes
// app.use('/api/users', userRoutes);
// console.log('Users route loaded successfully');

// app.use('/api/requests', requestRoutes);
// console.log('Requests route loaded successfully');

// app.use('/api/messages', messageRoutes);
// console.log('Messages route loaded successfully');

// const PORT = process.env.PORT || 5001;
// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
//   console.log(`Listening on http://localhost:${PORT}`);
// });