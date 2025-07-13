const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const { Session, Notification, User } = require('./models');
dotenv.config();
require('dotenv').config();

// Debug: Log the loaded environment variables
console.log('Loaded environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  PORT: process.env.PORT,
  EMAIL_USER: process.env.EMAIL_USER,
  EMAIL_PASS: process.env.EMAIL_PASS ? 'Present' : 'Missing',
});

// Validate MONGODB_URI
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in the environment variables. Please set it in the .env file.');
  process.exit(1);
}

// Import routes
const userRoutes = require('./routes/users');
const messageRoutes = require('./routes/messages');
const notificationRoutes = require('./routes/notifications');
const requestRoutes = require('./routes/requests');
const sessionRoutes = require('./routes/sessions');
const adminRoutes = require('./routes/admin');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Middleware
app.use(helmet());

// Security: Rate Limiting
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // allow more requests per minute for development
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Security: CORS
const allowedOrigins = [
  'http://localhost:5173',
  'https://study-buddy-finder-pi.vercel.app'
];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

app.use(express.json());

// Root route to avoid "Cannot GET /" error
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the Study Buddy Finder API' });
});

// Routes
app.use('/api/users', userRoutes);
console.log('Users route loaded successfully');

app.use('/api/messages', messageRoutes(io));
console.log('Messages route loaded successfully');

app.use('/api/notifications', notificationRoutes);
console.log('Notifications route loaded successfully');

app.use('/api/requests', requestRoutes);
console.log('Requests route loaded successfully');

app.use('/api/sessions', sessionRoutes);
console.log('Sessions route loaded successfully');

app.use('/api/admin', adminRoutes);
console.log('Admin route loaded successfully');

// File upload security
const allowedFileTypes = process.env.ALLOWED_FILE_TYPES ? process.env.ALLOWED_FILE_TYPES.split(',') : ['image/jpeg', 'image/png', 'image/gif'];
const maxFileSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024;
const upload = multer({
  limits: { fileSize: maxFileSize },
  fileFilter: (req, file, cb) => {
    if (allowedFileTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Export upload for use in routes
module.exports.upload = upload;

// Socket.IO setup
io.use((socket, next) => {
  const token = socket.handshake.auth?.token || socket.handshake.query?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user?.userId;
  if (!userId) {
    socket.disconnect();
    return;
  }
  console.log(`User ${userId} connected`);
  socket.join(userId);

  socket.on('join', (userId) => {
    console.log(`User ${userId} joined room`);
    socket.join(userId);
  });

  socket.on('sendMessage', ({ senderId, recipientId, message }) => {
    io.to(recipientId).emit('receiveMessage', { senderId, message });
  });

  // Typing indicator events
  socket.on('typing', ({ recipientId, senderId }) => {
    io.to(recipientId).emit('typing', { senderId });
  });
  socket.on('stopTyping', ({ recipientId, senderId }) => {
    io.to(recipientId).emit('stopTyping', { senderId });
  });

  socket.on('disconnect', () => {
    console.log(`User ${userId} disconnected`);
  });
});

// Security logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message, err.stack);
    process.exit(1);
  });

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
          const notification = await Notification.create({
            userId: participant._id,
            type: 'session',
            message: `Reminder: Your study session "${session.title}" starts in 10 minutes!`,
            sessionId: session._id,
            read: false
          });

          // Emit socket notification
          io.to(participant._id.toString()).emit('session_reminder', notification);
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

// Start the server
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}`);
});

// Error handler (production)
app.use((err, req, res, next) => {
  console.warn(`[${new Date().toISOString()}] ERROR:`, err.message);
  if (process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: 'Internal server error' });
  }
  next(err);
});

// Scheduled job: Notify users 10 minutes before a session starts
setInterval(async () => {
  try {
    const now = new Date();
    const inTen = new Date(now.getTime() + 10 * 60 * 1000);
    // Find sessions starting in 10 minutes (±30s window)
    const sessions = await Session.find({
      startTime: { $gte: new Date(inTen.getTime() - 30 * 1000), $lte: new Date(inTen.getTime() + 30 * 1000) }
    });
    for (const session of sessions) {
      for (const userId of session.participants) {
        // Avoid duplicate notifications
        const already = await Notification.findOne({
          userId,
          type: 'session',
          message: { $regex: session._id.toString() },
        });
        if (!already) {
          await Notification.create({
            userId,
            type: 'session',
            message: `Reminder: Your session "${session.title}" starts in 10 minutes. (${session._id})`,
            relatedUserId: session.createdBy,
          });
        }
      }
    }
  } catch (err) {
    console.error('Session reminder job error:', err.message);
  }
}, 60 * 1000);