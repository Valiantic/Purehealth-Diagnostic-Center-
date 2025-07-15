/**
 * Utility to trigger dashboard metrics updates via Socket.IO
 */
const triggerDashboardUpdate = (app, month = null, year = null) => {
  try {
    const io = app.get('io');
    if (io) {
      const now = new Date();
      const targetMonth = month || (now.getMonth() + 1);
      const targetYear = year || now.getFullYear();
      
      // Emit update event to all connected clients
      io.emit('requestMetricsUpdate', { month: targetMonth, year: targetYear });
      console.log(`Dashboard update triggered for ${targetMonth}/${targetYear}`);
    }
  } catch (error) {
    console.error('Error triggering dashboard update:', error);
  }
};

module.exports = { triggerDashboardUpdate };
