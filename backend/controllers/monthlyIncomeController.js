const { Transaction, TestDetails, Department, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all monthly income data
exports.getMonthlyIncome = async (req, res) => {
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
    const endDate = new Date(yearInt, monthInt, 0);
    endDate.setHours(23, 59, 59, 999);
    
    // Find all days in the month that have non-cancelled transactions
    const daysWithTransactions = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.ne]: 'cancelled' 
        }
      },
      attributes: [
        [sequelize.fn('DATE', sequelize.col('transactionDate')), 'date']
      ],
      group: [sequelize.fn('DATE', sequelize.col('transactionDate'))],
      order: [[sequelize.fn('DATE', sequelize.col('transactionDate')), 'ASC']],
      raw: true
    });
    
    // Get all unique dates
    const uniqueDates = daysWithTransactions.map(d => d.date);
    
    const result = [];
    
    for (const dateString of uniqueDates) {
      const currentDate = new Date(dateString);
      
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Get only non-cancelled transactions for this day
      const activeTransactions = await Transaction.findAll({
        where: {
          transactionDate: {
            [Op.between]: [dayStart, dayEnd]
          },
          status: {
            [Op.notIn]: ['cancelled']
          }
        },
        attributes: ['transactionId', 'totalGCashAmount'],
        raw: true
      });
      
      const transactionIds = activeTransactions.map(t => t.transactionId);
      
      // Get only valid test details (not cancelled, not refunded, no balance)
      const validTestDetails = await TestDetails.findAll({
        where: {
          transactionId: {
            [Op.in]: transactionIds
          },
          status: {
            [Op.notIn]: ['cancelled', 'refunded']
          },
          balanceAmount: 0
        },
        attributes: [
          'departmentId',
          'discountedPrice'
        ],
        raw: true
      });
      
      // Calculate department-specific revenues
      const departmentRevenues = {};
      departments.forEach(dept => {
        departmentRevenues[dept.departmentId] = 0; 
      });
      
      // Sum up revenues by department (using only valid tests)
      validTestDetails.forEach(detail => {
        const deptId = detail.departmentId;
        const amount = parseFloat(detail.discountedPrice || 0);
        
        // Add to department total
        if (departmentRevenues[deptId] !== undefined) {
          departmentRevenues[deptId] += amount;
        } else {
          departmentRevenues[deptId] = amount;
        }
      });
      
      // Calculate gross amount ONLY from valid test details
      const dailyGrossAmount = validTestDetails.reduce((sum, detail) => {
        return sum + parseFloat(detail.discountedPrice || 0);
      }, 0);
      
      let dailyGCashAmount = activeTransactions.reduce((sum, transaction) => {
        return sum + parseFloat(transaction.totalGCashAmount || 0);
      }, 0);
      
      // Format the date to YYYY-MM-DD for consistent sorting
      const formattedDate = currentDate.toISOString().split('T')[0];
      
      // Create the result object for this day
      const dayResult = {
        date: formattedDate,
        day: currentDate.getDate(),
        grossAmount: dailyGrossAmount,
        gCashAmount: dailyGCashAmount,
        departments: { ...departmentRevenues } 
      };
      
      // Add to results array
      result.push(dayResult);
    }
    
    // Sort the result by date
    result.sort((a, b) => new Date(a.date) - new Date(b.date));

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

    const activeTransactionIds = await Transaction.findAll({
      where: {
        transactionDate: {
          [Op.between]: [startDate, endDate]
        },
        status: {
          [Op.notIn]: ['cancelled']  
        }
      },
      attributes: ['transactionId'],
      raw: true
    }).then(results => results.map(t => t.transactionId));
    
    console.log(`Found ${activeTransactionIds.length} active transaction IDs`);
    
    if (activeTransactionIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalGross: 0,
          totalGCash: 0,
          totalCash: 0,
          departmentTotals: {},
          departments: await Department.findAll({
            where: { status: 'active' },
            attributes: ['departmentId', 'departmentName'],
            raw: true
          }),
          debug: { transactionCount: 0, testDetailCount: 0 }
        }
      });
    }
    
    const activeTestDetails = await TestDetails.findAll({
      where: {
        transactionId: {
          [Op.in]: activeTransactionIds
        },
        status: {
          [Op.notIn]: ['cancelled', 'refunded']
        },
        balanceAmount: 0
      },
      attributes: [
        'departmentId',
        'discountedPrice'
      ],
      raw: true
    });

    const totalGross = activeTestDetails.reduce((sum, detail) => {
      return sum + parseFloat(detail.discountedPrice || 0);
    }, 0);
    
    const activeTransactions = await Transaction.findAll({
      where: {
        transactionId: {
          [Op.in]: activeTransactionIds
        }
      },
      attributes: ['transactionId', 'totalGCashAmount', 'totalCashAmount'],
      raw: true
    });
    
    let totalGCash = activeTransactions.reduce((sum, transaction) => {
      return sum + parseFloat(transaction.totalGCashAmount || 0);
    }, 0);
    
    let totalCash = activeTransactions.reduce((sum, transaction) => {
      return sum + parseFloat(transaction.totalCashAmount || 0);
    }, 0);
    
    const departments = await Department.findAll({
      where: { status: 'active' },
      attributes: ['departmentId', 'departmentName'],
      raw: true
    });
    
    const departmentSummary = {};
    departments.forEach(dept => {
      departmentSummary[dept.departmentId] = 0;
    });
    
    activeTestDetails.forEach(detail => {
      const deptId = detail.departmentId;
      const amount = parseFloat(detail.discountedPrice || 0);
      
      if (departmentSummary[deptId] !== undefined) {
        departmentSummary[deptId] += amount;
      } else {
        departmentSummary[deptId] = amount;
      }
    });

    console.log(`Monthly Summary: Total Gross: ${totalGross.toFixed(2)}`);
    
    return res.status(200).json({
      success: true,
      data: {
        totalGross: totalGross,
        totalGCash: totalGCash,
        totalCash: totalCash,
        departmentTotals: departmentSummary,
        departments: departments,
        debug: {
          transactionCount: activeTransactions.length,
          testDetailCount: activeTestDetails.length
        }
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
