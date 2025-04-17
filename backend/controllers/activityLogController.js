const { ActivityLog, User } = require('../models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

// Get all activity logs with pagination, filtering, and search
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'createdAt', order = 'DESC', search } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Apply search filter 
    if (search) {
    
      whereClause = {
        [Op.or]: [
          // Search in the action field
          { action: { [Op.like]: `%${search}%` } },
          
          // Search in details field
          { details: { [Op.like]: `%${search}%` } },
          
          // Search by date (in created date) - simpler approach to avoid MySQL functions
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('ActivityLog.createdAt')),
            { [Op.like]: `%${search}%` }
          ),
          
          // Use simpler approach for userInfo search
          { userInfo: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    // Get activity logs with user information
    const logs = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['userId', 'firstName', 'middleName', 'lastName', 'email', 'role'],
          required: false, // Use LEFT JOIN to include logs even if user is deleted
          where: search ? {
            [Op.or]: [
              { firstName: { [Op.like]: `%${search}%` } },
              { lastName: { [Op.like]: `%${search}%` } },
              { email: { [Op.like]: `%${search}%` } },
              { role: { [Op.like]: `%${search}%` } }
            ]
          } : undefined
        }
      ],
      order: [[sort, order]],
      limit: parseInt(limit),
      offset: parseInt(offset),
      distinct: true 
    });
    
    // Format response data
    const formattedLogs = logs.rows.map(log => {
      const plainLog = log.get({ plain: true });
      
      const userData = plainLog.User ? {
        id: plainLog.User.userId,
        name: `${plainLog.User.firstName} ${plainLog.User.middleName ? plainLog.User.middleName + ' ' : ''}${plainLog.User.lastName}`,
        email: plainLog.User.email,
        role: plainLog.User.role
      } : plainLog.userInfo || {
        name: 'Deleted User',
        email: 'deleted@user.com',
        role: 'unknown'
      };
      
      return {
        logId: plainLog.logId,
        user: userData,
        action: plainLog.action,
        resourceType: plainLog.resourceType,
        resourceId: plainLog.resourceId,
        details: plainLog.details,
        createdAt: plainLog.createdAt,
        time: new Date(plainLog.createdAt).toLocaleTimeString(),
        date: new Date(plainLog.createdAt).toLocaleDateString()
      };
    });
    
    res.json({
      success: true,
      logs: formattedLogs,
      totalCount: logs.count,
      totalPages: Math.ceil(logs.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching activity logs',
      error: error.message
    });
  }
};

module.exports = {
  getActivityLogs
};
