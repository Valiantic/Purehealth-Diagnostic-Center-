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

module.exports = {
  createExpense,
  getExpenses
};
