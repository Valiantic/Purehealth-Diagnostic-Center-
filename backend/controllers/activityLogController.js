const { ActivityLog, User } = require('../models');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

// Get all activity logs with pagination, filtering, and search
exports.getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, sort = 'createdAt', order = 'DESC', search, date } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    if (search) {
      whereClause = {
        [Op.or]: [

          { action: { [Op.like]: `%${search}%` } },
          
          { details: { [Op.like]: `%${search}%` } },
          
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('ActivityLog.createdAt')),
            { [Op.like]: `%${search}%` }
          ),
          
          { userInfo: { [Op.like]: `%${search}%` } }
        ]
      };
    }
    
    if (date) {
      const formattedDate = new Date(date).toISOString().split('T')[0];
    
      whereClause = {
        ...whereClause,
        [Op.and]: [
          Sequelize.where(
            Sequelize.fn('DATE', Sequelize.col('ActivityLog.createdAt')),
            formattedDate
          )
        ]
      };
    }
    
    const logs = await ActivityLog.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['userId', 'firstName', 'middleName', 'lastName', 'email', 'role'],
          required: false, 
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
    
      const formattedLogs = logs.rows.map(log => {
      const plainLog = log.get({ plain: true });
      
      const userData = plainLog.userInfo ? plainLog.userInfo : 
                       plainLog.User ? {
                         id: plainLog.User.userId,
                         name: `${plainLog.User.firstName} ${plainLog.User.middleName ? plainLog.User.middleName + ' ' : ''}${plainLog.User.lastName}`,
                         email: plainLog.User.email,
                         role: plainLog.User.role
                       } : {
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
      currentPage: parseInt(page),
      filters: {
        date: date || null,
        search: search || null
      }
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
