const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  university: { type: String, required: true },
  bio: { type: String },
  location: { type: String },
  subjects: [{ name: { type: String, required: true } }],
  availability: [{ type: String }],
  skills: [{ type: String }],
  badges: [{ type: String }],
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

const requestSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
});

const matchSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false },
  edited: { type: Boolean, default: false },
});

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['message', 'request', 'match', 'session'], required: true },
  message: { type: String, required: true },
  relatedUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session' },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const sessionSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  location: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reminderSent: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

module.exports = {
  User: mongoose.models.User || mongoose.model('User', userSchema),
  Request: mongoose.models.Request || mongoose.model('Request', requestSchema),
  Match: mongoose.models.Match || mongoose.model('Match', matchSchema),
  Message: mongoose.models.Message || mongoose.model('Message', messageSchema),
  Notification: mongoose.models.Notification || mongoose.model('Notification', notificationSchema),
  Session: mongoose.models.Session || mongoose.model('Session', sessionSchema),
};