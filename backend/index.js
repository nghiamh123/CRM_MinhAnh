require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dbConnect = require('./lib/db');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5001;

// Connect to MongoDB once early in the app lifecycle
dbConnect();

// Middleware to ensure DB connection for all requests
app.use(async (req, res, next) => {
  try {
    await dbConnect();
    next();
  } catch (error) {
    console.error('DB connection failed during request:', error);
    res.status(500).json({ error: 'Database connection failed' });
  }
});

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api', apiRoutes);

// Root route for testing
app.get('/', (req, res) => {
  res.send('Camera Rental CRM API is running...');
});

// Start server only if NOT running as a Vercel function
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
