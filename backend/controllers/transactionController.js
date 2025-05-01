const { Transaction, TestDetails, ActivityLog, Department, sequelize} = require('../models');
const { validateUUID } = require('../utils/validation');

// Function to validate 5-digit ID format (replace validateUUID)
const validate5DigitId = (id) => {
  return /^\d{5}$/.test(id);
};

exports.createTransaction = async (req, res) => {
  let t; 
  
  try {
    const {
      firstName,
      lastName,
      idType,
      referrerId,
      birthDate,
      sex,
      items,
      userId
    } = req.body;

    // Generate 5-digit mcNo
    const mcNo = Math.floor(10000 + Math.random() * 90000).toString();

    // Validate required fields
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Missing patient name information'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test items provided'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Start a transaction
    t = await sequelize.transaction();

    // Calculate totals from items
    let totalAmount = 0;
    let totalDiscountAmount = 0;
    let totalCashAmount = 0;
    let totalGCashAmount = 0;
    let totalBalanceAmount = 0;

    items.forEach(item => {
      const originalPrice = parseFloat(item.originalPrice) || 0;
      const discountedPrice = parseFloat(item.discountedPrice) || 0;
      const cashAmount = parseFloat(item.cashAmount) || 0;
      const gCashAmount = parseFloat(item.gCashAmount) || 0;
      const balanceAmount = parseFloat(item.balanceAmount) || 0;
      
      totalAmount += originalPrice;
      totalDiscountAmount += (originalPrice - discountedPrice);
      totalCashAmount += cashAmount;
      totalGCashAmount += gCashAmount;
      totalBalanceAmount += balanceAmount;
    });

    // Create the transaction record
    const transaction = await Transaction.create({
      mcNo,  // Use the generated 5-digit mcNo
      firstName,
      lastName,
      idType,
      referrerId: referrerId || null, 
      birthDate: birthDate || null, 
      sex,
      transactionDate: new Date(),
      totalAmount,
      totalDiscountAmount,
      totalCashAmount,
      totalGCashAmount,
      totalBalanceAmount,
      status: 'active',
      userId
    }, { transaction: t });

    // Create the test detail records
    const testDetails = await Promise.all(
      items.map(async item => {
        try {
          return await TestDetails.create({
            transactionId: transaction.transactionId,
            testId: item.testId,
            testName: item.testName,
            departmentId: item.departmentId,
            originalPrice: parseFloat(item.originalPrice) || 0,
            discountPercentage: parseInt(item.discountPercentage) || 0,
            discountedPrice: parseFloat(item.discountedPrice) || 0,
            cashAmount: parseFloat(item.cashAmount) || 0,
            gCashAmount: parseFloat(item.gCashAmount) || 0,
            balanceAmount: parseFloat(item.balanceAmount) || 0,
            status: 'active'
          }, { transaction: t });
        } catch (itemError) {
          console.error(`Error creating test detail: ${itemError.message}`, item);
          throw itemError; // Rethrow to trigger transaction rollback
        }
      })
    );

    // Log activity - Fix field name from entityType to resourceType
    await ActivityLog.create({
      action: 'CREATE',
      details: `Created new transaction for ${firstName} ${lastName}`,
      resourceType: 'TRANSACTION', 
      entityId: transaction.transactionId,
      userId
    }, { transaction: t });

    // Commit the transaction
    await t.commit();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction,
        items: testDetails
      }
    });
  } catch (error) {
    // Rollback transaction if it exists
    if (t) await t.rollback();
    
    console.error('Transaction creation error:', error);
    
    // Send detailed error response
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get all transactions with pagination
exports.getAllTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: TestDetails,
          attributes: ['testName', 'departmentId', 'originalPrice', 'discountPercentage', 
                      'discountedPrice', 'cashAmount', 'gCashAmount', 'balanceAmount']
        }
      ]
    });

    res.json({
      success: true,
      data: {
        count,
        transactions: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions',
      error: error.message
    });
  }
};

// Get transaction by ID
exports.getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!validate5DigitId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format. Must be a 5-digit number.'
      });
    }

    const transaction = await Transaction.findByPk(id, {
      include: [
        {
          model: TestDetails,
          include: [
            {
              model: Department,
              attributes: ['departmentName']
            }
          ]
        }
      ]
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction',
      error: error.message
    });
  }
};

// Update transaction status
exports.updateTransactionStatus = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, currentUserId } = req.body;
    
    if (!validate5DigitId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid transaction ID format. Must be a 5-digit number.'
      });
    }

    if (!status || !['active', 'inactive', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const transaction = await Transaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    await transaction.update({ status }, { transaction: t });

    // Update transaction items status
    await TestDetails.update(
      { status },
      { 
        where: { transactionId: id },
        transaction: t
      }
    );

    // Log activity - Fix field name from entityType to resourceType
    await ActivityLog.create({
      action: 'UPDATE',
      details: `Updated transaction status to ${status}`,
      resourceType: 'TRANSACTION', // Changed from entityType to resourceType
      entityId: id,
      userId: currentUserId
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Transaction status updated successfully',
      data: transaction
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction status',
      error: error.message
    });
  }
};

// Get transactions by patient name
exports.searchTransactions = async (req, res) => {
  try {
    const { name, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    if (name) {
      whereClause[sequelize.Op.or] = [
        { firstName: { [sequelize.Op.iLike]: `%${name}%` } },
        { lastName: { [sequelize.Op.iLike]: `%${name}%` } }
      ];
    }
    
    if (startDate && endDate) {
      whereClause.transactionDate = {
        [sequelize.Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: TestDetails
        }
      ]
    });

    res.json({
      success: true,
      data: {
        count,
        transactions: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page)
      }
    });
  } catch (error) {
    console.error('Error searching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search transactions',
      error: error.message
    });
  }
};
