const { Transaction, TestDetails, Department, Expense, ExpenseItem, sequelize } = require('../models');
const { Op } = require('sequelize');

class DashboardService {
  /**
   * Get total monthly revenue for the current month
   */
  async getTotalMonthlyRevenue(month = null, year = null) {
    console.log('💰 Getting total monthly revenue for:', { month, year });
    try {
      const now = new Date();
      const targetMonth = parseInt(month) || (now.getMonth() + 1);
      const targetYear = parseInt(year) || now.getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('📅 Date range for revenue:', { startDate, endDate });

      // Use raw SQL for more reliable results
      const result = await sequelize.query(
        `SELECT COALESCE(SUM(totalAmount), 0) as total 
         FROM Transactions 
         WHERE transactionDate BETWEEN ? AND ? 
         AND status != 'cancelled'`,
        {
          replacements: [startDate, endDate],
          type: sequelize.QueryTypes.SELECT
        }
      );

      const revenue = parseFloat(result[0]?.total) || 0;
      console.log('💰 Total revenue found (SQL):', revenue);

      // Fallback to Sequelize ORM if SQL fails
      if (revenue === 0) {
        console.log('🔄 Trying ORM fallback for revenue...');
        const ormResult = await Transaction.sum('totalAmount', {
          where: {
            transactionDate: {
              [Op.between]: [startDate, endDate]
            },
            status: {
              [Op.ne]: 'cancelled'
            }
          }
        });
        const ormRevenue = parseFloat(ormResult) || 0;
        console.log('💰 ORM revenue result:', ormRevenue);
        return ormRevenue;
      }

      return revenue;
    } catch (error) {
      console.error('❌ Error fetching total monthly revenue:', error);
      return 0;
    }
  }

  /**
   * Get total monthly expenses for the current month
   */
  async getTotalMonthlyExpenses(month = null, year = null) {
    console.log('💸 Getting total monthly expenses for:', { month, year });
    try {
      const now = new Date();
      const targetMonth = parseInt(month) || (now.getMonth() + 1);
      const targetYear = parseInt(year) || now.getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('📅 Date range for expenses:', { startDate, endDate });

      // Use raw SQL for more reliable results
      const result = await sequelize.query(
        `SELECT COALESCE(SUM(ei.amount), 0) as total 
         FROM ExpenseItems ei
         INNER JOIN Expenses e ON ei.expenseId = e.expenseId
         WHERE e.date BETWEEN ? AND ? 
         AND ei.status = 'paid'`,
        {
          replacements: [startDate, endDate],
          type: sequelize.QueryTypes.SELECT
        }
      );

      const expenses = parseFloat(result[0]?.total) || 0;
      console.log('💸 Total expenses found (SQL):', expenses);

      // Fallback approach if SQL returns 0
      if (expenses === 0) {
        console.log('🔄 Trying step-by-step approach...');
        
        // Step 1: Get expenses in date range
        const expensesInRange = await Expense.findAll({
          where: {
            date: {
              [Op.between]: [startDate, endDate]
            }
          },
          attributes: ['expenseId'],
          raw: true
        });

        console.log(`📋 Found ${expensesInRange.length} expenses in range`);

        if (expensesInRange.length > 0) {
          const expenseIds = expensesInRange.map(e => e.expenseId);
          
          // Step 2: Sum expense items
          const itemsSum = await ExpenseItem.sum('amount', {
            where: {
              expenseId: {
                [Op.in]: expenseIds
              },
              status: 'paid'
            }
          });

          const fallbackExpenses = parseFloat(itemsSum) || 0;
          console.log('💸 Fallback expenses result:', fallbackExpenses);
          return fallbackExpenses;
        }
      }

      return expenses;
    } catch (error) {
      console.error('❌ Error fetching total monthly expenses:', error);
      return 0;
    }
  }

  /**
   * Get dashboard metrics (revenue, expenses, net profit)
   */
  async getDashboardMetrics(month = null, year = null) {
    console.log('🔍 Getting dashboard metrics for:', { month, year });
    try {
      const [totalRevenue, totalExpenses] = await Promise.all([
        this.getTotalMonthlyRevenue(month, year),
        this.getTotalMonthlyExpenses(month, year)
      ]);

      const netProfit = totalRevenue - totalExpenses;

      const result = {
        totalRevenue,
        totalExpenses,
        netProfit,
        month: parseInt(month) || (new Date().getMonth() + 1),
        year: parseInt(year) || new Date().getFullYear()
      };

      console.log('📊 Dashboard metrics result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      // Return default values instead of throwing
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        month: parseInt(month) || (new Date().getMonth() + 1),
        year: parseInt(year) || new Date().getFullYear()
      };
    }
  }
}

module.exports = new DashboardService();
