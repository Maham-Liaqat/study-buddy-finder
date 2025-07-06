const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Request, User, Notification, Match } = require('../models');
const verifyTokenMiddleware = require('../middleware/verifyToken');
const { body, validationResult } = require('express-validator');
const helmet = require('helmet');

// Test route to confirm the router is loaded
router.get('/test', (req, res) => {
  res.json({ message: 'Requests route is working' });
});

router.use(helmet());

router.post('/', [
  body('recipientId').notEmpty().withMessage('Recipient ID is required'),
  body('message').optional().trim(),
], verifyTokenMiddleware, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { recipientId, message = '' } = req.body;
  try {
    const senderId = req.user.userId;
    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ error: 'Invalid recipientId format' });
    }
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }
    if (senderId === recipientId) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }
    const existingRequest = await Request.findOne({
      senderId,
      recipientId,
      status: 'pending',
    });
    if (existingRequest) {
      return res.status(400).json({ error: 'Request already sent' });
    }
    const request = new Request({ senderId, recipientId, message });
    await request.save();
    
    // Create notification for recipient
    const sender = await User.findById(senderId, 'name');
    const notification = new Notification({
      userId: recipientId,
      type: 'request',
      message: `${sender.name} sent you a study buddy request`,
      relatedUserId: senderId,
    });
    await notification.save();
    
    res.status(201).json({ message: 'Request sent successfully', request });
  } catch (err) {
    console.error('Send request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Get all requests (sent and received) for the current user
router.get('/', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    // Get received requests
    const receivedRequests = await Request.find({
      recipientId: userId,
    }).populate('senderId', 'name email');
    
    // Get sent requests
    const sentRequests = await Request.find({
      senderId: userId,
    }).populate('recipientId', 'name email');
    
    // Format the data
    const formattedRequests = [
      ...receivedRequests.map(req => ({
        ...req.toObject(),
        isSent: false,
        senderName: req.senderId.name,
        recipientName: null
      })),
      ...sentRequests.map(req => ({
        ...req.toObject(),
        isSent: true,
        senderName: null,
        recipientName: req.recipientId.name
      }))
    ];
    
    res.json(formattedRequests);
  } catch (err) {
    console.error('Get requests error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

router.get('/received', verifyTokenMiddleware, async (req, res) => {
  try {
    const requests = await Request.find({
      recipientId: req.user.userId,
      status: 'pending',
    }).populate('senderId', 'name');
    res.json(requests);
  } catch (err) {
    console.error('Get received requests error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Accept a request
router.patch('/:id/accept', verifyTokenMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }
    
    // Update request status
    request.status = 'accepted';
    await request.save();
    
    // Create match
    const match = new Match({
      user1Id: request.senderId,
      user2Id: request.recipientId,
    });
    await match.save();
    
    // Create notifications for both users
    const sender = await User.findById(request.senderId, 'name');
    const recipient = await User.findById(request.recipientId, 'name');
    
    // Notification for sender (request accepted)
    const senderNotification = new Notification({
      userId: request.senderId,
      type: 'match',
      message: `${recipient.name} accepted your study buddy request!`,
      relatedUserId: request.recipientId,
    });
    await senderNotification.save();
    
    // Notification for recipient (match created)
    const recipientNotification = new Notification({
      userId: request.recipientId,
      type: 'match',
      message: `You and ${sender.name} are now study buddies!`,
      relatedUserId: request.senderId,
    });
    await recipientNotification.save();
    
    res.json({ message: 'Request accepted successfully' });
  } catch (err) {
    console.error('Accept request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject a request
router.patch('/:id/reject', verifyTokenMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }
    
    // Update request status
    request.status = 'rejected';
    await request.save();
    
    // Create notification for sender
    const recipient = await User.findById(request.recipientId, 'name');
    const notification = new Notification({
      userId: request.senderId,
      type: 'request',
      message: `${recipient.name} declined your study buddy request`,
      relatedUserId: request.recipientId,
    });
    await notification.save();
    
    res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    console.error('Reject request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// Generic update endpoint (keeping for backward compatibility)
router.patch('/:id', verifyTokenMiddleware, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const request = await Request.findById(id);
    if (!request) return res.status(404).json({ error: 'Request not found' });
    if (request.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    request.status = status;
    await request.save();
    res.json({ message: `Request ${status} successfully` });
  } catch (err) {
    console.error('Update request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to update request' });
  }
});

module.exports = router;