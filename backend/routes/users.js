const express = require('express');
   const router = express.Router();
   const bcrypt = require('bcryptjs');
   const jwt = require('jsonwebtoken');
   const User = require('../models/User');

   // Register
   router.post('/register', async (req, res) => {
     const { name, email, password, university } = req.body;
     try {
       let user = await User.findOne({ email });
       if (user) return res.status(400).json({ error: 'User already exists' });

       user = new User({ name, email, password, university });
       user.password = await bcrypt.hash(password, 10);
       await user.save();

       res.status(201).json({ message: 'User registered' });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });

   // Login
   router.post('/login', async (req, res) => {
     const { email, password } = req.body;
     try {
       const user = await User.findOne({ email });
       if (!user) return res.status(400).json({ error: 'User not found' });

       const isMatch = await bcrypt.compare(password, user.password);
       if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

       const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET);
       res.json({ token, user: { id: user._id, name: user.name } });
     } catch (err) {
       res.status(500).json({ error: err.message });
     }
   });

   // Get User Profile
   router.get('/me', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const user = await User.findById(decoded.userId).select('-password');
       if (!user) return res.status(404).json({ error: 'User not found' });
       res.json(user);
     } catch (err) {
       res.status(401).json({ error: 'Invalid token' });
     }
   });

   // Update User Profile
   router.patch('/me', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const updates = req.body;
       const user = await User.findByIdAndUpdate(decoded.userId, updates, {
         new: true,
       }).select('-password');
       if (!user) return res.status(404).json({ error: 'User not found' });
       res.json(user);
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   });

   // Search Users
   router.get('/search', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const { subject, availability, location } = req.query;
       const query = { _id: { $ne: decoded.userId } };
       if (subject) query['subjects.name'] = subject;
       if (availability) query.availability = availability;
       if (location) query.location = location;
       const users = await User.find(query).select('-password');
       res.json(users);
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   });

   module.exports = router;