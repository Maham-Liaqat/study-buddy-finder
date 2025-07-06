const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Message, User, Notification } = require('../models');
const verifyTokenMiddleware = require('../middleware/verifyToken');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');
const multer = require('multer');
const path = require('path');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

module.exports = (io) => {
  router.use(helmet());

  router.get('/', (req, res) => {
    res.json({ message: 'Messages route placeholder' });
  });

  // GET /api/messages/unread-counts - Fetch unread message counts for all matches
  router.get('/unread-counts', verifyTokenMiddleware, async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        console.log('GET /api/messages/unread-counts - Authentication failed: req.user is undefined or missing userId');
        return res.status(401).json({ error: 'Authentication failed: No user data found' });
      }

      const userId = req.user.userId;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('GET /api/messages/unread-counts - Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      console.log('GET /api/messages/unread-counts - Fetching unread counts for userId:', userId);
      const unreadCounts = await Message.aggregate([
        {
          $match: {
            recipientId: new mongoose.Types.ObjectId(userId),
            read: false,
            senderId: { $type: 'objectId' },
          },
        },
        {
          $group: {
            _id: '$senderId',
            count: { $sum: 1 },
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
            senderId: '$_id',
            count: 1,
            senderName: '$sender.name',
          },
        },
      ]);

      const unreadCountsMap = unreadCounts.reduce((acc, item) => {
        acc[item.senderId.toString()] = { count: item.count, senderName: item.senderName };
        return acc;
      }, {});

      console.log('GET /api/messages/unread-counts - Found unread counts:', unreadCounts.length);
      res.json(unreadCountsMap);
    } catch (err) {
      console.error('GET /api/messages/unread-counts - Fetch unread counts error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to fetch unread message counts: ${err.message}` });
    }
  });

  // GET /api/messages/recent - Fetch recent messages for the logged-in user
  router.get('/recent', verifyTokenMiddleware, async (req, res) => {
    try {
      if (!req.user || !req.user.userId) {
        console.log('GET /api/messages/recent - Authentication failed: req.user is undefined or missing userId');
        return res.status(401).json({ error: 'Authentication failed: No user data found' });
      }

      if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        console.log('GET /api/messages/recent - Invalid userId format:', req.user.userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      console.log('GET /api/messages/recent - Fetching recent messages for userId:', req.user.userId);

      const messages = await Message.aggregate([
        {
          $match: {
            recipientId: new mongoose.Types.ObjectId(req.user.userId),
            senderId: { $type: 'objectId' },
          },
        },
        {
          $sort: { createdAt: -1 },
        },
        {
          $group: {
            _id: '$senderId',
            message: { $first: '$message' },
            createdAt: { $first: '$createdAt' },
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
            createdAt: 1,
            senderName: '$sender.name',
          },
        },
      ]);

      console.log('GET /api/messages/recent - Found recent messages:', messages.length);
      res.json(messages);
    } catch (err) {
      console.error('GET /api/messages/recent - Fetch recent messages error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to fetch messages: ${err.message}` });
    }
  });

  // GET /api/messages/:recipientId - Fetch messages between the logged-in user and a recipient
  router.get('/:recipientId', verifyTokenMiddleware, async (req, res) => {
    const { recipientId } = req.params;

    try {
      console.log('GET /api/messages/:recipientId - Request params:', { recipientId });
      console.log('GET /api/messages/:recipientId - Request user:', req.user);

      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        console.log('GET /api/messages/:recipientId - Invalid recipientId format:', recipientId);
        return res.status(400).json({ error: 'Invalid recipientId format' });
      }

      if (!req.user || !req.user.userId) {
        console.log('GET /api/messages/:recipientId - Authentication failed: req.user is undefined or missing userId');
        return res.status(401).json({ error: 'Authentication failed: No user data found' });
      }

      if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        console.log('GET /api/messages/:recipientId - Invalid userId format:', req.user.userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      console.log('GET /api/messages/:recipientId - Fetching messages between userId:', req.user.userId, 'and recipientId:', recipientId);
      const messages = await Message.find({
        $or: [
          { senderId: req.user.userId, recipientId: recipientId },
          { senderId: recipientId, recipientId: req.user.userId },
        ],
      })
        .sort('createdAt')
        .populate('senderId', 'name');

      console.log('GET /api/messages/:recipientId - Messages found:', messages.length);

      await Message.updateMany(
        { senderId: recipientId, recipientId: req.user.userId, read: false },
        { $set: { read: true } }
      );

      res.json(messages);
    } catch (err) {
      console.error('GET /api/messages/:recipientId - Fetch messages error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to fetch messages: ${err.message}` });
    }
  });

  // POST /api/messages - Send a new message
  router.post('/', [
    body('recipientId').notEmpty().withMessage('Recipient ID is required'),
    body('message').trim().optional(),
  ], verifyTokenMiddleware, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!req.user || !req.user.userId) {
        console.log('POST /api/messages - Authentication failed: req.user is undefined or missing userId');
        return res.status(401).json({ error: 'Authentication failed: No user data found' });
      }
      const { recipientId, message, fileUrl } = req.body;
      if (!message && !fileUrl) {
        return res.status(400).json({ error: 'Message or file required' });
      }
      const msg = new Message({
        senderId: req.user.userId,
        recipientId,
        message,
        fileUrl,
      });
      await msg.save();
      res.status(201).json(msg);
    } catch (err) {
      console.error('POST /api/messages - Send message error:', err.message, err.stack);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // POST /api/messages/upload - Upload a file for a message
  router.post('/upload', verifyTokenMiddleware, upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ fileUrl });
  });

  // PATCH /api/messages/:id - Edit a message (sender only)
  router.patch('/:id', verifyTokenMiddleware, async (req, res) => {
    try {
      const msg = await Message.findById(req.params.id);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      if (msg.senderId.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
      msg.message = req.body.message;
      msg.edited = true;
      await msg.save();
      res.json(msg);
    } catch (err) {
      res.status(500).json({ error: 'Failed to edit message' });
    }
  });

  // DELETE /api/messages/:id - Delete a message (sender only)
  router.delete('/:id', verifyTokenMiddleware, async (req, res) => {
    try {
      const msg = await Message.findById(req.params.id);
      if (!msg) return res.status(404).json({ error: 'Message not found' });
      if (msg.senderId.toString() !== req.user.userId) return res.status(403).json({ error: 'Unauthorized' });
      await msg.deleteOne();
      res.json({ message: 'Message deleted' });
    } catch (err) {
      res.status(500).json({ error: 'Failed to delete message' });
    }
  });

  return router;
};