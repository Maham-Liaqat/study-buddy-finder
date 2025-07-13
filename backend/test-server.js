const express = require('express');

console.log('Starting test server...');
const app = express();

app.get('/', (req, res) => {
  res.send('Test server is running');
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Test server startup error:', err.message, err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message, err.stack);
  process.exit(1);
});