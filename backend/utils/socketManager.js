const socketIo = require('socket.io');

class SocketManager {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
  }

  init(server) {
    this.io = socketIo(server, {
      cors: {
        origin: process.env.ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);
      this.connectedClients.set(socket.id, socket);

      // Join dashboard room for real-time updates
      socket.join('dashboard');

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        this.connectedClients.delete(socket.id);
      });
    });

    return this.io;
  }

  // Emit dashboard updates to all connected clients
  emitDashboardUpdate(eventType, data) {
    if (this.io) {
      this.io.to('dashboard').emit('dashboard-update', {
        type: eventType,
        data: data,
        timestamp: new Date().toISOString()
      });
    }
  }

  // Emit transaction updates
  emitTransactionUpdate(transaction) {
    this.emitDashboardUpdate('transaction-created', transaction);
  }

  // Emit expense updates
  emitExpenseUpdate(expense) {
    this.emitDashboardUpdate('expense-created', expense);
  }

  // Get connected clients count
  getConnectedCount() {
    return this.connectedClients.size;
  }
}

// Create singleton instance
const socketManager = new SocketManager();

module.exports = socketManager;
