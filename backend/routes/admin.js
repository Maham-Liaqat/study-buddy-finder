const express = require('express');
const router = express.Router();
const { User, Message, Request, Session, Notification } = require('../models');

// Admin middleware - you can add authentication later
const adminAuth = (req, res, next) => {
  // For now, allow all requests. You can add admin authentication later
  next();
};

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ 
      count: users.length, 
      users 
    });
  } catch (err) {
    console.error('Admin get users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Delete all users (admin only)
router.delete('/users', adminAuth, async (req, res) => {
  try {
    const result = await User.deleteMany({});
    console.log(`Admin deleted ${result.deletedCount} users`);
    res.json({ message: `Deleted ${result.deletedCount} users`, count: result.deletedCount });
  } catch (err) {
    console.error('Delete users error:', err);
    res.status(500).json({ error: 'Failed to delete users' });
  }
});

// Delete specific user by ID
router.delete('/users/:userId', adminAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await User.findByIdAndDelete(userId);
    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`Admin deleted user: ${userId}`);
    res.json({ 
      message: 'User deleted successfully',
      deletedUser: { id: userId, email: result.email }
    });
  } catch (err) {
    console.error('Admin delete user error:', err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get database statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    const requestCount = await Request.countDocuments();
    const sessionCount = await Session.countDocuments();
    const notificationCount = await Notification.countDocuments();

    res.json({
      users: userCount,
      messages: messageCount,
      requests: requestCount,
      sessions: sessionCount,
      notifications: notificationCount,
      total: userCount + messageCount + requestCount + sessionCount + notificationCount
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Failed to get statistics' });
  }
});

// Clear all data (nuclear option)
router.delete('/all', adminAuth, async (req, res) => {
  try {
    await User.deleteMany({});
    await Message.deleteMany({});
    await Request.deleteMany({});
    await Session.deleteMany({});
    await Notification.deleteMany({});
    res.json({ message: 'All data cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear data' });
  }
});

module.exports = router; 