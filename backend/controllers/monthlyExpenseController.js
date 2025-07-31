const { Expense, ExpenseItem, Department, Category, sequelize } = require('../models');
const { Op } = require('sequelize');

// Get all monthly expenses data
exports.getMonthlyExpenses = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year parameters are required' 
      });
    }

    const monthInt = parseInt(month);
    const yearInt = parseInt(year);

    if (isNaN(monthInt) || isNaN(yearInt) || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid month or year format' 
      });
    }

    // Calculate start and end dates for the given month
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0);
    endDate.setHours(23, 59, 59, 999);

    const whereClause = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };

    if (departmentId && departmentId !== 'all') {
      whereClause.departmentId = departmentId;
    }

    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'departmentName']
        },
        {
          model: ExpenseItem,
          attributes: ['expenseItemId', 'paidTo', 'purpose', 'categoryId', 'amount', 'status'],
          include: [
            {
              model: Category,
              attributes: ['categoryId', 'name'],
              required: false
            }
          ]
        }
      ],
      order: [['date', 'DESC']] 
    });

    // Group expenses by date and department
    const dailyExpenses = {};
    expenses.forEach(expense => {
      let dateKey;
      if (expense.date instanceof Date) {
        dateKey = expense.date.toISOString().split('T')[0];
      } else {
        try {
          const dateObj = new Date(expense.date);
          dateKey = dateObj.toISOString().split('T')[0];
        } catch (e) {
          console.error('Error parsing date:', e);
          dateKey = String(expense.date); 
        }
      }
      
      const departmentKey = expense.Department?.departmentName || 'Uncategorized';

      if (!dailyExpenses[dateKey]) {
        dailyExpenses[dateKey] = {
          date: dateKey,
          day: new Date(dateKey).getDate(),
          totalAmount: 0,
          departments: {}
        };
      }
      
      if (!dailyExpenses[dateKey].departments[departmentKey]) {
        dailyExpenses[dateKey].departments[departmentKey] = {
          name: departmentKey,
          amount: 0,
          items: []
        };
      }

      let expenseTotal = 0;
      expense.ExpenseItems.forEach(item => {
        if (item.status !== 'refunded' && item.status !== 'paid') {
          const itemAmount = parseFloat(item.amount || 0);
          expenseTotal += itemAmount;
          
          dailyExpenses[dateKey].departments[departmentKey].items.push({
            id: item.expenseItemId,
            paidTo: item.paidTo,
            categoryId: item.categoryId,
            categoryName: item.Category?.name || 'Uncategorized',
            amount: itemAmount,
            status: item.status
          });
        }
      });

      dailyExpenses[dateKey].departments[departmentKey].amount += expenseTotal;
      dailyExpenses[dateKey].totalAmount += expenseTotal;
    });

    const dailyExpensesArray = Object.values(dailyExpenses).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );

    const allDepartments = await Department.findAll({
      where: { status: 'active' },
      attributes: ['departmentId', 'departmentName'],
      order: [['departmentName', 'ASC']]
    });

    return res.status(200).json({
      success: true,
      data: {
        departments: allDepartments.map(d => ({ id: d.departmentId, name: d.departmentName })),
        dailyExpenses: dailyExpensesArray
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyExpenses:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get monthly expenses data',
      error: error.message
    });
  }
};

// Get summary of monthly expenses
exports.getMonthlyExpensesSummary = async (req, res) => {
  try {
    const { month, year, departmentId } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ 
        success: false, 
        message: 'Month and year parameters are required' 
      });
    }

    const monthInt = parseInt(month);
    const yearInt = parseInt(year);

    // Calculate start and end dates for the given month
    const startDate = new Date(yearInt, monthInt - 1, 1);
    const endDate = new Date(yearInt, monthInt, 0); 
    endDate.setHours(23, 59, 59, 999);

    const whereClause = {
      date: {
        [Op.between]: [startDate, endDate]
      }
    };

    // Add department filter if provided
    if (departmentId && departmentId !== 'all') {
      whereClause.departmentId = departmentId;
    }

    // Get all expenses for the month
    const expenses = await Expense.findAll({
      where: whereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentId', 'departmentName']
        },
        {
          model: ExpenseItem,
          where: {
            status: {
              [Op.notIn]: ['refunded', 'paid']
            }
          },
          required: false,
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

    // Calculate department-specific totals
    const departmentTotals = {};
    let totalExpense = 0;

    expenses.forEach(expense => {
      const deptId = expense.departmentId;
      const deptName = expense.Department?.departmentName || 'Uncategorized';
      
      if (!departmentTotals[deptId]) {
        departmentTotals[deptId] = {
          name: deptName,
          amount: 0
        };
      }

      const expenseTotal = expense.ExpenseItems.reduce((sum, item) => {
        return sum + parseFloat(item.amount || 0);
      }, 0);

      departmentTotals[deptId].amount += expenseTotal;
      totalExpense += expenseTotal;
    });

    // Get all departments for complete reporting
    const allDepartments = await Department.findAll({
      where: { status: 'active' },
      attributes: ['departmentId', 'departmentName']
    });

    // Ensure all departments are represented in the totals
    allDepartments.forEach(dept => {
      if (!departmentTotals[dept.departmentId]) {
        departmentTotals[dept.departmentId] = {
          name: dept.departmentName,
          amount: 0
        };
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalExpense,
        departmentTotals,
        departments: allDepartments.map(d => ({ id: d.departmentId, name: d.departmentName })),
      }
    });
  } catch (error) {
    console.error('Error in getMonthlyExpensesSummary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get monthly expenses summary',
      error: error.message
    });
  }
};
