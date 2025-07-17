const { Expense, ExpenseItem, Department, User, ActivityLog } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const socketManager = require('../utils/socketManager');

// Create a new expense with multiple expense items
const createExpense = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, departmentId, date, expenses, userId } = req.body;
    
    const totalAmount = expenses.reduce((sum, item) => 
      sum + parseFloat(parseFloat(item.amount).toFixed(2)), 0).toFixed(2);
    
    // Create expense record
    const expense = await Expense.create({
      name,
      departmentId,
      date,
      totalAmount,
      userId
    }, { transaction });
    
    const expenseItems = await Promise.all(
      expenses.map(item => 
        ExpenseItem.create({
          expenseId: expense.expenseId,
          paidTo: item.paidTo,
          purpose: item.purpose,
          amount: parseFloat(parseFloat(item.amount).toFixed(2))
        }, { transaction })
      )
    );
    
    // Log activity
    await ActivityLog.create({
      userId,
      action: 'CREATE',
      resourceType: 'EXPENSE',
      resourceId: expense.expenseId,
      details: `Created expense record for ${name} with total amount ${parseFloat(totalAmount).toFixed(2)}`,
      userInfo: {
        id: userId
      }
    }, { transaction });
    
    await transaction.commit();
    
    // Emit socket event for real-time dashboard update
    socketManager.emitExpenseUpdate(expense);
    
    res.status(201).json({
      success: true,
      message: 'Expense created successfully',
      data: {
        expense,
        expenseItems
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create expense',
      error: error.message
    });
  }
};

// Get expenses with pagination and filtering
const getExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10, departmentId, startDate, endDate } = req.query;
    
    const offset = (page - 1) * limit;
    
    let whereClause = {};
    
    // Add department filter if provided
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    // Add date range filter if provided
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }
    
    const expenses = await Expense.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'departmentName']
        },
        {
          model: User,
          attributes: ['userId', 'firstName', 'lastName', 'email']
        },
        {
          model: ExpenseItem
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['date', 'DESC']]
    });
    
    res.json({
      success: true,
      data: expenses.rows,
      totalCount: expenses.count,
      totalPages: Math.ceil(expenses.count / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expenses',
      error: error.message
    });
  }
};

// Update an existing expense
const updateExpense = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { name, departmentId, date, totalAmount, ExpenseItems, userId } = req.body;
    
    console.log("Updating expense with data:", req.body);
    
    const existingExpense = await Expense.findByPk(id);
    if (!existingExpense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    let formattedDate;
    try {
      if (date) {
        if (typeof date === 'string') {
          formattedDate = new Date(date);
          if (isNaN(formattedDate.getTime())) {
            formattedDate = new Date();
          }
        } else if (date instanceof Date) {
          formattedDate = date;
        } else {
          formattedDate = new Date();
        }
      } else {
        formattedDate = new Date();
      }
    } catch (error) {
      console.error("Error processing date:", error);
      formattedDate = new Date(); 
    }
    
    const activeItems = ExpenseItems.filter(item => item.status !== 'refunded');
    const activeTotal = activeItems.reduce(
      (sum, item) => sum + parseFloat(parseFloat(item.amount || 0).toFixed(2)), 
      0
    ).toFixed(2);
    
    const formattedTotalAmount = parseFloat(activeTotal);
    
    await existingExpense.update({
      name,
      departmentId,
      date: formattedDate,
      totalAmount: formattedTotalAmount,
      userId
    }, { transaction });
    
    const refundedItems = [];
    const existingItems = await ExpenseItem.findAll({
      where: { expenseId: id },
      transaction
    });

    const existingItemMap = {};
    existingItems.forEach(item => {
      existingItemMap[item.id] = item.dataValues;
    });

    const newlyRefundedItems = [];
    
    await ExpenseItem.destroy({
      where: { expenseId: id },
      transaction
    });
    
    // Create new expense items with 2 decimal places
    await Promise.all(
      ExpenseItems.map(item => {
        const formattedAmount = parseFloat(parseFloat(item.amount || 0).toFixed(2));
        

        const validStatus = ['pending', 'paid', 'refunded'].includes(item.status) 
          ? item.status 
          : 'pending';
        
        return ExpenseItem.create({
          expenseId: id,
          paidTo: item.paidTo || '',
          purpose: item.purpose || '',
          amount: formattedAmount,
          status: validStatus,
          ...(item.id && !String(item.id).startsWith('temp-') ? { id: item.id } : {})
        }, { transaction });
      })
    );
    
    // Log activity with formatted amount
    let activityDetails = `Updated expense record for ${name} with total active amount ${formattedTotalAmount.toFixed(2)}`;
    
    if (newlyRefundedItems.length > 0) {
      const refundTotal = newlyRefundedItems.reduce((sum, item) => sum + item.amount, 0).toFixed(2);
      activityDetails += `. Marked ${newlyRefundedItems.length} item(s) as refunded, total refund: ${refundTotal}`;
    }
    
    await ActivityLog.create({
      userId,
      action: newlyRefundedItems.length > 0 ? 'REFUND' : 'UPDATE',
      resourceType: 'EXPENSE',
      resourceId: id,
      details: activityDetails,
      userInfo: {
        id: userId
      }
    }, { transaction });
    
    await transaction.commit();
    
    // Fetch the updated expense with its items
    const updatedExpense = await Expense.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'departmentName']
        },
        {
          model: User,
          attributes: ['userId', 'firstName', 'lastName', 'email']
        },
        {
          model: ExpenseItem
        }
      ]
    });
    
    res.json({
      success: true,
      message: newlyRefundedItems.length > 0 
        ? `Expense updated. ${newlyRefundedItems.length} item(s) marked as refunded.`
        : 'Expense updated successfully',
      data: updatedExpense
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update expense',
      error: error.message
    });
  }
};

// Get a specific expense by ID
const getExpenseById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const expense = await Expense.findByPk(id, {
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'departmentName']
        },
        {
          model: User,
          attributes: ['userId', 'firstName', 'lastName', 'email']
        },
        {
          model: ExpenseItem
        }
      ]
    });
    
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    res.json({
      success: true,
      data: expense
    });
  } catch (error) {
    console.error('Error fetching expense by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  getExpenseById
};
