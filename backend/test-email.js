const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: 'studybuddyapp12@gmail.com',
    pass: 'bmft ccli gycb oyiu', // Use your new App Password
  },
  secure: true,
  port: 465,
});

transporter.verify((error, success) => {
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Server is ready to send emails');
  }
});