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
    // Fetch user information to store in case user is deleted later
    let userInfo = null;
    if (logData.userId) {
      const user = await User.findByPk(logData.userId);
      if (user) {
        // Store full name components to make searching easier
        userInfo = {
          userId: user.userId,
          name: `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`,
          firstName: user.firstName,
          middleName: user.middleName || '',
          lastName: user.lastName,
          email: user.email,
          role: user.role
        };
      }
    }

    await ActivityLog.create({
      ...logData,
      userInfo
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw the error to prevent disrupting main operation
  }
};

module.exports = {
  logActivity
};
