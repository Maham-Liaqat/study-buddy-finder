const mongoose = require('mongoose');
const { Message } = require('./models');

mongoose.connect('mongodb://localhost:27017/studybuddy', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const updateMessages = async () => {
  try {
    const result = await Message.updateMany(
      { read: { $exists: false } },
      { $set: { read: false } }
    );
    console.log('Messages updated:', result);
  } catch (err) {
    console.error('Error updating messages:', err.message);
  } finally {
    mongoose.connection.close();
  }
};

updateMessages();