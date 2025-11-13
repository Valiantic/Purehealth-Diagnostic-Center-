const { Transaction, Expense, Department, TestDetails, ExpenseItem, CollectibleIncome, Category, sequelize } = require('../models');
const RebateService = require('../services/rebateService');
const { Op } = require('sequelize');

const dashboardController = {

  getMonthlyData: async (req, res) => {
    try {
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

      // Get monthly revenue from active transactions only (exclude cancelled)
      const monthlyRevenueResult = await TestDetails.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('"TestDetails"."discountedPrice" - "TestDetails"."balanceAmount"')), 'totalRevenue']
        ],
        include: [
          {
            model: Transaction,
            where: {
              transactionDate: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Transaction"."transactionDate"`)), month),
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Transaction"."transactionDate"`)), year)
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
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Expense"."date"`)), month),
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Expense"."date"`)), year)
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
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "CollectibleIncome"."createdAt"`)), month),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "CollectibleIncome"."createdAt"`)), year)
            ]
          }
        }
      });

      // Get transaction count for current month
      const transactionCount = await Transaction.count({
        where: {
          status: { [Op.ne]: 'cancelled' },
          transactionDate: {
            [Op.and]: [
              sequelize.where(sequelize.fn('MONTH', sequelize.col('transactionDate')), month),
              sequelize.where(sequelize.fn('YEAR', sequelize.col('transactionDate')), year)
            ]
          }
        }
      });

      // Get transaction count for previous month
      let prevMonth = month - 1;
      let prevYear = year;
      if (prevMonth < 1) {
        prevMonth = 12;
        prevYear = year - 1;
      }
      const prevTransactionCount = await Transaction.count({
        where: {
          status: { [Op.ne]: 'cancelled' },
          transactionDate: {
            [Op.and]: [
              sequelize.where(sequelize.fn('MONTH', sequelize.col('transactionDate')), prevMonth),
              sequelize.where(sequelize.fn('YEAR', sequelize.col('transactionDate')), prevYear)
            ]
          }
        }
      });

      // Calculate transaction comparison
      let transactionComparison = null;
      if (prevTransactionCount > 0) {
        const diff = transactionCount - prevTransactionCount;
        const percentage = (diff / prevTransactionCount) * 100;
        transactionComparison = {
          direction: percentage > 0 ? 'up' : percentage < 0 ? 'down' : 'same',
          percentage: Math.abs(percentage)
        };
      }

      const revenueAmount = parseFloat(monthlyRevenueResult[0]?.totalRevenue || 0);
      const collectibleAmount = parseFloat(monthlyCollectibleIncome || 0);
      const totalRevenue = revenueAmount + collectibleAmount;
      const totalMonthlyExpenses = parseFloat(monthlyExpenses || 0);
      const netProfit = totalRevenue - totalMonthlyExpenses;

      res.json({
        success: true,
        data: {
          monthlyRevenue: totalRevenue,
          transactionRevenue: revenueAmount,
          collectibleIncome: collectibleAmount,
          monthlyExpenses: totalMonthlyExpenses,
          netProfit: netProfit,
          transactionCount,
          transactionComparison,
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
          [sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "Transaction"."transactionDate"`)), 'day'],
          [sequelize.fn('TO_CHAR', sequelize.col('Transaction.transactionDate'), 'Day'), 'dayName'],
          [sequelize.fn('SUM', sequelize.literal('"TestDetails"."discountedPrice" - "TestDetails"."balanceAmount"')), 'totalAmount']
        ],
        include: [
          {
            model: Transaction,
            where: {
              transactionDate: {
                [Op.and]: [
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Transaction"."transactionDate"`)), month),
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Transaction"."transactionDate"`)), year)
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
        group: [sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "Transaction"."transactionDate"`)), sequelize.fn('TO_CHAR', sequelize.col('Transaction.transactionDate'), 'Day')],
        order: [[sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "Transaction"."transactionDate"`)), 'ASC']],
        raw: true
      });

      // Get daily collectible income
      const dailyCollectibleData = await CollectibleIncome.findAll({
        attributes: [
          [sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "CollectibleIncome"."createdAt"`)), 'day'],
          [sequelize.fn('TO_CHAR', sequelize.col('createdAt'), 'Day'), 'dayName'],
          [sequelize.fn('SUM', sequelize.col('totalIncome')), 'totalCollectible']
        ],
        where: {
          createdAt: {
            [Op.and]: [
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "CollectibleIncome"."createdAt"`)), month),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "CollectibleIncome"."createdAt"`)), year)
            ]
          }
        },
        group: [sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "CollectibleIncome"."createdAt"`)), sequelize.fn('TO_CHAR', sequelize.col('createdAt'), 'Day')],
        order: [[sequelize.fn('EXTRACT', sequelize.literal(`DAY FROM "CollectibleIncome"."createdAt"`)), 'ASC']],
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
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Expense"."date"`)), month),
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Expense"."date"`)), year)
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
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Expense"."date"`)), month),
                  sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Expense"."date"`)), year)
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
          },
          {
            model: Category,
            attributes: ['name', 'categoryId'],
            required: false
          }
        ],
        where: {
          status: {
            [Op.notIn]: ['paid', 'refunded']
          }
        },
        group: [
          'Expense.departmentId',
          'Expense->Department.departmentId',
          'Expense->Department.departmentName',
          'Category.categoryId',
          'Category.name'
        ],
        having: sequelize.literal('SUM("ExpenseItem"."amount") > 0'),
        raw: true
      });

      // Calculate total for percentages
      const total = expensesByDept.reduce((sum, item) => sum + parseFloat(item.totalAmount || 0), 0);

      const chartData = expensesByDept.map(item => {
        
        // Check if this expense item has a category (like rebates)
        const categoryName = item['Category.name'] || item['Category->name'];
        
        // Special handling for rebates - if category is "Rebates", use that as the display name
        let displayName;
        if (categoryName === 'Rebates') {
          displayName = 'Rebates';
        } else if (categoryName) {
          displayName = categoryName;
        } else {
          displayName = item['Expense.Department.departmentName'] || 
                       item['Expense->Department.departmentName'] || 
                       item['Department.departmentName'] ||
                       item.departmentName ||
                       'Other';
        }
        
        return {
          department: displayName,
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
            [sequelize.fn('SUM', sequelize.literal('"TestDetails"."discountedPrice" - "TestDetails"."balanceAmount"')), 'totalRevenue']
          ],
          include: [
            {
              model: Transaction,
              where: {
                transactionDate: {
                  [Op.and]: [
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Transaction"."transactionDate"`)), month),
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Transaction"."transactionDate"`)), year)
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
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "Expense"."date"`)), month),
                    sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "Expense"."date"`)), year)
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

        // Get rebate expenses for this month - but only if they're recorded as expense items
        // The expenses query above should already include rebates when properly recorded
        const transactionRevenue = parseFloat(revenueResult[0]?.totalRevenue || 0);
        const collectibleAmount = parseFloat(collectibleIncome || 0);
        const totalRevenue = transactionRevenue + collectibleAmount;
        const totalExpenses = expenses || 0; // Only actual recorded expenses
        const profit = totalRevenue - totalExpenses;
        
        monthlyData.push({
          month: month,
          monthName: new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' }),
          revenue: totalRevenue,
          transactionRevenue: transactionRevenue,
          collectibleIncome: collectibleAmount,
          expenses: totalExpenses,
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
