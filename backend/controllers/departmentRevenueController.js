const { Department, DepartmentRevenue, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get revenue by department with optional date range
exports.getRevenueByDepartment = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const whereClause = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.revenueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Get total revenue by department
    const departmentRevenue = await DepartmentRevenue.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('sum', sequelize.col('amount')), 'totalRevenue']
      ],
      where: whereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentName']
        }
      ],
      group: ['departmentId', 'Department.departmentId'],
      order: [[sequelize.fn('sum', sequelize.col('amount')), 'DESC']]
    });

    // Get overall total
    const totalRevenue = await DepartmentRevenue.sum('amount', {
      where: whereClause
    });

    res.json({
      success: true,
      data: {
        departmentRevenue,
        totalRevenue: totalRevenue || 0
      }
    });
  } catch (error) {
    console.error('Error getting department revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department revenue',
      error: error.message
    });
  }
};

// Get revenue trend over time (daily, weekly, monthly) using Sequelize native approach
exports.getRevenueTrend = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate, departmentId } = req.query;
    
    // Build the where clause for date and department filters
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.revenueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    // Define time period formatting attributes based on the selected period
    let timePeriodAttribute;
    switch (period) {
      case 'daily':
        // Format: YYYY-MM-DD
        timePeriodAttribute = [
          sequelize.fn('DATE', sequelize.col('revenueDate')), 
          'timePeriod'
        ];
        break;
      case 'weekly':
        // Format: YYYY-Week WW
        timePeriodAttribute = [
          sequelize.literal(`CONCAT(YEAR(revenueDate), '-Week ', WEEK(revenueDate))`),
          'timePeriod'
        ];
        break;
      case 'monthly':
      default:
        // Format: YYYY-MM
        timePeriodAttribute = [
          sequelize.fn('DATE_FORMAT', sequelize.col('revenueDate'), '%Y-%m'),
          'timePeriod'
        ];
        break;
    }

    // Perform the grouped query using Sequelize's native methods
    const revenueTrend = await DepartmentRevenue.findAll({
      attributes: [
        timePeriodAttribute,
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
      ],
      where: whereClause,
      group: ['timePeriod'],
      order: [['timePeriod', 'ASC']],
      raw: true // Return plain objects instead of model instances
    });

    res.json({
      success: true,
      data: revenueTrend
    });
  } catch (error) {
    console.error('Error getting revenue trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue trend',
      error: error.message
    });
  }
};
