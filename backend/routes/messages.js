const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Message, User, Notification } = require('../models');
const verifyTokenMiddleware = require('../middleware/verifyToken');

module.exports = (io) => {
  router.get('/', (req, res) => {
    res.json({ message: 'Messages route placeholder' });
  });

  router.get('/:recipientId', verifyTokenMiddleware, async (req, res) => {
    const { recipientId } = req.params;

    try {
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        console.log('Invalid recipientId format:', recipientId);
        return res.status(400).json({ error: 'Invalid recipientId format' });
      }

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        console.log('Invalid userId format:', req.user.userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      console.log('Fetching messages between userId:', req.user.userId, 'and recipientId:', recipientId);
      const messages = await Message.find({
        $or: [
          { senderId: req.user.userId, recipientId: recipientId },
          { senderId: recipientId, recipientId: req.user.userId },
        ],
      })
        .sort('createdAt')
        .populate('senderId', 'name avatar');

      await Message.updateMany(
        { senderId: recipientId, recipientId: req.user.userId, read: false },
        { $set: { read: true } }
      );

      res.json(messages);
    } catch (err) {
      console.error('Fetch messages error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to fetch messages: ${err.message}` });
    }
  });

  router.get('/recent', verifyTokenMiddleware, async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        console.log('Invalid userId format:', req.user.userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      console.log('Fetching recent messages for userId:', req.user.userId);

      const messages = await Message.aggregate([
        {
          $match: {
            recipientId: new mongoose.Types.ObjectId(req.user.userId),
            senderId: { $type: 'objectId' }, // Ensure senderId is a valid ObjectId
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
            senderAvatar: '$sender.avatar',
          },
        },
      ]);

      console.log('Found recent messages:', messages.length);
      res.json(messages);
    } catch (err) {
      console.error('Fetch recent messages error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to fetch messages: ${err.message}` });
    }
  });

  router.get('/unread-counts', verifyTokenMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;

      // Validate userId
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.error('Invalid userId format:', userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      console.log('Fetching unread counts for userId:', userId);
      const unreadCounts = await Message.aggregate([
        {
          $match: {
            recipientId: new mongoose.Types.ObjectId(userId),
            read: false,
            senderId: { $type: 'objectId' }, // Ensure senderId is a valid ObjectId
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

      // Convert array to object for easier frontend access
      const unreadCountsMap = unreadCounts.reduce((acc, item) => {
        acc[item.senderId.toString()] = { count: item.count, senderName: item.senderName };
        return acc;
      }, {});

      console.log('Found unread counts:', unreadCounts.length);
      res.json(unreadCountsMap);
    } catch (err) {
      console.error('Fetch unread counts error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to fetch unread message counts: ${err.message}` });
    }
  });

  router.post('/', verifyTokenMiddleware, async (req, res) => {
    try {
      if (!mongoose.Types.ObjectId.isValid(req.user.userId)) {
        console.log('Invalid userId format:', req.user.userId);
        return res.status(400).json({ error: 'Invalid user ID format' });
      }

      const sender = await User.findById(req.user.userId);
      if (!sender) {
        console.log('Sender not found for userId:', req.user.userId);
        return res.status(404).json({ error: 'Sender not found' });
      }

      const { recipientId, message } = req.body;
      if (!recipientId) {
        console.log('Recipient ID is missing in request body');
        return res.status(400).json({ error: 'Recipient ID is required' });
      }
      if (!mongoose.Types.ObjectId.isValid(recipientId)) {
        console.log('Invalid recipientId format:', recipientId);
        return res.status(400).json({ error: 'Invalid recipientId format' });
      }
      if (!message) {
        console.log('Message is missing in request body');
        return res.status(400).json({ error: 'Message is required' });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        console.log('Recipient not found for recipientId:', recipientId);
        return res.status(404).json({ error: 'Recipient not found' });
      }

      const newMessage = new Message({
        senderId: req.user.userId,
        recipientId,
        message,
        createdAt: new Date(),
        read: false,
      });
      await newMessage.save();
      console.log('Message saved successfully:', newMessage._id);

      const notification = new Notification({
        userId: recipientId,
        type: 'message',
        message: `New message from ${sender.name}`,
        relatedUserId: req.user.userId,
        read: false,
        createdAt: new Date(),
      });
      await notification.save();
      console.log('Notification created:', notification._id);

      io.to(recipientId).emit('newNotification', {
        _id: notification._id,
        userId: recipientId,
        type: 'message',
        message: `New message from ${sender.name}`,
        relatedUserId: req.user.userId,
        read: false,
        createdAt: notification.createdAt,
        relatedUserIdData: { _id: sender._id, name: sender.name },
      });

      res.status(201).json({ message: 'Message sent successfully', data: newMessage });
    } catch (err) {
      console.error('Send message error:', err.message, err.stack);
      res.status(500).json({ error: `Failed to send message: ${err.message}` });
    }
  });

  return router;
};