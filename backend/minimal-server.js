const express = require('express');

console.log('Starting minimal server...');
const app = express();

app.get('/', (req, res) => {
  res.send('Minimal server is running');
});

const PORT = 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Minimal server running on port ${PORT}`);
  console.log(`Listening on http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Server startup error:', err.message, err.stack);
  process.exit(1);
});