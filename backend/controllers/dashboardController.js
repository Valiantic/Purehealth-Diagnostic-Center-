const { Transaction, Expense, Department, TestDetails, ExpenseItem, CollectibleIncome, sequelize } = require('../models');
const RebateService = require('../services/rebateService');
const { Op } = require('sequelize');

const dashboardController = {

  getMonthlyData: async (req, res) => {
    try {
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      
      // Get monthly revenue from active transactions only (exclude cancelled)
      // Calculate revenue from test details that are not refunded, minus any balance amounts
      const monthlyRevenueResult = await TestDetails.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('discountedPrice - balanceAmount')), 'totalRevenue']
        ],
        include: [
          {
            model: Transaction,
            where: {
              transactionDate: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('MONTH', sequelize.col('Transaction.transactionDate')), month),
                  sequelize.where(sequelize.fn('YEAR', sequelize.col('Transaction.transactionDate')), year)
                ]
              },
              status: {
                [Op.ne]: 'cancelled'
              }
            },
            attributes: []
          }
        ],
        where: {
          status: {
            [Op.ne]: 'refunded'
          }
        },
        raw: true
      });

      // Get monthly expenses excluding paid and refunded expense items
      const monthlyExpenses = await ExpenseItem.sum('amount', {
        include: [
          {
            model: Expense,
            where: {
              date: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('MONTH', sequelize.col('Expense.date')), month),
                  sequelize.where(sequelize.fn('YEAR', sequelize.col('Expense.date')), year)
                ]
              },
              status: {
                [Op.ne]: 'cancelled'
              }
            },
            attributes: []
          }
        ],
        where: {
          status: {
            [Op.notIn]: ['paid', 'refunded']
          }
        }
      });

      // Get monthly collectible income
      const monthlyCollectibleIncome = await CollectibleIncome.sum('totalIncome', {
        where: {
          createdAt: {
            [Op.and]: [
              sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), month),
              sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), year)
            ]
          }
        }
      });

      const revenueAmount = parseFloat(monthlyRevenueResult[0]?.totalRevenue || 0);
      const collectibleAmount = parseFloat(monthlyCollectibleIncome || 0);
      const totalRevenue = revenueAmount + collectibleAmount;

      const monthlyRebates = await RebateService.getMonthlyRebateSummary(month, year);
      const rebateExpenses = parseFloat(monthlyRebates.totalRebates || 0);
      const totalMonthlyExpenses = (parseFloat(monthlyExpenses || 0)) + rebateExpenses;
      const netProfit = totalRevenue - totalMonthlyExpenses;

      res.json({
        success: true,
        data: {
          monthlyRevenue: totalRevenue,
          transactionRevenue: revenueAmount,
          collectibleIncome: collectibleAmount,
          monthlyExpenses: monthlyExpenses || 0,
          totalExpenses: totalMonthlyExpenses,
          rebateExpenses: rebateExpenses,
          netProfit: netProfit,
          month: month,
          year: year
        }
      });
    } catch (error) {
      console.error('Error fetching monthly data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching monthly data',
        error: error.message
      });
    }
  },

  // Get daily income data for line chart
  getDailyIncomeData: async (req, res) => {
    try {
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
      
      // Get daily income from non-refunded test details in non-cancelled transactions, excluding balance amounts
      const dailyData = await TestDetails.findAll({
        attributes: [
          [sequelize.fn('DAY', sequelize.col('Transaction.transactionDate')), 'day'],
          [sequelize.fn('DAYNAME', sequelize.col('Transaction.transactionDate')), 'dayName'],
          [sequelize.fn('SUM', sequelize.literal('TestDetails.discountedPrice - TestDetails.balanceAmount')), 'totalAmount']
        ],
        include: [
          {
            model: Transaction,
            where: {
              transactionDate: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('MONTH', sequelize.col('Transaction.transactionDate')), month),
                  sequelize.where(sequelize.fn('YEAR', sequelize.col('Transaction.transactionDate')), year)
                ]
              },
              status: {
                [Op.ne]: 'cancelled'
              }
            },
            attributes: []
          }
        ],
        where: {
          status: {
            [Op.ne]: 'refunded'
          }
        },
        group: [sequelize.fn('DAY', sequelize.col('Transaction.transactionDate')), sequelize.fn('DAYNAME', sequelize.col('Transaction.transactionDate'))],
        order: [[sequelize.fn('DAY', sequelize.col('Transaction.transactionDate')), 'ASC']],
        raw: true
      });

      // Get daily collectible income
      const dailyCollectibleData = await CollectibleIncome.findAll({
        attributes: [
          [sequelize.fn('DAY', sequelize.col('createdAt')), 'day'],
          [sequelize.fn('DAYNAME', sequelize.col('createdAt')), 'dayName'],
          [sequelize.fn('SUM', sequelize.col('totalIncome')), 'totalCollectible']
        ],
        where: {
          createdAt: {
            [Op.and]: [
              sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), month),
              sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), year)
            ]
          }
        },
        group: [sequelize.fn('DAY', sequelize.col('createdAt')), sequelize.fn('DAYNAME', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DAY', sequelize.col('createdAt')), 'ASC']],
        raw: true
      });

      // Merge daily data and collectible data
      const chartData = [];
      const collectibleMap = new Map();
      
      // Create a map of collectible income by day
      dailyCollectibleData.forEach(item => {
        collectibleMap.set(item.day, parseFloat(item.totalCollectible) || 0);
      });

      // Combine transaction income with collectible income
      dailyData.forEach(item => {
        const collectibleAmount = collectibleMap.get(item.day) || 0;
        chartData.push({
          day: item.day,
          dayName: item.dayName,
          amount: parseFloat(item.totalAmount) || 0,
          collectibleAmount: collectibleAmount,
          totalAmount: (parseFloat(item.totalAmount) || 0) + collectibleAmount
        });
      });

      // Add days that only have collectible income (no transaction income)
      collectibleMap.forEach((collectibleAmount, day) => {
        const existingDay = chartData.find(item => item.day === day);
        if (!existingDay) {
          chartData.push({
            day: day,
            dayName: new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' }),
            amount: 0,
            collectibleAmount: collectibleAmount,
            totalAmount: collectibleAmount
          });
        }
      });

      // Sort by day
      chartData.sort((a, b) => a.day - b.day);

      res.json({
        success: true,
        data: chartData
      });
    } catch (error) {
      console.error('Error fetching daily income data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching daily income data',
        error: error.message
      });
    }
  },

  // Get expenses by department for pie chart
  getExpensesByDepartment: async (req, res) => {
    try {
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
            
      // First, let's check if we have any active expense items (exclude paid and refunded)
      const totalExpenses = await ExpenseItem.count({
        include: [
          {
            model: Expense,
            where: {
              date: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('MONTH', sequelize.col('Expense.date')), month),
                  sequelize.where(sequelize.fn('YEAR', sequelize.col('Expense.date')), year)
                ]
              },
              status: {
                [Op.ne]: 'cancelled'
              }
            },
            attributes: []
          }
        ],
        where: {
          status: {
            [Op.notIn]: ['paid', 'refunded']
          }
        }
      });
            
      const expensesByDept = await ExpenseItem.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('ExpenseItem.amount')), 'totalAmount']
        ],
        include: [
          {
            model: Expense,
            where: {
              date: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('MONTH', sequelize.col('Expense.date')), month),
                  sequelize.where(sequelize.fn('YEAR', sequelize.col('Expense.date')), year)
                ]
              },
              status: {
                [Op.ne]: 'cancelled'
              }
            },
            include: [
              {
                model: Department,
                attributes: ['departmentName', 'departmentId'],
                required: false
              }
            ],
            attributes: []
          }
        ],
        where: {
          status: {
            [Op.notIn]: ['paid', 'refunded']
          }
        },
        group: ['Expense.departmentId', 'Expense->Department.departmentId', 'Expense->Department.departmentName'],
        having: sequelize.literal('SUM(ExpenseItem.amount) > 0'),
        raw: true
      });

      // Calculate total for percentages
      const total = expensesByDept.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0);

      const chartData = expensesByDept.map(item => {
        
        // Try different possible paths for department name
        const departmentName = item['Expense.Department.departmentName'] || 
                              item['Expense->Department.departmentName'] || 
                              item['Department.departmentName'] ||
                              item.departmentName ||
                              'Other';
        
        return {
          department: departmentName,
          amount: parseFloat(item.totalAmount || 0),
          percentage: total > 0 ? parseFloat(((parseFloat(item.totalAmount || 0) / total) * 100).toFixed(2)) : 0
        };
      });

      res.json({
        success: true,
        data: chartData,
        total: total
      });
    } catch (error) {
      console.error('Error fetching expenses by department:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching expenses by department',
        error: error.message
      });
    }
  },

  // Get monthly profit data for bar chart
  getMonthlyProfitData: async (req, res) => {
    try {
      const { year = new Date().getFullYear() } = req.query;
      
      const monthlyData = [];
      
      for (let month = 1; month <= 12; month++) {
        // Get revenue for this month from non-refunded test details in non-cancelled transactions, excluding balance amounts
        const revenueResult = await TestDetails.findAll({
          attributes: [
            [sequelize.fn('SUM', sequelize.literal('discountedPrice - balanceAmount')), 'totalRevenue']
          ],
          include: [
            {
              model: Transaction,
              where: {
                transactionDate: {
                  [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('Transaction.transactionDate')), month),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Transaction.transactionDate')), year)
                  ]
                },
                status: {
                  [Op.ne]: 'cancelled'
                }
              },
              attributes: []
            }
          ],
          where: {
            status: {
              [Op.ne]: 'refunded'
            }
          },
          raw: true
        });

        // Get expenses for this month (exclude paid and refunded expense items)
        const expenses = await ExpenseItem.sum('amount', {
          include: [
            {
              model: Expense,
              where: {
                date: {
                  [Op.and]: [
                    sequelize.where(sequelize.fn('MONTH', sequelize.col('Expense.date')), month),
                    sequelize.where(sequelize.fn('YEAR', sequelize.col('Expense.date')), year)
                  ]
                },
                status: {
                  [Op.ne]: 'cancelled'
                }
              },
              attributes: []
            }
          ],
          where: {
            status: {
              [Op.notIn]: ['paid', 'refunded']
            }
          }
        });

        // Get collectible income for this month
        const collectibleIncome = await CollectibleIncome.sum('totalIncome', {
          where: {
            createdAt: {
              [Op.and]: [
                sequelize.where(sequelize.fn('MONTH', sequelize.col('createdAt')), month),
                sequelize.where(sequelize.fn('YEAR', sequelize.col('createdAt')), year)
              ]
            }
          }
        });

        // Get rebate expenses for this month
        const monthlyRebates = await RebateService.getMonthlyRebateSummary(month, year);
        const rebateExpenses = parseFloat(monthlyRebates.totalRebates || 0);

        const transactionRevenue = parseFloat(revenueResult[0]?.totalRevenue || 0);
        const collectibleAmount = parseFloat(collectibleIncome || 0);
        const totalRevenue = transactionRevenue + collectibleAmount;
        const totalExpenses = (expenses || 0) + rebateExpenses;
        const profit = totalRevenue - totalExpenses;
        
        monthlyData.push({
          month: month,
          monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
          revenue: totalRevenue,
          transactionRevenue: transactionRevenue,
          collectibleIncome: collectibleAmount,
          expenses: expenses || 0,
          rebateExpenses: rebateExpenses,
          totalExpenses: totalExpenses,
          profit: profit
        });
      }

      res.json({
        success: true,
        data: monthlyData
      });
    } catch (error) {
      console.error('Error fetching monthly profit data:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching monthly profit data',
        error: error.message
      });
    }
  }
};

module.exports = dashboardController;
