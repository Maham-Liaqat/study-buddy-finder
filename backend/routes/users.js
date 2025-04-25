const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { User, Request } = require('../models');
const verifyTokenMiddleware = require('../middleware/verifyToken');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/avatars/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${req.user.userId}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png) are allowed'));
  },
});

const fs = require('fs');
const uploadDir = path.join(__dirname, '../uploads/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

router.use('/uploads', express.static(path.join(__dirname, '../uploads')));

router.post('/signup', async (req, res) => {
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

router.post('/login', async (req, res) => {
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

router.patch('/me', verifyTokenMiddleware, async (req, res) => {
  if (!req.user || !req.user.userId) {
    console.log('PATCH /api/users/me - Authentication failed: req.user is undefined or missing userId');
    return res.status(401).json({ error: 'Authentication failed: No user data found' });
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

// Upload avatar
router.post('/avatar', verifyTokenMiddleware, upload.single('avatar'),async (req, res) => {
  if (!req.user || !req.user.userId) {
    console.log('POST /api/users/avatar - Authentication failed: req.user is undefined or missing userId');
    return res.status(401).json({ error: 'Authentication failed: No user data found' });
  }

  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    user.avatar = req.file.filename;
    await user.save();
    console.log('Uploaded avatar filename:', req.file.filename);
    res.json({ message: 'Avatar uploaded successfully', avatar: req.file.filename });
  } catch (err) {
    console.error('Avatar upload error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
}, upload.single('avatar'));

router.get('/search', verifyTokenMiddleware, async (req, res) => {
  if (!req.user || !req.user.userId) {
    console.log('GET /api/users/search - Authentication failed: req.user is undefined or missing userId');
    return res.status(401).json({ error: 'Authentication failed: No user data found' });
  }

  try {
    const currentUser = await User.findById(req.user.userId);
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    const { subject, availability, location } = req.query;
    const query = { _id: { $ne: req.user.userId } };

    if (subject) query['subjects.name'] = subject;
    if (availability) query.availability = availability;
    if (location) query.location = location;

    const users = await User.find(query).select('-password');
    console.log('Search results - Users with avatars:', users.map(u => ({ id: u._id, avatar: u.avatar })));

    const usersWithMatch = users.map(user => {
      let matchScore = 0;
      const maxScore = 3;

      const currentUserSubjects = currentUser.subjects?.map(s => s.name) || [];
      const userSubjects = user.subjects?.map(s => s.name) || [];
      const commonSubjects = currentUserSubjects.filter(s => userSubjects.includes(s));
      if (commonSubjects.length > 0) matchScore += 1;

      const commonAvailability = currentUser.availability?.filter(day => user.availability?.includes(day)) || [];
      if (commonAvailability.length > 0) matchScore += 1;

      if (currentUser.location && user.location && currentUser.location.toLowerCase() === user.location.toLowerCase()) {
        matchScore += 1;
      }

      const matchPercentage = Math.round((matchScore / maxScore) * 100);
      return { ...user._doc, matchPercentage };
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

    console.log('GET /api/users/matches - Fetching matches for user:', req.user.userId);
    if (!mongoose.isValidObjectId(req.user.userId)) {
      console.error('Invalid userId format:', req.user.userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const acceptedRequests = await Request.find({
      $or: [
        { senderId: req.user.userId, status: 'accepted' },
        { recipientId: req.user.userId, status: 'accepted' },
      ],
    });
    console.log('Accepted requests:', acceptedRequests);

    const acceptedMatchIds = acceptedRequests
      .filter(req => mongoose.isValidObjectId(req.senderId) && mongoose.isValidObjectId(req.recipientId))
      .map(req =>
        req.senderId.toString() === req.user.userId.toString() ? req.recipientId : req.senderId
      );
    console.log('Accepted match IDs:', acceptedMatchIds);

    const pendingRequests = await Request.find({
      senderId: req.user.userId,
      status: 'pending',
    });
    console.log('Pending requests:', pendingRequests);

    const pendingMatchIds = pendingRequests
      .filter(req => mongoose.isValidObjectId(req.recipientId))
      .map(req => req.recipientId);
    console.log('Pending match IDs:', pendingMatchIds);

    const acceptedMatches = await User.find({ _id: { $in: acceptedMatchIds } }).select('-password');
    const pendingMatches = await User.find({ _id: { $in: pendingMatchIds } }).select('-password');

    console.log('Matches - Accepted matches with avatars:', acceptedMatches.map(u => ({ id: u._id, avatar: u.avatar })));
    console.log('Matches - Pending matches with avatars:', pendingMatches.map(u => ({ id: u._id, avatar: u.avatar })));

    const matchesWithStatus = [
      ...acceptedMatches.map(user => ({
        id: user._id.toString(),
        name: user.name,
        avatar: user.avatar,
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
        avatar: user.avatar,
        university: user.university,
        bio: user.bio,
        location: user.location,
        subjects: user.subjects?.map(s => s.name) || [],
        availability: user.availability || [],
        connectionStatus: 'pending',
      })),
    ];

    res.json(matchesWithStatus);
  } catch (err) {
    console.error('Get matches error:', err.message, err.stack);
    res.status(500).json({ error: `Failed to fetch matches: ${err.message}` });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    console.log('Forgot password token generated for user:', user._id);
    res.json({ message: 'Password reset email sent', token });
  } catch (err) {
    console.error('Forgot password error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

router.post('/reset-password/:token', async (req, res) => {
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

module.exports = router;