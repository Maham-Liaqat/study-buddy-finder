// backend/routes/matches.js
const express = require('express');
const User = require('../models/User');
const router = express.Router();

router.get('/matches', async (req, res) => {
  const { userId } = req.query;
  try {
    const user = await User.findById(userId);
    const matches = await User.find({
      _id: { $ne: userId },
      'subjects.name': { $in: user.subjects.map(s => s.name) },
    });
    const scoredMatches = matches.map(m => ({
      ...m._doc,
      score: m.subjects.filter(s => user.subjects.some(us => us.name === s.name)).length * 20,
    }));
    res.json(scoredMatches.sort((a, b) => b.score - a.score).slice(0, 5));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;