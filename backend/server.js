require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { sequelize } = require('./models');

// Log environment variables for WebAuthn debugging
console.log('WebAuthn Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  DOMAIN: process.env.DOMAIN,
  RP_ID: process.env.RP_ID,
  ORIGIN: process.env.ORIGIN,
  VERCEL: process.env.VERCEL,
  VERCEL_URL: process.env.VERCEL_URL
});

// Routes
const userRoutes = require('./routes/userRoutes');
const webauthnRoutes = require('./routes/webauthnRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const testRoutes = require('./routes/testRoutes');
const referrerRoutes = require('./routes/referrerRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const departmentRevenueRoutes = require('./routes/departmentRevenueRoutes');
const testDetailsRoutes = require('./routes/testDetailsRoute');
const expenseRoutes = require('./routes/expenseRoutes');
const collectibleIncomeRoutes = require('./routes/collectibleIncomeRoute');
const monthlyIncomeRoutes = require('./routes/monthlyIncomeRoutes');
const monthlyExpenseRoutes = require('./routes/monthlyExpenseRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS more explicitly
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'https://purehealth-diagnostic-center.vercel.app',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware
app.use(express.json());

// Security headers
app.use(helmet());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/webauthn', webauthnRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/referrers', referrerRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/department-revenue', departmentRevenueRoutes);
app.use('/api/test-details', testDetailsRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/collectible-incomes', collectibleIncomeRoutes);
app.use('/api/monthly-income', monthlyIncomeRoutes);
app.use('/api/monthly-expenses', monthlyExpenseRoutes);

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

// Sync database and start server
sequelize.sync({ alter: process.env.NODE_ENV === 'development' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });