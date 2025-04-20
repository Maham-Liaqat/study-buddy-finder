const express = require('express');
   const router = express.Router();
   const jwt = require('jsonwebtoken');
   const mongoose = require('mongoose');

   const RequestSchema = new mongoose.Schema({
     senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     senderName: String,
     message: String,
     status: { type: String, default: 'pending' },
     createdAt: { type: Date, default: Date.now },
   });

   const Request = mongoose.model('Request', RequestSchema);

   router.post('/', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const { recipientId, message } = req.body;
       const sender = await mongoose.model('User').findById(decoded.userId);
       if (!sender) return res.status(404).json({ error: 'Sender not found' });

       const request = new Request({
         senderId: decoded.userId,
         recipientId,
         senderName: sender.name,
         message,
       });
       await request.save();
       res.status(201).json({ message: 'Request sent' });
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   });

   router.get('/', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const requests = await Request.find({
         recipientId: decoded.userId,
         status: 'pending',
       });
       res.json(requests);
     } catch (err) {
       res.status(401).json({ error: 'Invalid token' });
     }
   });

   router.patch('/:id', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const { action } = req.body;
       const request = await Request.findById(req.params.id);
       if (!request || request.recipientId.toString() !== decoded.userId) {
         return res.status(404).json({ error: 'Request not found' });
       }

       if (action === 'accept') {
         request.status = 'accepted';
       } else if (action === 'decline') {
         request.status = 'declined';
       }
       await request.save();
       res.json({ message: `Request ${action}ed` });
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   });

   module.exports = router;