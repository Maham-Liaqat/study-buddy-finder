const express = require('express');
   const router = express.Router();
   const jwt = require('jsonwebtoken');
   const mongoose = require('mongoose');

   const MessageSchema = new mongoose.Schema({
     senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
     message: String,
     timestamp: { type: Date, default: Date.now },
   });

   const Message = mongoose.model('Message', MessageSchema);
   // Placeholder for messages routes
router.get('/', (req, res) => {
  res.json({ message: 'Messages route placeholder' });
});


   router.get('/:recipientId', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const messages = await Message.find({
         $or: [
           { senderId: decoded.userId, recipientId: req.params.recipientId },
           { senderId: req.params.recipientId, recipientId: decoded.userId },
         ],
       }).sort('timestamp');
       res.json(messages);
     } catch (err) {
       res.status(401).json({ error: 'Invalid token' });
     }
   });

   router.get('/recent', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const messages = await Message.aggregate([
         {
           $match: {
             recipientId: new mongoose.Types.ObjectId(decoded.userId),
           },
         },
         {
           $sort: { timestamp: -1 },
         },
         {
           $group: {
             _id: '$senderId',
             message: { $first: '$message' },
             timestamp: { $first: '$timestamp' },
           },
         },
         {
           $lookup: {
             from: 'users',
             localField: '_id',
             foreignField: '_id',
             as: 'sender',
           },
         },
         {
           $unwind: '$sender',
         },
         {
           $project: {
             _id: 1,
             message: 1,
             timestamp: 1,
             senderName: '$sender.name',
           },
         },
       ]);
       res.json(messages);
     } catch (err) {
       res.status(401).json({ error: 'Invalid token' });
     }
   });

   router.post('/', async (req, res) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ error: 'No token provided' });

     try {
       const decoded = jwt.verify(token, process.env.JWT_SECRET);
       const { recipientId, message } = req.body;
       const newMessage = new Message({
         senderId: decoded.userId,
         recipientId,
         message,
       });
       await newMessage.save();
       res.status(201).json({ message: 'Message sent' });
     } catch (err) {
       res.status(400).json({ error: err.message });
     }
   });

   module.exports = router;