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
      // Find or create "Rebates" category
      const { Category } = require('../models');
      const [rebateCategory] = await Category.findOrCreate({
        where: { name: 'Rebates' },
        defaults: {
          name: 'Rebates',
          status: 'active'
        },
        transaction
      });

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
          categoryId: rebateCategory.categoryId // Set category to "Rebates"
        },
        transaction
      });

      // If expense item already existed, update the amount and ensure correct category
      if (!itemCreated) {
        await expenseItem.update({
          amount: parseFloat(expenseItem.amount) + rebateAmount,
          categoryId: rebateCategory.categoryId // Ensure category is set to "Rebates"
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
          // Calculate new expense item amount
          const newItemAmount = Math.max(0, parseFloat(expenseItem.amount) - rebateAmount);
          
          // If amount becomes zero or we're removing the referrer completely, delete the expense item
          if (newItemAmount === 0 || rebateAmount === 0) {
            await expenseItem.destroy({ transaction });
            console.log(`Deleted expense item for Dr. ${referrer.lastName}`);
          } else {
            // Otherwise, just reduce the amount
            await expenseItem.update({
              amount: newItemAmount
            }, { transaction });
          }

          // Update the expense total amount
          const newExpenseTotal = Math.max(0, parseFloat(expense.totalAmount) - rebateAmount);
          await expense.update({
            totalAmount: newExpenseTotal
          }, { transaction });
          
          // If the expense has no more items, we could also delete the entire expense record
          const remainingItems = await ExpenseItem.count({
            where: { expenseId: expense.expenseId },
            transaction
          });
          
          if (remainingItems === 0) {
            await expense.destroy({ transaction });
            console.log(`Deleted entire expense record for Pure Health as no items remain`);
          }
        }
      }
    } catch (error) {
      console.error('Error cancelling rebate expenses:', error);
      throw error;
    }
  }

  /**
   * Handle referrer changes in transactions and update rebate expenses accordingly
   * @param {number} transactionId - The ID of the transaction
   * @param {number|null} oldReferrerId - The previous referrer ID (null if was out patient)
   * @param {number|null} newReferrerId - The new referrer ID (null if becoming out patient) 
   * @param {number} userId - The user making the change
   * @param {Object} dbTransaction - The database transaction to use
   */
  static async handleReferrerChange(transactionId, oldReferrerId, newReferrerId, userId, dbTransaction = null) {
    const t = dbTransaction || await sequelize.transaction();
    const shouldCommit = !dbTransaction;
    
    try {
      // Get the transaction with test details
      const transaction = await Transaction.findByPk(transactionId, {
        include: [
          {
            model: TestDetails,
            where: { status: 'active' }, // Only include active tests
            required: false
          }
        ],
        transaction: t
      });

      if (!transaction) {
        if (shouldCommit) await t.rollback();
        return;
      }

      const transactionDate = new Date(transaction.transactionDate).toISOString().split('T')[0];

      // If changing FROM a referrer TO out patient (removing referrer)
      if (oldReferrerId && !newReferrerId) {
        await this.removeRebateExpenseForTransaction(transaction, oldReferrerId, transactionDate, userId, t);
        console.log(`Removed rebate expenses for transaction ${transactionId}: referrer changed to Out Patient`);
      }
      // If changing FROM out patient TO a referrer (adding referrer)
      else if (!oldReferrerId && newReferrerId) {
        await this.createRebateExpenseForTransaction(transaction, newReferrerId, transactionDate, userId, t);
      }
      // If changing FROM one referrer TO another referrer
      else if (oldReferrerId && newReferrerId && oldReferrerId !== newReferrerId) {
        // Check if there's an existing expense item we can update the paidTo for
        const expense = await Expense.findOne({
          where: {
            firstName: "Pure",
            lastName: "Health",
            date: transactionDate,
            departmentId: null
          },
          transaction: t
        });

        // Get old referrer info
        const oldReferrer = await Referrer.findByPk(oldReferrerId, { transaction: t });
        
        if (expense && oldReferrer) {
          // Check if there's an existing expense item for the old referrer
          const existingExpenseItem = await ExpenseItem.findOne({
            where: {
              expenseId: expense.expenseId,
              paidTo: `Dr. ${oldReferrer.lastName}`,
              purpose: `Referrer Rebate - 20% of department totals`
            },
            transaction: t
          });

          if (existingExpenseItem) {
            // Update the existing expense item's paidTo field instead of removing and creating new
            await this.updateExpenseItemPaidTo(transactionId, oldReferrerId, newReferrerId, transactionDate, t);
            
            // Update the rebate records
            await this.updateRebateRecordsForReferrerChange(transactionId, oldReferrerId, newReferrerId, transactionDate, t);
          } else {
            // No existing expense item, use the old remove/create approach
            await this.removeRebateExpenseForTransaction(transaction, oldReferrerId, transactionDate, userId, t);
            await this.createRebateExpenseForTransaction(transaction, newReferrerId, transactionDate, userId, t);
          }
        } else {
          // Fallback to remove/create approach
          await this.removeRebateExpenseForTransaction(transaction, oldReferrerId, transactionDate, userId, t);
          await this.createRebateExpenseForTransaction(transaction, newReferrerId, transactionDate, userId, t);
        }
      }

      if (shouldCommit) await t.commit();
    } catch (error) {
      if (shouldCommit) await t.rollback();
      console.error('Error handling referrer change:', error);
      throw error;
    }
  }

  /**
   * Remove rebate expense for a specific transaction and referrer
   */
  static async removeRebateExpenseForTransaction(transaction, referrerId, transactionDate, userId, dbTransaction) {
    try {
      // Get referrer information
      const referrer = await Referrer.findByPk(referrerId, { transaction: dbTransaction });
      if (!referrer) return;

      // Calculate the rebate amount to remove
      const departmentTotals = {};
      
      transaction.TestDetails.forEach(test => {
        if (test.status === 'active') {
          const deptId = String(test.departmentId);
          if (!departmentTotals[deptId]) {
            departmentTotals[deptId] = 0;
          }
          departmentTotals[deptId] += parseFloat(test.discountedPrice) || 0;
        }
      });

      let totalRebateToRemove = 0;
      Object.keys(departmentTotals).forEach(deptId => {
        const deptTotal = departmentTotals[deptId];
        const deptRebate = deptTotal * 0.20;
        totalRebateToRemove += deptRebate;
      });

      if (totalRebateToRemove > 0) {
        // Find and update the rebate record
        const rebateRecord = await ReferrerRebate.findOne({
          where: {
            referrerId: referrerId,
            rebateDate: transactionDate,
            status: 'active'
          },
          transaction: dbTransaction
        });

        if (rebateRecord) {
          const newRebateAmount = Math.max(0, parseFloat(rebateRecord.totalRebateAmount) - totalRebateToRemove);
          const newTransactionCount = Math.max(0, rebateRecord.transactionCount - 1);
          
          await rebateRecord.update({
            totalRebateAmount: newRebateAmount,
            transactionCount: newTransactionCount,
            status: newRebateAmount === 0 ? 'cancelled' : 'active'
          }, { transaction: dbTransaction });
        }

        // Remove from expense items
        await this.cancelRebateExpenses(referrer, totalRebateToRemove, transactionDate, userId, dbTransaction);

        console.log(`Removed rebate expense for referrer change - Dr. ${referrer.lastName}: ₱${totalRebateToRemove.toFixed(2)}`);
      } else {
        // Even if no rebate amount, still try to remove any existing expense items for this referrer
        await this.cancelRebateExpenses(referrer, 0, transactionDate, userId, dbTransaction);
        console.log(`Cleaned up any existing rebate expense items for Dr. ${referrer.lastName}`);
      }
    } catch (error) {
      console.error('Error removing rebate expense for transaction:', error);
      throw error;
    }
  }

  /**
   * Update expense item paidTo field when referrer changes
   * @param {number} transactionId - The ID of the transaction
   * @param {number} oldReferrerId - The old referrer ID
   * @param {number} newReferrerId - The new referrer ID
   * @param {string} transactionDate - The transaction date
   * @param {Object} dbTransaction - The database transaction to use
   */
  static async updateExpenseItemPaidTo(transactionId, oldReferrerId, newReferrerId, transactionDate, dbTransaction) {
    try {
      // Get both referrer information
      const [oldReferrer, newReferrer] = await Promise.all([
        Referrer.findByPk(oldReferrerId, { transaction: dbTransaction }),
        Referrer.findByPk(newReferrerId, { transaction: dbTransaction })
      ]);

      if (!oldReferrer || !newReferrer) return;

      // Find the expense record for rebates
      const expense = await Expense.findOne({
        where: {
          firstName: "Pure",
          lastName: "Health",
          date: transactionDate,
          departmentId: null
        },
        transaction: dbTransaction
      });

      if (expense) {
        // Find the old expense item for the old referrer
        const expenseItem = await ExpenseItem.findOne({
          where: {
            expenseId: expense.expenseId,
            paidTo: `Dr. ${oldReferrer.lastName}`,
            purpose: `Referrer Rebate - 20% of department totals`
          },
          transaction: dbTransaction
        });

        if (expenseItem) {
          // Update the paidTo field to the new referrer
          await expenseItem.update({
            paidTo: `Dr. ${newReferrer.lastName}`
          }, { transaction: dbTransaction });

          console.log(`Updated expense item paidTo from Dr. ${oldReferrer.lastName} to Dr. ${newReferrer.lastName}`);
        }
      }
    } catch (error) {
      console.error('Error updating expense item paidTo:', error);
      throw error;
    }
  }

  /**
   * Update rebate records when referrer changes (without removing/creating new records)
   * @param {number} transactionId - The ID of the transaction
   * @param {number} oldReferrerId - The old referrer ID
   * @param {number} newReferrerId - The new referrer ID
   * @param {string} transactionDate - The transaction date
   * @param {Object} dbTransaction - The database transaction to use
   */
  static async updateRebateRecordsForReferrerChange(transactionId, oldReferrerId, newReferrerId, transactionDate, dbTransaction) {
    try {
      // Get the transaction to calculate rebate amount
      const transaction = await Transaction.findByPk(transactionId, {
        include: [
          {
            model: TestDetails,
            where: { status: 'active' },
            required: false
          }
        ],
        transaction: dbTransaction
      });

      if (!transaction) return;

      // Calculate the rebate amount
      const departmentTotals = {};
      transaction.TestDetails.forEach(test => {
        if (test.status === 'active') {
          const deptId = String(test.departmentId);
          if (!departmentTotals[deptId]) {
            departmentTotals[deptId] = 0;
          }
          departmentTotals[deptId] += parseFloat(test.discountedPrice) || 0;
        }
      });

      let totalRebateAmount = 0;
      Object.keys(departmentTotals).forEach(deptId => {
        const deptTotal = departmentTotals[deptId];
        const deptRebate = deptTotal * 0.20;
        totalRebateAmount += deptRebate;
      });

      if (totalRebateAmount > 0) {
        // Get referrer information
        const [oldReferrer, newReferrer] = await Promise.all([
          Referrer.findByPk(oldReferrerId, { transaction: dbTransaction }),
          Referrer.findByPk(newReferrerId, { transaction: dbTransaction })
        ]);

        if (!oldReferrer || !newReferrer) return;

        // Find and update the old referrer's rebate record
        const oldRebateRecord = await ReferrerRebate.findOne({
          where: {
            referrerId: oldReferrerId,
            rebateDate: transactionDate,
            status: 'active'
          },
          transaction: dbTransaction
        });

        if (oldRebateRecord) {
          const newOldAmount = Math.max(0, parseFloat(oldRebateRecord.totalRebateAmount) - totalRebateAmount);
          const newOldCount = Math.max(0, oldRebateRecord.transactionCount - 1);
          
          await oldRebateRecord.update({
            totalRebateAmount: newOldAmount,
            transactionCount: newOldCount,
            status: newOldAmount === 0 ? 'cancelled' : 'active'
          }, { transaction: dbTransaction });
        }

        // Find or create rebate record for the new referrer
        const [newRebateRecord, created] = await ReferrerRebate.findOrCreate({
          where: {
            referrerId: newReferrerId,
            rebateDate: transactionDate
          },
          defaults: {
            firstName: newReferrer.firstName,
            lastName: newReferrer.lastName,
            totalRebateAmount: totalRebateAmount,
            transactionCount: 1,
            status: 'active'
          },
          transaction: dbTransaction
        });

        if (!created) {
          await newRebateRecord.update({
            totalRebateAmount: parseFloat(newRebateRecord.totalRebateAmount) + totalRebateAmount,
            transactionCount: newRebateRecord.transactionCount + 1
          }, { transaction: dbTransaction });
        }

        console.log(`Updated rebate records for referrer change - From Dr. ${oldReferrer.lastName} to Dr. ${newReferrer.lastName}: ₱${totalRebateAmount.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error updating rebate records for referrer change:', error);
      throw error;
    }
  }

  /**
   * Create rebate expense for a specific transaction and referrer
   */
  static async createRebateExpenseForTransaction(transaction, referrerId, transactionDate, userId, dbTransaction) {
    try {
      // Get referrer information
      const referrer = await Referrer.findByPk(referrerId, { transaction: dbTransaction });
      if (!referrer) return;

      // Calculate the rebate amount to add
      const departmentTotals = {};
      
      transaction.TestDetails.forEach(test => {
        if (test.status === 'active') {
          const deptId = String(test.departmentId);
          if (!departmentTotals[deptId]) {
            departmentTotals[deptId] = 0;
          }
          departmentTotals[deptId] += parseFloat(test.discountedPrice) || 0;
        }
      });

      let totalRebateToAdd = 0;
      Object.keys(departmentTotals).forEach(deptId => {
        const deptTotal = departmentTotals[deptId];
        const deptRebate = deptTotal * 0.20;
        totalRebateToAdd += deptRebate;
      });

      if (totalRebateToAdd > 0) {
        // Find or create rebate record
        const [rebateRecord, created] = await ReferrerRebate.findOrCreate({
          where: {
            referrerId: referrerId,
            rebateDate: transactionDate
          },
          defaults: {
            firstName: referrer.firstName,
            lastName: referrer.lastName,
            totalRebateAmount: totalRebateToAdd,
            transactionCount: 1,
            status: 'active'
          },
          transaction: dbTransaction
        });

        if (!created) {
          await rebateRecord.update({
            totalRebateAmount: parseFloat(rebateRecord.totalRebateAmount) + totalRebateToAdd,
            transactionCount: rebateRecord.transactionCount + 1
          }, { transaction: dbTransaction });
        }

        // Add to expense items
        await this.recordRebateAsExpense(referrer, totalRebateToAdd, transactionDate, userId, dbTransaction);

        console.log(`Added rebate expense for referrer change - Dr. ${referrer.lastName}: ₱${totalRebateToAdd.toFixed(2)}`);
      }
    } catch (error) {
      console.error('Error creating rebate expense for transaction:', error);
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

