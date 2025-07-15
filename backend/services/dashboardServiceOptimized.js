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
      const targetMonth = month || (now.getMonth() + 1);
      const targetYear = year || now.getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('📅 Date range for revenue:', { startDate, endDate });

      const result = await Transaction.aggregate('totalAmount', 'SUM', {
        where: {
          transactionDate: {
            [Op.between]: [startDate, endDate]
          },
          status: {
            [Op.ne]: 'cancelled'
          }
        }
      });

      const revenue = parseFloat(result) || 0;
      console.log('💰 Total revenue found:', revenue);
      return revenue;
    } catch (error) {
      console.error('❌ Error fetching total monthly revenue:', error);
      return 0;
    }
  }

  /**
   * Get total monthly expenses for the current month - Optimized version
   */
  async getTotalMonthlyExpenses(month = null, year = null) {
    console.log('💸 Getting total monthly expenses for:', { month, year });
    try {
      const now = new Date();
      const targetMonth = month || (now.getMonth() + 1);
      const targetYear = year || now.getFullYear();

      const startDate = new Date(targetYear, targetMonth - 1, 1);
      const endDate = new Date(targetYear, targetMonth, 0);
      endDate.setHours(23, 59, 59, 999);

      console.log('📅 Date range for expenses:', { startDate, endDate });

      // Get all expenses in the date range first
      const expensesInRange = await Expense.findAll({
        where: {
          date: {
            [Op.between]: [startDate, endDate]
          }
        },
        attributes: ['expenseId']
      });

      console.log(`📋 Found ${expensesInRange.length} expenses in date range`);

      if (expensesInRange.length === 0) {
        console.log('📋 No expenses found in date range, returning 0');
        return 0;
      }

      // Get expense IDs and sum expense items
      const expenseIds = expensesInRange.map(e => e.expenseId);
      
      const totalExpenses = await ExpenseItem.sum('amount', {
        where: {
          expenseId: {
            [Op.in]: expenseIds
          },
          status: 'paid'
        }
      });

      const expenses = parseFloat(totalExpenses) || 0;
      console.log('💸 Final total expenses:', expenses);
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
        month: month || (new Date().getMonth() + 1),
        year: year || new Date().getFullYear()
      };

      console.log('📊 Dashboard metrics result:', result);
      return result;
    } catch (error) {
      console.error('❌ Error fetching dashboard metrics:', error);
      throw error;
    }
  }
}

module.exports = new DashboardService();
