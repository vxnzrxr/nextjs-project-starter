require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

// Import Routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const feedbackRoutes = require('./routes/feedback');

// Import error handler
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend API is working!' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);

// Global Error Handler Middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
});
