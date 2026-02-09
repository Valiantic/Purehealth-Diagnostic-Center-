const { Transaction, Expense, Department, TestDetails, ExpenseItem, CollectibleIncome, Category, sequelize } = require('../models');
const RebateService = require('../services/rebateService');
const { Op } = require('sequelize');

const dashboardController = {

  getMonthlyData: async (req, res) => {
    try {
      const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;

      // Get monthly revenue from active transactions only (exclude cancelled)
      // Revenue = sum of totalDiscountAmount (the actual amount due after discounts)
      const monthlyRevenueResult = await Transaction.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.literal('"TestDetails"."discountedPrice" - "TestDetails"."balanceAmount"')), 'totalRevenue']
        ],
        include: [
          {
            model: TestDetails,
            attributes: [],
            where: {
              status: 'active'
            }
          }
        ],
        where: {
          transactionDate: {
            [Op.and]: [
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "Transaction"."transactionDate"')), month),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "Transaction"."transactionDate"')), year)
            ]
          },
          status: {
            [Op.ne]: 'cancelled'
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
            [Op.notIn]: ['paid', 'reimbursed', 'cancelled']
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
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "transactionDate"`)), month),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "transactionDate"`)), year)
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
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`MONTH FROM "transactionDate"`)), prevMonth),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal(`YEAR FROM "transactionDate"`)), prevYear)
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

      // Get daily income from transactions
      // Revenue = sum of totalDiscountAmount (the actual amount due after discounts)
      const dailyData = await Transaction.findAll({
        attributes: [
          [sequelize.fn('EXTRACT', sequelize.literal('DAY FROM "Transaction"."transactionDate"')), 'day'],
          [sequelize.fn('TO_CHAR', sequelize.col('Transaction.transactionDate'), 'Day'), 'dayName'],
          [sequelize.fn('SUM', sequelize.literal('"TestDetails"."discountedPrice" - "TestDetails"."balanceAmount"')), 'totalAmount']
        ],
        include: [
          {
            model: TestDetails,
            attributes: [],
            where: {
              status: 'active'
            }
          }
        ],
        where: {
          transactionDate: {
            [Op.and]: [
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "Transaction"."transactionDate"')), month),
              sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "Transaction"."transactionDate"')), year)
            ]
          },
          status: {
            [Op.ne]: 'cancelled'
          }
        },
        group: [sequelize.fn('EXTRACT', sequelize.literal('DAY FROM "Transaction"."transactionDate"')), sequelize.fn('TO_CHAR', sequelize.col('Transaction.transactionDate'), 'Day')],
        order: [[sequelize.fn('EXTRACT', sequelize.literal('DAY FROM "Transaction"."transactionDate"')), 'ASC']],
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

      // Create maps for quick lookup
      const transactionMap = new Map();
      const collectibleMap = new Map();

      dailyData.forEach(item => {
        transactionMap.set(item.day, {
          amount: parseFloat(item.totalAmount) || 0,
          dayName: item.dayName
        });
      });

      dailyCollectibleData.forEach(item => {
        collectibleMap.set(item.day, {
          amount: parseFloat(item.totalCollectible) || 0,
          dayName: item.dayName
        });
      });

      // Determine the last day to include in the chart
      const currentDate = new Date();
      const daysInMonth = new Date(year, month, 0).getDate();

      // If viewing current month, only show up to today
      // If viewing past month, show entire month
      const isCurrentMonth = currentDate.getFullYear() === parseInt(year) &&
        (currentDate.getMonth() + 1) === parseInt(month);
      const lastDay = isCurrentMonth ? currentDate.getDate() : daysInMonth;

      // Build complete chart data with all days (including zeros)
      const chartData = [];
      for (let day = 1; day <= lastDay; day++) {
        const transactionData = transactionMap.get(day);
        const collectibleData = collectibleMap.get(day);

        const transactionAmount = transactionData?.amount || 0;
        const collectibleAmount = collectibleData?.amount || 0;

        // Get day name from either data source, or calculate it
        let dayName;
        if (transactionData?.dayName) {
          dayName = transactionData.dayName;
        } else if (collectibleData?.dayName) {
          dayName = collectibleData.dayName;
        } else {
          // Calculate day name for days with no data
          dayName = new Date(year, month - 1, day).toLocaleDateString('en-US', { weekday: 'long' });
        }

        chartData.push({
          day: day,
          dayName: dayName,
          amount: transactionAmount,
          collectibleAmount: collectibleAmount,
          totalAmount: transactionAmount + collectibleAmount
        });
      }

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
            [Op.notIn]: ['paid', 'reimbursed', 'cancelled']
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
            [Op.notIn]: ['paid', 'reimbursed', 'cancelled']
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
        // Get revenue for this month from transactions
        // Revenue = sum of totalDiscountAmount (the actual amount due after discounts)
        const revenueResult = await Transaction.findAll({
          attributes: [
            [sequelize.fn('SUM', sequelize.literal('"TestDetails"."discountedPrice" - "TestDetails"."balanceAmount"')), 'totalRevenue']
          ],
          include: [
            {
              model: TestDetails,
              attributes: [],
              where: {
                status: 'active'
              }
            }
          ],
          where: {
            transactionDate: {
              [Op.and]: [
                sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "Transaction"."transactionDate"')), month),
                sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "Transaction"."transactionDate"')), year)
              ]
            },
            status: {
              [Op.ne]: 'cancelled'
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
              [Op.notIn]: ['paid', 'reimbursed', 'cancelled']
            }
          }
        });

        // Get collectible income for this month
        const collectibleIncome = await CollectibleIncome.sum('totalIncome', {
          where: {
            createdAt: {
              [Op.and]: [
                sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('MONTH FROM "CollectibleIncome"."createdAt"')), month),
                sequelize.where(sequelize.fn('EXTRACT', sequelize.literal('YEAR FROM "CollectibleIncome"."createdAt"')), year)
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