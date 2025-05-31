const { Transaction, TestDetails, Department, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all monthly income data
exports.getMonthlyIncome = async (req, res) => {
  try {
    // Extract query parameters
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year parameters are required' 
      });
    }

    // Parse month and year to integers
    const monthInt = parseInt(month);
    const yearInt = parseInt(year);

    if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid month or year format' 
      });
    }

    // Get all departments from the database
    const departments = await Department.findAll({
      where: {
        status: 'active'
      },
      attributes: ['departmentId', 'departmentName'],
      order: [['departmentName', 'ASC']]
    });

    // Calculate start and end dates for the given month
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    // Group data by day
    const dailyIncomeData = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.not]: 'cancelled'
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('transactionDate')), 'date'],
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'grossAmount'],
        [sequelize.fn('SUM', sequelize.col('totalGCashAmount')), 'gCashAmount']
      ],
      group: [sequelize.fn('DATE', sequelize.col('transactionDate'))],
      order: [[sequelize.fn('DATE', sequelize.col('transactionDate')), 'ASC']],
      raw: true
    });

    // For each day, get department-specific data
    const result = [];
    
    // Process each day's data
    for (const dayData of dailyIncomeData) {
      const dailyDate = new Date(dayData.date);
      
      // Get all test details for this day
      const dailyTestDetails = await TestDetails.findAll({
        include: [{
          model: Transaction,
          where: {
            transactionDate: {
              [Op.gte]: new Date(dailyDate.setHours(0, 0, 0, 0)),
              [Op.lte]: new Date(dailyDate.setHours(23, 59, 59, 999))
            },
            status: {
              [Op.not]: 'cancelled'
            }
          },
          attributes: []
        }],
        where: {
          status: {
            [Op.notIn]: ['cancelled', 'refunded']
          }
        },
        attributes: [
          'departmentId',
          [sequelize.fn('SUM', sequelize.col('discountedPrice')), 'departmentRevenue']
        ],
        group: ['departmentId'],
        raw: true
      });
      
      // Create a map of department revenues
      const departmentRevenues = {};
      dailyTestDetails.forEach(detail => {
        departmentRevenues[detail.departmentId] = parseFloat(detail.departmentRevenue || 0);
      });
      
      // Format the result with department-specific data
      const dayResult = {
        date: dayData.date,
        day: new Date(dayData.date).getDate(),
        grossAmount: parseFloat(dayData.grossAmount || 0),
        gCashAmount: parseFloat(dayData.gCashAmount || 0),
        departments: {}
      };
      
      // Add department-specific revenues
      departments.forEach(dept => {
        dayResult.departments[dept.departmentId] = departmentRevenues[dept.departmentId] || 0;
      });
      
      result.push(dayResult);
    }

    return res.status(200).json({
      success: true,
      data: {
        departments: departments.map(d => ({ id: d.departmentId, name: d.departmentName })),
        dailyIncome: result
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyIncome:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get monthly income data',
      error: error.message
    });
  }
};

// Get summary of monthly income
exports.getMonthlyIncomeSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year parameters are required' 
      });
    }

    const monthInt = parseInt(month);
    const yearInt = parseInt(year);

    // Calculate start and end dates for the given month
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0); // Last day of the month
    endDate.setHours(23, 59, 59, 999);

    // Get total amounts
    const totalAmounts = await Transaction.findOne({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.not]: 'cancelled'
        }
      },
      attributes: [
        [sequelize.fn('SUM', sequelize.col('totalAmount')), 'totalGross'],
        [sequelize.fn('SUM', sequelize.col('totalGCashAmount')), 'totalGCash'],
        [sequelize.fn('SUM', sequelize.col('totalCashAmount')), 'totalCash']
      ],
      raw: true
    });

    // Get department totals
    const departments = await Department.findAll({
      where: {
        status: 'active'
      },
      attributes: ['departmentId', 'departmentName'],
      raw: true
    });

    const departmentTotals = await TestDetails.findAll({
      include: [{
        model: Transaction,
        where: {
          transactionDate: {
            [Op.between]: [startDate, endDate]
          },
          status: {
            [Op.not]: 'cancelled'
          }
        },
        attributes: []
      }],
      where: {
        status: {
          [Op.notIn]: ['cancelled', 'refunded']
        }
      },
      attributes: [
        'departmentId',
        [sequelize.fn('SUM', sequelize.col('discountedPrice')), 'totalRevenue']
      ],
      group: ['departmentId'],
      raw: true
    });

    // Map department totals
    const departmentSummary = {};
    departmentTotals.forEach(dept => {
      departmentSummary[dept.departmentId] = parseFloat(dept.totalRevenue || 0);
    });

    return res.status(200).json({
      success: true,
      data: {
        totalGross: parseFloat(totalAmounts.totalGross || 0),
        totalGCash: parseFloat(totalAmounts.totalGCash || 0),
        totalCash: parseFloat(totalAmounts.totalCash || 0),
        departmentTotals: departmentSummary,
        departments: departments
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyIncomeSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get monthly income summary',
      error: error.message
    });
  }
};
