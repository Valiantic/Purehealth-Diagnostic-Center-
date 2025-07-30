const { Expense, ExpenseItem, Department, Category, User, ActivityLog } = require('../models');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const socketManager = require('../utils/socketManager');

// Create a new expense with multiple expense items
const createExpense = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { firstName, lastName, departmentId, date, expenses, userId } = req.body;
    const selectedDate = new Date(date + 'T00:00:00.000Z'); 
    
    const totalAmount = expenses.reduce((sum, item) => 
      sum + parseFloat(parseFloat(item.amount).toFixed(2)), 0).toFixed(2);
    
    // Create expense record
    const expense = await Expense.create({
      firstName,
      lastName,
      departmentId,
      date,
      totalAmount,
      userId,
      createdAt: selectedDate, 
      updatedAt: selectedDate  
    }, { transaction });
    
     const expenseItems = await Promise.all(
      expenses.map(item => 
        ExpenseItem.create({
          expenseId: expense.expenseId,
          paidTo: item.paidTo,
          purpose: item.purpose,
          categoryId: item.categoryId || null,
          amount: parseFloat(parseFloat(item.amount).toFixed(2)),
          createdAt: selectedDate, 
          updatedAt: selectedDate  
        }, { transaction })
      )
    );
    
    // Log activity
    await ActivityLog.create({
      userId,
      action: 'CREATE',
      resourceType: 'EXPENSE',
      resourceId: expense.expenseId,
      details: `Created expense record for ${firstName} ${lastName} with total amount ${parseFloat(totalAmount).toFixed(2)}`,
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
          model: ExpenseItem,
          include: [
            {
              model: Category,
              attributes: ['categoryId', 'name'],
              required: false 
            }
          ]
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
    const { firstName, lastName, departmentId, date, totalAmount, ExpenseItems, userId } = req.body;
        
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
          formattedDate = new Date(date + 'T00:00:00.000Z');
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
      firstName,
      lastName,
      departmentId,
      date: formattedDate,
      totalAmount: formattedTotalAmount,
      userId,
      createdAt: formattedDate, 
      updatedAt: formattedDate 
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
    
   // Create new expense items
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
          categoryId: item.categoryId || null,
          amount: formattedAmount,
          status: validStatus,
          createdAt: formattedDate, 
          updatedAt: formattedDate,
          ...(item.id && !String(item.id).startsWith('temp-') ? { id: item.id } : {})
        }, { transaction });
      })
    );
    
    // Log activity with formatted amount
    let activityDetails = `Updated expense record for ${firstName} ${lastName} with total active amount ${formattedTotalAmount.toFixed(2)}`;
    
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
          model: ExpenseItem,
          include: [
            {
              model: Category,
              attributes: ['categoryId', 'name'],
              required: false
            }
          ]
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
          model: ExpenseItem,
          include: [
            {
              model: Category,
              attributes: ['categoryId', 'name'],
              required: false
            }
          ]
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

// Get all categories
const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Get category by ID
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: error.message
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, userId } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({
      where: { name: name.trim() }
    });
    
    if (existingCategory) {
      return res.status(409).json({
        success: false,
        message: 'Category already exists'
      });
    }
    
    const category = await Category.create({
      name: name.trim()
    });

    await ActivityLog.create({
      userId: userId || 1, 
      action: 'CREATE',
      resourceType: 'CATEGORY',
      resourceId: category.categoryId,
      details: `Created new expense category ${category.name}`,
      userInfo: {
        id: userId || 1
      }
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: error.message
    });
  }
};

// Update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, userId } = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    const originalName = category.name;
    const originalStatus = category.status;
    
    // Check if name is unique (if changing name)
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        where: { 
          name: name.trim(),
          categoryId: { [Op.ne]: id }
        }
      });
      
      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category name already exists'
        });
      }
    }
    
    await category.update({
      ...(name && { name: name.trim() }),
      ...(status && { status })
    });

    // Prepare activity log details
    let changes = [];
    if (name && name.trim() !== originalName) {
      changes.push(`name: "${originalName}" → "${name.trim()}"`);
    }
    if (status && status !== originalStatus) {
      changes.push(`status: "${originalStatus}" → "${status}"`);
    }
    
    const activityDetails = changes.length > 0 
      ? `Updated expense category "${originalName}": ${changes.join(', ')}`
      : `Updated expense category "${originalName}"`;
    
    // Log activity
    await ActivityLog.create({
      userId: userId || 1, 
      action: 'UPDATE',
      resourceType: 'CATEGORY',
      resourceId: id,
      details: activityDetails,
      userInfo: {
        id: userId || 1
      }
    });
    
    res.json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: error.message
    });
  }
};

module.exports = {
  createExpense,
  getExpenses,
  updateExpense,
  getExpenseById,
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
};
