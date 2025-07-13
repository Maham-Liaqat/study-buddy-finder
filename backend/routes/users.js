const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Request } = require('../models');
const verifyTokenMiddleware = require('../middleware/verifyToken');
const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');
const helmet = require('helmet');

router.use(helmet());

router.post('/signup', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('university').trim().notEmpty().withMessage('University is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password, university } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, university });
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('User registered successfully:', user._id);
    res.status(201).json({ token });
  } catch (err) {
    console.error('Signup error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to sign up' });
  }
});

router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log('User logged in successfully:', user._id);
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to log in' });
  }
});

router.get('/me', verifyTokenMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.log('GET /api/users/me - Authentication failed: req.user is undefined or missing userId');
      return res.status(401).json({ error: 'Authentication failed: No user data found' });
    }

    console.log('GET /api/users/me - User ID from token:', req.user.userId);
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      console.log('GET /api/users/me - User not found for ID:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('GET /api/users/me - User fetched successfully:', user._id);
    res.json(user);
  } catch (err) {
    console.error('Get user error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch user: ${err.message}` });
  }
});

router.patch('/me', [
  body('name').optional().trim(),
  body('university').optional().trim(),
  body('bio').optional().trim(),
  body('location').optional().trim(),
  body('subjects').optional().isArray(),
  body('availability').optional().isArray(),
], verifyTokenMiddleware, async (req, res) => {
  if (!req.user || !req.user.userId) {
    console.log('PATCH /api/users/me - Authentication failed: req.user is undefined or missing userId');
    return res.status(401).json({ error: 'Authentication failed: No user data found' });
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const updates = req.body;
  const allowedUpdates = ['name', 'university', 'bio', 'location', 'subjects', 'availability'];
  const updateKeys = Object.keys(updates);
  const isValidOperation = updateKeys.every((key) => allowedUpdates.includes(key));

  if (!isValidOperation) {
    console.log('PATCH /api/users/me - Invalid updates:', updateKeys);
    return res.status(400).json({ error: 'Invalid updates' });
  }

  try {
    console.log('PATCH /api/users/me - Updating user ID:', req.user.userId);
    console.log('PATCH /api/users/me - Updates:', updates);
    const user = await User.findById(req.user.userId);
    if (!user) {
      console.log('PATCH /api/users/me - User not found for ID:', req.user.userId);
      return res.status(404).json({ error: 'User not found' });
    }

    updateKeys.forEach((key) => {
      user[key] = updates[key];
    });
    await user.save();
    console.log('PATCH /api/users/me - User updated successfully:', user._id);
    res.json(user);
  } catch (err) {
    console.error('Update user error:', err.message, err.stack);
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message).join(', ');
      return res.status(400).json({ error: `Validation error: ${errors}` });
    }
    res.status(500).json({ error: `Failed to update user: ${err.message}` });
  }
});

router.get('/search', verifyTokenMiddleware, async (req, res) => {
  if (!req.user || !req.user.userId) {
    console.log('GET /api/users/search - Authentication failed: req.user is undefined or missing userId');
    return res.status(401).json({ error: 'Authentication failed: No user data found' });
  }

  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const { subject, availability, location, skills, badges } = req.query;
    const query = { _id: { $ne: req.user.userId } };

    if (subject) query['subjects.name'] = { $in: subject.split(',') };
    if (availability) query.availability = { $in: availability.split(',') };
    if (location) query.location = location;
    if (skills) query.skills = { $in: skills.split(',') };
    if (badges) query.badges = { $in: badges.split(',') };

    const users = await User.find(query).select('-password');

    const usersWithMatch = users.map(user => {
      let matchScore = 0;
      let matchBreakdown = [];
      const maxScore = 5;

      // Subjects
      const currentUserSubjects = currentUser.subjects?.map(s => s.name) || [];
      const userSubjects = user.subjects?.map(s => s.name) || [];
      const commonSubjects = currentUserSubjects.filter(s => userSubjects.includes(s));
      if (commonSubjects.length > 0) {
        matchScore += 1;
        matchBreakdown.push(`Shared subjects: ${commonSubjects.join(', ')}`);
      }

      // Availability
      const commonAvailability = currentUser.availability?.filter(day => user.availability?.includes(day)) || [];
      if (commonAvailability.length > 0) {
        matchScore += 1;
        matchBreakdown.push(`Overlapping availability: ${commonAvailability.join(', ')}`);
      }

      // Location
      if (currentUser.location && user.location && currentUser.location.toLowerCase() === user.location.toLowerCase()) {
        matchScore += 1;
        matchBreakdown.push(`Same location: ${user.location}`);
      }

      // Skills
      const currentUserSkills = currentUser.skills || [];
      const userSkills = user.skills || [];
      const commonSkills = currentUserSkills.filter(s => userSkills.includes(s));
      if (commonSkills.length > 0) {
        matchScore += 1;
        matchBreakdown.push(`Shared skills: ${commonSkills.join(', ')}`);
      }

      // Badges
      const currentUserBadges = currentUser.badges || [];
      const userBadges = user.badges || [];
      const commonBadges = currentUserBadges.filter(b => userBadges.includes(b));
      if (commonBadges.length > 0) {
        matchScore += 1;
        matchBreakdown.push(`Shared badges: ${commonBadges.join(', ')}`);
      }

      const matchPercentage = Math.round((matchScore / maxScore) * 100);
      return { ...user._doc, matchPercentage, matchBreakdown };
    });

    res.json(usersWithMatch);
  } catch (err) {
    console.error('Search users error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

router.get('/matches', verifyTokenMiddleware, async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      console.log('GET /api/users/matches - Authentication failed: req.user is undefined or missing userId');
      return res.status(401).json({ error: 'Authentication failed: No user data found' });
    }

    const userId = req.user.userId; // Store userId to preserve context
    console.log('GET /api/users/matches - Fetching matches for user:', userId);
    if (!mongoose.isValidObjectId(userId)) {
      console.error('Invalid userId format:', userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const acceptedRequests = await Request.find({
      $or: [
        { senderId: userId, status: 'accepted' },
        { recipientId: userId, status: 'accepted' },
      ],
    });
    console.log('Accepted requests found:', acceptedRequests.length);
    console.log('Accepted requests:', JSON.stringify(acceptedRequests, null, 2));

    if (!acceptedRequests || acceptedRequests.length === 0) {
      console.log('No accepted requests found for user:', userId);
      return res.json([]);
    }

    const acceptedMatchIds = acceptedRequests
      .filter(req => {
        const isValidSender = mongoose.isValidObjectId(req.senderId);
        const isValidRecipient = mongoose.isValidObjectId(req.recipientId);
        if (!isValidSender || !isValidRecipient) {
          console.warn('Invalid ObjectId in request:', {
            requestId: req._id,
            senderId: req.senderId,
            recipientId: req.recipientId,
          });
        }
        return isValidSender && isValidRecipient;
      })
      .map(req => {
        const senderIdStr = req.senderId.toString();
        const userIdStr = userId.toString();
        const matchId = senderIdStr === userIdStr ? req.recipientId : req.senderId;
        console.log('Mapping request to match ID:', {
          requestId: req._id,
          senderId: senderIdStr,
          userId: userIdStr,
          matchId,
        });
        return matchId;
      });

    const pendingRequests = await Request.find({
      senderId: userId,
      status: 'pending',
    });
    console.log('Pending requests found:', pendingRequests.length);
    console.log('Pending requests:', JSON.stringify(pendingRequests, null, 2));

    const pendingMatchIds = pendingRequests
      .filter(req => {
        const isValidRecipient = mongoose.isValidObjectId(req.recipientId);
        if (!isValidRecipient) {
          console.warn('Invalid recipientId in pending request:', {
            requestId: req._id,
            recipientId: req.recipientId,
          });
        }
        return isValidRecipient;
      })
      .map(req => req.recipientId);

    const acceptedMatches = await User.find({ _id: { $in: acceptedMatchIds } }).select('-password');
    console.log('Accepted matches found:', acceptedMatches.length);
    const pendingMatches = await User.find({ _id: { $in: pendingMatchIds } }).select('-password');
    console.log('Pending matches found:', pendingMatches.length);

    const matchesWithStatus = [
      ...acceptedMatches.map(user => ({
        id: user._id.toString(),
        name: user.name,
        university: user.university,
        bio: user.bio,
        location: user.location,
        subjects: user.subjects?.map(s => s.name) || [],
        availability: user.availability || [],
        connectionStatus: 'accepted',
      })),
      ...pendingMatches.map(user => ({
        id: user._id.toString(),
        name: user.name,
        university: user.university,
        bio: user.bio,
        location: user.location,
        subjects: user.subjects?.map(s => s.name) || [],
        availability: user.availability || [],
        connectionStatus: 'pending',
      })),
    ];

    console.log('Returning matches with status:', matchesWithStatus.length);
    res.json(matchesWithStatus);
  } catch (err) {
    console.error('Get matches error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch matches: ${err.message}` });
  }
});

router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();
    // Send email with reset link
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    const resetUrl = `${req.protocol}://${req.get('host')}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request',
      text: `You requested a password reset. Click the link to reset your password: ${resetUrl}`,
      html: `<p>You requested a password reset.</p><p>Click <a href='${resetUrl}'>here</a> to reset your password.</p>`
    };
    await transporter.sendMail(mailOptions);
    console.log('Forgot password token generated and email sent for user:', user._id);
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    console.error('Forgot password error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password/:token', [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    console.log('Password reset successfully for user:', user._id);
    res.json({ message: 'Password reset successful' });
  } catch (err) {
    console.error('Reset password error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// GET /api/users/subjects - Get all unique subject names
router.get('/subjects', async (req, res) => {
  try {
    const subjects = await User.aggregate([
      { $unwind: '$subjects' },
      { $group: { _id: '$subjects.name' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(subjects.map(s => s._id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// GET /api/users/skills - Get all unique skills
router.get('/skills', async (req, res) => {
  try {
    const skills = await User.aggregate([
      { $unwind: '$skills' },
      { $group: { _id: '$skills' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(skills.map(s => s._id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch skills' });
  }
});

// GET /api/users/badges - Get all unique badges
router.get('/badges', async (req, res) => {
  try {
    const badges = await User.aggregate([
      { $unwind: '$badges' },
      { $group: { _id: '$badges' } },
      { $sort: { _id: 1 } }
    ]);
    res.json(badges.map(b => b._id));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch badges' });
  }
});

module.exports = router;