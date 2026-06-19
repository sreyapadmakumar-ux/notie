const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import routes
const notesRoutes = require('./routes/notes');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

/**
 * Middleware
 */
// Enable CORS for frontend communication
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from frontend folder
app.use(express.static(path.join(__dirname, '../frontend')));

/**
 * API Routes
 */
app.use('/api/notes', notesRoutes);

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Notie API is running',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Serve frontend for any non-API routes
 */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

/**
 * Global error handling middleware
 */
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

/**
 * Connect to MongoDB and start server
 */
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/notie')
  .then(() => {
    console.log('Connected to MongoDB');
    // Listen on 0.0.0.0 so the app is accessible from other devices on the network
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`API available at http://localhost:${PORT}/api/notes`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
