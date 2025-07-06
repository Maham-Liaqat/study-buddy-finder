const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { Session, User, Notification } = require('../models');
const verifyToken = require('../middleware/verifyToken');

// Session reminder scheduler
const scheduleSessionReminders = async () => {
  try {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    
    // Find sessions starting in the next 10 minutes
    const upcomingSessions = await Session.find({
      startTime: { 
        $gte: now, 
        $lte: tenMinutesFromNow 
      },
      reminderSent: { $ne: true } // Only send reminder once
    }).populate('participants', 'name');

    for (const session of upcomingSessions) {
      // Create reminder notifications for all participants
      for (const participant of session.participants) {
        const existingNotification = await Notification.findOne({
          userId: participant._id,
          sessionId: session._id,
          type: 'session',
          message: { $regex: 'reminder' }
        });

        if (!existingNotification) {
          await Notification.create({
            userId: participant._id,
            type: 'session',
            message: `Reminder: Your study session "${session.title}" starts in 10 minutes!`,
            sessionId: session._id,
            read: false
          });
        }
      }
      
      // Mark reminder as sent
      session.reminderSent = true;
      await session.save();
    }
  } catch (error) {
    console.error('Error scheduling session reminders:', error);
  }
};

// Run reminder check every minute
setInterval(scheduleSessionReminders, 60 * 1000);

// Get all sessions for the current user (as participant or creator)
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sessions = await Session.find({ participants: userId })
      .populate('participants', 'name avatar')
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// Get upcoming sessions for the next 24 hours
router.get('/upcoming', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const now = new Date();
    const next24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const sessions = await Session.find({
      participants: userId,
      startTime: { $gte: now, $lte: next24h },
    })
      .populate('participants', 'name avatar')
      .sort({ startTime: 1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming sessions' });
  }
});

// Create a new session
router.post('/', [
  verifyToken,
  body('title').notEmpty(),
  body('startTime').isISO8601(),
  body('endTime').isISO8601(),
  body('participants').isArray({ min: 1 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { title, description, startTime, endTime, location, participants } = req.body;
    const session = new Session({
      title,
      description,
      startTime,
      endTime,
      location,
      participants,
      createdBy: req.user.userId,
      reminderSent: false
    });
    await session.save();
    
    // Create notifications for all participants
    for (const participantId of participants) {
      await Notification.create({
        userId: participantId,
        type: 'session',
        message: `You've been invited to a study session: "${title}"`,
        sessionId: session._id,
        read: false
      });
    }
    
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Update a session (only creator)
router.patch('/:id', verifyToken, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    Object.assign(session, req.body);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// Delete a session (only creator)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const session = await Session.findById(req.params.id);
    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.createdBy.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    await session.deleteOne();
    res.json({ message: 'Session deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router; 