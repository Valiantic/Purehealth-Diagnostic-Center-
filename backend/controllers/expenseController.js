const { Expense, ExpenseItem, Department, User, ActivityLog } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

// Create a new expense with multiple expense items
const createExpense = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { name, departmentId, date, expenses, userId } = req.body;
    
    // Calculate total amount from expense items
    const totalAmount = expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);
    
    // Create expense record
    const expense = await Expense.create({
      name,
      departmentId,
      date,
      totalAmount,
      userId
    }, { transaction });
    
    // Create expense items
    const expenseItems = await Promise.all(
      expenses.map(item => 
        ExpenseItem.create({
          expenseId: expense.expenseId,
          paidTo: item.paidTo,
          purpose: item.purpose,
          amount: parseFloat(item.amount)
        }, { transaction })
      )
    );
    
    // Log activity
    await ActivityLog.create({
      userId,
      action: 'CREATE',
      resourceType: 'EXPENSE',
      resourceId: expense.expenseId,
      details: `Created expense record for ${name} with total amount ${totalAmount}`,
      userInfo: {
        id: userId
      }
    }, { transaction });
    
    await transaction.commit();
    
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

// Get a single expense by ID with associated items
const getExpenseById = async (req, res) => {
  try {
    const { expenseId } = req.params;
    
    console.log('Fetching expense with ID:', expenseId);
    
    // Check if expenseId is valid
    if (!expenseId || isNaN(parseInt(expenseId))) {
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID provided'
      });
    }
    
    const expense = await Expense.findByPk(expenseId, {
      include: [
        { model: ExpenseItem },
        { model: Department },
        { 
          model: User,
          attributes: ['userId', 'firstName', 'lastName', 'email']
        }
      ]
    });
    
    if (!expense) {
      console.log(`Expense with ID ${expenseId} not found`);
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
    console.error('Error fetching expense:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expense',
      error: error.message
    });
  }
};

// Update an expense record and its items
const updateExpense = async (req, res) => {
  const { expenseId } = req.params;
  const transaction = await sequelize.transaction();
  
  try {
    console.log('Updating expense with ID:', expenseId, 'Data:', req.body);
    
    // Check if expenseId is valid
    if (!expenseId || isNaN(parseInt(expenseId))) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Invalid expense ID provided'
      });
    }
    
    const { name, departmentId, date, ExpenseItems, userId, totalAmount } = req.body;
    
    // Check if expense exists
    const expense = await Expense.findByPk(expenseId);
    if (!expense) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Expense not found'
      });
    }
    
    // Update expense record
    await expense.update({
      name,
      departmentId,
      date,
      totalAmount,
      updatedAt: new Date()
    }, { transaction });
    
    // Handle expense items if provided
    if (Array.isArray(ExpenseItems) && ExpenseItems.length > 0) {
      // Get current expense items
      const currentItems = await ExpenseItem.findAll({
        where: { expenseId }
      });
      
      console.log('Current items:', currentItems.map(i => i.id));
      console.log('Received items:', ExpenseItems.map(i => i.id));
      
      // Process each expense item
      for (const item of ExpenseItems) {
        if (item.id) {
          // Update existing item
          const existingItem = currentItems.find(ci => ci.id === item.id || ci.id === parseInt(item.id, 10));
          if (existingItem) {
            await existingItem.update({
              paidTo: item.paidTo,
              purpose: item.purpose,
              amount: parseFloat(item.amount),
              updatedAt: new Date()
            }, { transaction });
          } else {
            // Item has ID but doesn't exist in DB - create new
            await ExpenseItem.create({
              expenseId,
              paidTo: item.paidTo,
              purpose: item.purpose,
              amount: parseFloat(item.amount)
            }, { transaction });
          }
        } else {
          // Create new item
          await ExpenseItem.create({
            expenseId,
            paidTo: item.paidTo,
            purpose: item.purpose,
            amount: parseFloat(item.amount)
          }, { transaction });
        }
      }
      
      // Handle item deletion (items in DB but not in request)
      const itemIdsToKeep = ExpenseItems.map(item => item.id ? (typeof item.id === 'string' ? parseInt(item.id, 10) : item.id) : null).filter(Boolean);
      for (const currentItem of currentItems) {
        if (!itemIdsToKeep.includes(currentItem.id)) {
          await currentItem.destroy({ transaction });
        }
      }
    }
    
    // Log activity
    await ActivityLog.create({
      userId,
      action: 'UPDATE',
      resourceType: 'EXPENSE',
      resourceId: expenseId,
      details: `Updated expense record for ${name} with amount ${totalAmount}`,
      userInfo: {
        id: userId
      }
    }, { transaction });
    
    await transaction.commit();
    
    // Return updated expense with items
    const updatedExpense = await Expense.findByPk(expenseId, {
      include: [
        { model: ExpenseItem },
        { model: Department },
        { 
          model: User,
          attributes: ['userId', 'firstName', 'lastName', 'email']
        }
      ]
    });
    
    res.json({
      success: true,
      message: 'Expense updated successfully',
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


module.exports = {
  createExpense,
  getExpenses,
  getExpenseById,
  updateExpense,
};
