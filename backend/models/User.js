const mongoose = require('mongoose');

   const userSchema = new mongoose.Schema({
     name: { type: String, required: true },
     email: { type: String, required: true, unique: true },
     password: { type: String, required: true },
     university: { type: String },
     subjects: [{ name: String, level: String }],
     availability: [String],
     bio: String,
     location: String,
   });

   module.exports = mongoose.model('User', userSchema);