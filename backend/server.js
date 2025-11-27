require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const { sequelize } = require('./models');
const socketManager = require('./utils/socketManager');

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
const dashboardRoutes = require('./routes/dashboardRoutes');
const rebateRoutes = require('./routes/rebateRoute');
const settingsRoutes = require('./routes/settingsRoutes');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize Socket.IO
socketManager.init(server);

// Configure CORS more explicitly
const allowedOrigins = [
  'https://purehealth-diagnostic-center.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.CORS_ORIGIN === origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// Middleware
app.use(express.json());

// Security headers
app.use(helmet());

// Rate limiting - General API limiter
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests, please try again later.'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

// Stricter rate limiting for auth routes (login, register, webauthn)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply general rate limiting to all requests
app.use(generalLimiter);

// Handle preflight requests
app.options('*', cors());

// Routes
app.use('/api/users', authLimiter, userRoutes);
app.use('/api/webauthn', authLimiter, webauthnRoutes);
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
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/rebates', rebateRoutes);
app.use('/api/settings', settingsRoutes);

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
// FORCE_DB_SYNC=true will sync models regardless of environment
const shouldSync = process.env.FORCE_DB_SYNC === 'true' || process.env.NODE_ENV === 'development';
const syncOptions = process.env.NODE_ENV === 'development' ? { alter: true } : { alter: false };

sequelize.authenticate()
  .then(() => {
    console.log('Database connection established successfully.');
    // Sync if in development or FORCE_DB_SYNC is true
    if (shouldSync) {
      console.log('Syncing database models...');
      return sequelize.sync(syncOptions);
    }
    console.log('Skipping database sync (use migrations or set FORCE_DB_SYNC=true)');
    return Promise.resolve();
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO enabled for real-time updates`);
      console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });