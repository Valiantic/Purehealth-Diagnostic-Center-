const { Transaction, TestDetails, ReferrerRebate, Referrer, Expense, ExpenseItem, sequelize } = require('../models');
const { Op } = require('sequelize');

class RebateService {
  
  /**
   * Calculate and record rebates for a transaction
   * @param {Object} transaction - The transaction object
   * @param {Array} testDetails - Array of test details
   */
  static async calculateAndRecordRebate(transaction, testDetails) {
    if (!transaction.referrerId || transaction.referrerId === null) {
      return; // No referrer, no rebate
    }

    const t = await sequelize.transaction();
    
    try {
      // Get referrer information
      const referrer = await Referrer.findByPk(transaction.referrerId);
      if (!referrer) {
        await t.rollback();
        return;
      }

      // Group tests by department and calculate department totals
      const departmentTotals = {};
      
      testDetails.forEach(test => {
        // Only include active tests (exclude canceled/refunded)
        if (test.status === 'active') {
          const deptId = String(test.departmentId);
          if (!departmentTotals[deptId]) {
            departmentTotals[deptId] = 0;
          }
          
          // Use discounted price (what was actually charged)
          departmentTotals[deptId] += parseFloat(test.discountedPrice) || 0;
        }
      });

      // Calculate department rebates (20% of each department total)
      let totalRebates = 0;
      const departmentRebates = {};
      
      Object.keys(departmentTotals).forEach(deptId => {
        const deptTotal = departmentTotals[deptId];
        const deptRebate = deptTotal * 0.20; // 20% of department total
        departmentRebates[deptId] = deptRebate;
        totalRebates += deptRebate;
      });

      if (totalRebates > 0) {
        const rebateDate = new Date(transaction.transactionDate).toISOString().split('T')[0];
        
        // Find or create rebate record for this referrer and date
        const [rebateRecord, created] = await ReferrerRebate.findOrCreate({
          where: {
            referrerId: transaction.referrerId,
            rebateDate: rebateDate
          },
          defaults: {
            firstName: referrer.firstName,
            lastName: referrer.lastName,
            totalRebateAmount: totalRebates,
            transactionCount: 1,
            status: 'active'
          },
          transaction: t
        });

        // If record already exists, update it
        if (!created) {
          await rebateRecord.update({
            totalRebateAmount: parseFloat(rebateRecord.totalRebateAmount) + totalRebates,
            transactionCount: rebateRecord.transactionCount + 1
          }, { transaction: t });
        }

        // Record the rebate as an expense
        await this.recordRebateAsExpense(referrer, totalRebates, rebateDate, transaction.userId, t);

        console.log(`Rebate calculated for ${referrer.firstName} ${referrer.lastName}: ₱${totalRebates.toFixed(2)}`);
        console.log('Department breakdown:', departmentRebates);
      }

      await t.commit();
    } catch (error) {
      await t.rollback();
      console.error('Error calculating rebate:', error);
      throw error;
    }
  }

  /**
   * Record rebate as an expense in the monthly expenses
   */
  static async recordRebateAsExpense(referrer, rebateAmount, expenseDate, userId, transaction) {
    try {
      // Create or find expense record for rebates (using Pure Health as the name)
      const [expense, expenseCreated] = await Expense.findOrCreate({
        where: {
          firstName: "Pure",
          lastName: "Health",
          date: expenseDate,
          departmentId: null // Rebates are not tied to a specific department
        },
        defaults: {
          totalAmount: rebateAmount,
          userId: userId,
          status: 'active'
        },
        transaction
      });

      // Find or create a single expense item for this referrer and date
      const [expenseItem, itemCreated] = await ExpenseItem.findOrCreate({
        where: {
          expenseId: expense.expenseId,
          paidTo: `Dr. ${referrer.lastName}`,
          purpose: `Referrer Rebate - 20% of department totals`
        },
        defaults: {
          amount: rebateAmount,
          status: 'pending', // Mark as pending payment
          categoryId: null // You might want to create a specific category for rebates
        },
        transaction
      });

      // If expense item already existed, update the amount
      if (!itemCreated) {
        await expenseItem.update({
          amount: parseFloat(expenseItem.amount) + rebateAmount
        }, { transaction });
      }

      // If expense already existed, update the total amount
      if (!expenseCreated) {
        await expense.update({
          totalAmount: parseFloat(expense.totalAmount) + rebateAmount
        }, { transaction });
      }

    } catch (error) {
      console.error('Error recording rebate as expense:', error);
      throw error;
    }
  }

  /**
   * Get rebates for a specific date range
   */
  static async getRebatesByDateRange(startDate, endDate) {
    try {
      const rebates = await ReferrerRebate.findAll({
        where: {
          rebateDate: {
            [Op.between]: [startDate, endDate]
          },
          status: 'active'
        },
        include: [
          {
            model: Referrer,
            attributes: ['referrerId', 'firstName', 'lastName', 'clinicName']
          }
        ],
        order: [['rebateDate', 'DESC'], ['totalRebateAmount', 'DESC']]
      });

      return rebates;
    } catch (error) {
      console.error('Error fetching rebates:', error);
      throw error;
    }
  }

  /**
   * Get monthly rebate summary
   */
  static async getMonthlyRebateSummary(month, year) {
    try {
      const rebates = await ReferrerRebate.findAll({
        attributes: [
          [sequelize.fn('SUM', sequelize.col('totalRebateAmount')), 'totalRebates'],
          [sequelize.fn('COUNT', sequelize.col('rebateId')), 'totalRecords'],
          [sequelize.fn('SUM', sequelize.col('transactionCount')), 'totalTransactions']
        ],
        where: {
          [Op.and]: [
            sequelize.where(sequelize.fn('MONTH', sequelize.col('rebateDate')), month),
            sequelize.where(sequelize.fn('YEAR', sequelize.col('rebateDate')), year)
          ],
          status: 'active'
        },
        raw: true
      });

      return rebates[0] || { totalRebates: 0, totalRecords: 0, totalTransactions: 0 };
    } catch (error) {
      console.error('Error fetching monthly rebate summary:', error);
      throw error;
    }
  }

  /**
   * Handle rebate adjustments when a transaction is cancelled
   * @param {number} transactionId - The ID of the cancelled transaction
   * @param {number} userId - The user who cancelled the transaction
   * @param {Object} dbTransaction - The database transaction to use
   */
  static async handleTransactionCancellation(transactionId, userId, dbTransaction = null) {
    const t = dbTransaction || await sequelize.transaction();
    const shouldCommit = !dbTransaction; // Only commit if we created the transaction
    
    try {
      // Get the transaction with referrer info
      const transaction = await Transaction.findByPk(transactionId, {
        include: [
          {
            model: TestDetails,
            where: { status: { [Op.ne]: 'deleted' } },
            required: false
          }
        ],
        transaction: t
      });

      if (!transaction || !transaction.referrerId) {
        if (shouldCommit) await t.rollback();
        return; // No referrer, no rebate to adjust
      }

      // Get referrer information
      const referrer = await Referrer.findByPk(transaction.referrerId, { transaction: t });
      if (!referrer) {
        if (shouldCommit) await t.rollback();
        return;
      }

      // Calculate the total rebate amount that was previously calculated for this transaction
      const departmentTotals = {};
      
      transaction.TestDetails.forEach(test => {
        const deptId = String(test.departmentId);
        if (!departmentTotals[deptId]) {
          departmentTotals[deptId] = 0;
        }
        departmentTotals[deptId] += parseFloat(test.discountedPrice) || 0;
      });

      // Calculate department rebates (20% of each department total)
      let totalRebateToDeduct = 0;
      Object.keys(departmentTotals).forEach(deptId => {
        const deptTotal = departmentTotals[deptId];
        const deptRebate = deptTotal * 0.20;
        totalRebateToDeduct += deptRebate;
      });

      if (totalRebateToDeduct > 0) {
        const rebateDate = new Date(transaction.transactionDate).toISOString().split('T')[0];
        
        // Find the rebate record for this referrer and date
        const rebateRecord = await ReferrerRebate.findOne({
          where: {
            referrerId: transaction.referrerId,
            rebateDate: rebateDate,
            status: 'active'
          },
          transaction: t
        });

        if (rebateRecord) {
          // Update the rebate record - deduct the cancelled transaction amount
          const newRebateAmount = Math.max(0, parseFloat(rebateRecord.totalRebateAmount) - totalRebateToDeduct);
          const newTransactionCount = Math.max(0, rebateRecord.transactionCount - 1);
          
          await rebateRecord.update({
            totalRebateAmount: newRebateAmount,
            transactionCount: newTransactionCount,
            status: newRebateAmount === 0 ? 'cancelled' : 'active'
          }, { transaction: t });

          // Update the corresponding expense items to cancelled status
          await this.cancelRebateExpenses(referrer, totalRebateToDeduct, rebateDate, userId, t);

          console.log(`Rebate deducted for cancelled transaction - ${referrer.firstName} ${referrer.lastName}: ₱${totalRebateToDeduct.toFixed(2)}`);
        }
      }

      if (shouldCommit) await t.commit();
    } catch (error) {
      if (shouldCommit) await t.rollback();
      console.error('Error handling transaction cancellation rebate adjustment:', error);
      throw error;
    }
  }

  /**
   * Handle rebate adjustments when individual test details are refunded
   * @param {number} transactionId - The ID of the transaction
   * @param {Array} refundedTestDetails - Array of refunded test details
   * @param {number} userId - The user who processed the refund
   * @param {Object} dbTransaction - The database transaction to use
   */
  static async handleTestDetailRefund(transactionId, refundedTestDetails, userId, dbTransaction = null) {
    const t = dbTransaction || await sequelize.transaction();
    const shouldCommit = !dbTransaction; // Only commit if we created the transaction
    
    try {
      // Get the transaction with referrer info
      const transaction = await Transaction.findByPk(transactionId, { transaction: t });
      
      if (!transaction || !transaction.referrerId) {
        if (shouldCommit) await t.rollback();
        return; // No referrer, no rebate to adjust
      }

      // Get referrer information
      const referrer = await Referrer.findByPk(transaction.referrerId, { transaction: t });
      if (!referrer) {
        if (shouldCommit) await t.rollback();
        return;
      }

      // Calculate the rebate amount to deduct based on refunded test details
      const departmentTotals = {};
      
      refundedTestDetails.forEach(test => {
        const deptId = String(test.departmentId);
        if (!departmentTotals[deptId]) {
          departmentTotals[deptId] = 0;
        }
        departmentTotals[deptId] += parseFloat(test.discountedPrice) || 0;
      });

      // Calculate department rebates (20% of each department total)
      let totalRebateToDeduct = 0;
      Object.keys(departmentTotals).forEach(deptId => {
        const deptTotal = departmentTotals[deptId];
        const deptRebate = deptTotal * 0.20;
        totalRebateToDeduct += deptRebate;
      });

      if (totalRebateToDeduct > 0) {
        const rebateDate = new Date(transaction.transactionDate).toISOString().split('T')[0];
        
        // Find the rebate record for this referrer and date
        const rebateRecord = await ReferrerRebate.findOne({
          where: {
            referrerId: transaction.referrerId,
            rebateDate: rebateDate,
            status: 'active'
          },
          transaction: t
        });

        if (rebateRecord) {
          // Update the rebate record - deduct the refunded amount
          const newRebateAmount = Math.max(0, parseFloat(rebateRecord.totalRebateAmount) - totalRebateToDeduct);
          
          await rebateRecord.update({
            totalRebateAmount: newRebateAmount,
            status: newRebateAmount === 0 ? 'cancelled' : 'active'
          }, { transaction: t });

          // Reduce the corresponding expense items amount
          await this.reduceRebateExpenseAmount(referrer, totalRebateToDeduct, rebateDate, userId, t);

          console.log(`Rebate reduced for refunded tests - ${referrer.firstName} ${referrer.lastName}: ₱${totalRebateToDeduct.toFixed(2)}`);
        }
      }

      if (shouldCommit) await t.commit();
    } catch (error) {
      if (shouldCommit) await t.rollback();
      console.error('Error handling test detail refund rebate adjustment:', error);
      throw error;
    }
  }

  /**
   * Cancel rebate expenses when transaction is cancelled
   */
  static async cancelRebateExpenses(referrer, rebateAmount, expenseDate, userId, transaction) {
    try {
      // Find the expense record for rebates (using Pure Health as the name)
      const expense = await Expense.findOne({
        where: {
          firstName: "Pure",
          lastName: "Health",
          date: expenseDate,
          departmentId: null
        },
        transaction
      });

      if (expense) {
        // Find the expense item for this specific referrer
        const expenseItem = await ExpenseItem.findOne({
          where: {
            expenseId: expense.expenseId,
            paidTo: `Dr. ${referrer.lastName}`,
            purpose: `Referrer Rebate - 20% of department totals`
          },
          transaction
        });

        if (expenseItem) {
          // Reduce the expense item amount (don't set status to cancelled)
          const newItemAmount = Math.max(0, parseFloat(expenseItem.amount) - rebateAmount);
          await expenseItem.update({
            amount: newItemAmount
          }, { transaction });

          // Update the expense total amount
          const newExpenseTotal = Math.max(0, parseFloat(expense.totalAmount) - rebateAmount);
          await expense.update({
            totalAmount: newExpenseTotal
          }, { transaction });
        }
      }
    } catch (error) {
      console.error('Error cancelling rebate expenses:', error);
      throw error;
    }
  }

  /**
   * Reduce rebate expense amount when individual test details are refunded
   */
  static async reduceRebateExpenseAmount(referrer, reductionAmount, expenseDate, userId, transaction) {
    try {
      // Find the expense record for rebates (using Pure Health as the name)
      const expense = await Expense.findOne({
        where: {
          firstName: "Pure",
          lastName: "Health",
          date: expenseDate,
          departmentId: null
        },
        transaction
      });

      if (expense) {
        // Find the expense item for this specific referrer
        const expenseItem = await ExpenseItem.findOne({
          where: {
            expenseId: expense.expenseId,
            paidTo: `Dr. ${referrer.lastName}`,
            purpose: `Referrer Rebate - 20% of department totals`
          },
          transaction
        });

        if (expenseItem) {
          // Reduce the expense item amount (don't set status to cancelled)
          const newItemAmount = Math.max(0, parseFloat(expenseItem.amount) - reductionAmount);
          await expenseItem.update({
            amount: newItemAmount
          }, { transaction });

          // Update the expense total amount
          const newExpenseTotal = Math.max(0, parseFloat(expense.totalAmount) - reductionAmount);
          await expense.update({
            totalAmount: newExpenseTotal
          }, { transaction });
        }
      }
    } catch (error) {
      console.error('Error reducing rebate expense amount:', error);
      throw error;
    }
  }
}

module.exports = RebateService;

