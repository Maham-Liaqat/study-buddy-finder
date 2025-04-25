const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Match, User } = require('../models');
const verifyToken = require('../middleware/verifyToken');

// GET /api/matches - Fetch all matches for the current user
router.get('/', verifyToken, async (req, res) => {
  const userId = req.user.userId;

  try {
    // Validate userId as a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      console.error('Invalid userId format:', userId);
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    console.log('Fetching matches for userId:', userId);
    const matches = await Match.find({
      $or: [{ user1Id: userId }, { user2Id: userId }],
    });

    console.log('Found matches:', matches.length);
    // Get the other user in each match
    const matchedUsers = await Promise.all(
      matches.map(async (match) => {
        const otherUserId =
          match.user1Id.toString() === userId ? match.user2Id : match.user1Id;

        // Validate otherUserId
        if (!mongoose.Types.ObjectId.isValid(otherUserId)) {
          console.error('Invalid otherUserId format:', otherUserId);
          return null;
        }

        const user = await User.findById(otherUserId).select('name email university avatar');
        if (!user) {
          console.warn('User not found for otherUserId:', otherUserId);
          return null;
        }

        return {
          _id: otherUserId,
          name: user.name || 'Unknown',
          email: user.email || 'N/A',
          university: user.university || 'N/A',
          avatar: user.avatar || 'https://via.placeholder.com/40?text=User',
        };
      })
    );

    // Filter out null values (in case some users weren't found)
    const filteredMatchedUsers = matchedUsers.filter(user => user !== null);
    console.log('Returning matched users:', filteredMatchedUsers.length);
    res.json(filteredMatchedUsers);
  } catch (err) {
    console.error('Fetch matches error:', err.message, err.stack);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

module.exports = router;