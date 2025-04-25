const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Request, User } = require('../models');
const verifyTokenMiddleware = require('../middleware/verifyToken');

// Get all sent and received requests
router.get('/', verifyTokenMiddleware, async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all requests where the user is either the sender or recipient
    const requests = await Request.find({
      $or: [
        { senderId: userId },
        { recipientId: userId },
      ],
    }).sort({ createdAt: -1 });

    // Populate sender and recipient details
    const populatedRequests = await Promise.all(requests.map(async (request) => {
      const sender = await User.findById(request.senderId).select('name');
      const recipient = await User.findById(request.recipientId).select('name');
      return {
        ...request._doc,
        senderName: sender?.name || 'Unknown',
        recipientName: recipient?.name || 'Unknown',
        isSent: request.senderId.toString() === userId.toString(),
      };
    }));

    res.json(populatedRequests);
  } catch (err) {
    console.error('Get requests error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// Send a request
router.post('/', verifyTokenMiddleware, async (req, res) => {
  const { recipientId, message } = req.body;
  try {
    const senderId = req.user.userId;

    // Validate recipientId
    if (!mongoose.isValidObjectId(recipientId)) {
      return res.status(400).json({ error: 'Invalid recipientId format' });
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

    res.status(201).json({ message: 'Request sent successfully' });
  } catch (err) {
    console.error('Send request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to send request' });
  }
});

// Accept a request
router.patch('/:id/accept', verifyTokenMiddleware, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to accept this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    request.status = 'accepted';
    await request.save();

    res.json({ message: 'Request accepted successfully' });
  } catch (err) {
    console.error('Accept request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to accept request' });
  }
});

// Reject a request
router.patch('/:id/reject', verifyTokenMiddleware, async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.recipientId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized to reject this request' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ error: 'Request is not pending' });
    }

    request.status = 'rejected';
    await request.save();

    res.json({ message: 'Request rejected successfully' });
  } catch (err) {
    console.error('Reject request error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

module.exports = router;