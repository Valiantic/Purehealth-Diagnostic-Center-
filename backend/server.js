require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./models');

// Routes
const userRoutes = require('./routes/userRoutes');
const webauthnRoutes = require('./routes/webauthnRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const testRoutes = require('./routes/testRoutes');
const referrerRoutes = require('./routes/referrerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS more explicitly
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/transactions', transactionRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(`Error processing ${req.method} ${req.originalUrl}:`, err);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: err.message
  });
});

// Improved database initialization function
async function initializeDatabase() {
  try {
    // First disable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
    console.log('Foreign key checks disabled');
    
    // Sync with force:false and alter:true for development
    const syncOptions = { 
      alter: process.env.NODE_ENV === 'development',
      force: false
    };
    
    // Sync all models at once
    await sequelize.sync(syncOptions);
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('Foreign key checks re-enabled');
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Start the server with proper error handling
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

startServer();