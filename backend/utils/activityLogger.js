const { ActivityLog, User } = require('../models');

/**
 * Log user activity
 * @param {Object} logData - Activity log data
 * @param {number} logData.userId - User ID who performed the action
 * @param {string} logData.action - Action performed
 * @param {string} logData.resourceType - Type of resource affected
 * @param {number} logData.resourceId - ID of the affected resource
 * @param {string} logData.details - Additional details about the action
 * @param {string} logData.ipAddress - IP address of the requester
 */
const logActivity = async (logData) => {
  try {
    console.log('Attempting to log activity:', JSON.stringify({
      userId: logData.userId,
      action: logData.action,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId,
      details: logData.details
    }));
    
    // Validate required fields
    if (!logData.action || !logData.resourceType) {
      console.error('Missing required fields for activity logging');
      return;
    }
    
    // Ensure userId is present
    if (!logData.userId) {
      console.warn('No userId provided for activity log, using system default');
    }
    
    // Ensure metadata is properly formatted for storage
    if (logData.metadata && typeof logData.metadata === 'object') {
      logData.metadata = JSON.stringify(logData.metadata);
    }
    
    let userInfo = null;
    
    if (logData.userId) {
      try {
        const user = await User.findByPk(logData.userId);
        if (user) {
          userInfo = {
            userId: user.userId,
            name: `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`,
            firstName: user.firstName,
            middleName: user.middleName || '',
            lastName: user.lastName,
            email: user.email,
            role: user.role
          };
        } else {
          console.warn(`User with ID ${logData.userId} not found for activity logging`);
        }
      } catch (userError) {
        console.error('Error fetching user for activity log:', userError);
      }
    }

    // Create new log entry
    const logEntry = {
      userId: logData.userId,
      action: logData.action,
      resourceType: logData.resourceType,
      resourceId: logData.resourceId,
      details: logData.details,
      ipAddress: logData.ipAddress || '0.0.0.0',
      userInfo: userInfo,
      metadata: logData.metadata
    };
    
    console.log('Creating activity log with data:', JSON.stringify(logEntry));
    
    // Create the activity log entry
    const activityLog = await ActivityLog.create(logEntry);
    
    console.log('Activity log created successfully with ID:', activityLog.logId);
    return activityLog;
  } catch (error) {
    console.error('Error logging activity:', error);
    console.error('Error details:', error.stack);
  }
};

module.exports = {
  logActivity
};
