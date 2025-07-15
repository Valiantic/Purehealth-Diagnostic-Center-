require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const http = require('http');
const socketIo = require('socket.io');
const msgpackParser = require('socket.io-msgpack-parser');
const { sequelize } = require('./models');
const dashboardService = require('./services/dashboardService');

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

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"]
  },
  // parser: msgpackParser, // Temporarily disabled for debugging
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});
const PORT = process.env.PORT || 5000;

// Configure CORS more explicitly
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
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
app.use('/api/dashboard', dashboardRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('✅ Client connected:', socket.id);

  // Send initial dashboard metrics
  socket.on('getDashboardMetrics', async (data = {}) => {
    console.log('📊 Request for dashboard metrics:', data);
    try {
      const { month, year } = data;
      const metrics = await dashboardService.getDashboardMetrics(month, year);
      console.log('📈 Sending dashboard metrics:', metrics);
      socket.emit('dashboardMetrics', metrics);
    } catch (error) {
      console.error('❌ Error sending dashboard metrics:', error);
      socket.emit('dashboardError', { message: 'Failed to fetch dashboard metrics' });
    }
  });

  // Handle real-time updates when transactions/expenses change
  socket.on('requestMetricsUpdate', async (data = {}) => {
    console.log('🔄 Request for metrics update:', data);
    try {
      const { month, year } = data;
      const metrics = await dashboardService.getDashboardMetrics(month, year);
      console.log('📈 Broadcasting metrics update:', metrics);
      io.emit('dashboardMetricsUpdate', metrics); // Broadcast to all clients
    } catch (error) {
      console.error('❌ Error updating dashboard metrics:', error);
      socket.emit('dashboardError', { message: 'Failed to update dashboard metrics' });
    }
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Make io available to other modules
app.set('io', io);

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
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Socket.IO server ready`);
    });
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });