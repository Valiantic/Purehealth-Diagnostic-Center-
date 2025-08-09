const { Transaction, TestDetails, ActivityLog, Department, DepartmentRevenue, Referrer, sequelize } = require('../models');
const { Op } = require('sequelize'); // Fix: use CommonJS require syntax instead of ES Module import
const socketManager = require('../utils/socketManager');
const RebateService = require('../services/rebateService');

// Create a new transaction with items and track department revenue
exports.createTransaction = async (req, res) => {
  let t; // Define transaction object for rollback
  
  try {
    const {
      mcNo,
      firstName,
      lastName,
      idType,
      idNumber,  
      referrerId,
      birthDate,
      sex,
      items,
      userId
    } = req.body;

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

    // Start a database transaction
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
    
      // Use the already calculated values from frontend
      totalAmount += discountedPrice; 
      totalDiscountAmount += (originalPrice - discountedPrice);
      totalCashAmount += cashAmount;
      totalGCashAmount += gCashAmount;
      totalBalanceAmount += balanceAmount;  
    });

    // Note: PWD/Senior Citizen discount is already applied in frontend calculations
    // No need to apply additional discount here
    // Generate sequential MC number if not provided
    let generatedMcNo;
    if (mcNo) {
      generatedMcNo = mcNo;
    } else {
      // Find the highest MC number in the database using Sequelize literal to cast as integer
      const highestMcTransaction = await Transaction.findOne({
        attributes: ['mcNo'],
        order: [sequelize.literal('CAST(mcNo AS UNSIGNED) DESC')],
        transaction: t
      });
      
      // Generate the next MC number
      if (highestMcTransaction && highestMcTransaction.mcNo) {
        // Convert string to number, increment, then format back to string with leading zeros
        const currentNumber = parseInt(highestMcTransaction.mcNo, 10);
        const nextNumber = currentNumber + 1;
        
        generatedMcNo = String(nextNumber).padStart(5, '0');
        console.log(`Found highest mcNo: ${highestMcTransaction.mcNo}, generating next: ${generatedMcNo}`);
      } else {
        // If no existing transactions, start from 10000
        generatedMcNo = '10000';
        console.log('No existing transactions found, starting from: 10000');
      }
    }
    
    console.log(`Using mcNo: ${generatedMcNo}`);

    // Create the transaction record
    const transaction = await Transaction.create({
      mcNo: generatedMcNo,
      firstName,
      lastName,
      idType,
      idNumber,  
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

    console.log(`Created transaction with ID: ${transaction.transactionId}`);

    // Create the test detail records with explicit logging
    const testDetails = [];
    for (const item of items) {
      try {
        console.log(`Creating test detail for item: ${item.testName}`);
        // Create test detail with explicit values
        const testDetail = await TestDetails.create({
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
        
        console.log(`Created test detail with ID: ${testDetail.testDetailId}`);
        testDetails.push(testDetail);
        
        // Try to create department revenue record if possible
        try {
          await DepartmentRevenue.create({
            departmentId: item.departmentId,
            transactionId: transaction.transactionId,
            testDetailId: testDetail.testDetailId,
            amount: parseFloat(item.discountedPrice) || 0,
            revenueDate: new Date()
          }, { transaction: t });
        } catch (revenueError) {
          console.error('Error creating revenue record:', revenueError.message);
          // Continue without failing the whole transaction
        }
      } catch (itemError) {
        console.error(`Error creating test detail:`, itemError);
        console.error('Item data:', JSON.stringify(item));
        throw itemError; // Rethrow to trigger transaction rollback
      }
    }

    // Calculate rebates for this transaction (after all test details are created)
    if (transaction.referrerId) {
      try {
        await RebateService.calculateAndRecordRebate(transaction, testDetails);
      } catch (rebateError) {
        console.error('Error calculating rebates:', rebateError);
      }
    }

    // Log activity
    await ActivityLog.create({
      action: 'CREATE',
      details: `Created new transaction for ${firstName} ${lastName}`,
      resourceType: 'TRANSACTION',
      entityId: transaction.transactionId,
      userId
    }, { transaction: t });

    // Commit the transaction
    await t.commit();

    // Emit socket event for real-time dashboard update
    socketManager.emitTransactionUpdate(transaction);

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
    const { page = 1, limit = 10, status, date, referrerId, includeDetails } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.transactionDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    if (referrerId) {
      whereClause.referrerId = referrerId;
    }

    const includes = [];
    
    includes.push({
      model: TestDetails,
      attributes: ['testDetailId', 'testName', 'departmentId', 'originalPrice', 'discountPercentage', 
                  'discountedPrice', 'cashAmount', 'gCashAmount', 'balanceAmount', 'status']
    });
    
    if (includeDetails === 'true') {
      includes.push({
        model: DepartmentRevenue,
        attributes: ['revenueId', 'departmentId', 'amount', 'status'],
        where: { status: 'active' }, // Only include active revenues
        required: false // Use LEFT JOIN so we still get transactions without revenues
      });
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: includes
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

    // For cancellations, handle department revenue records and rebate adjustments
    if (status === 'cancelled') {
      // Get all department revenues for this transaction
      const departmentRevenues = await DepartmentRevenue.findAll({
        where: { transactionId: id },
        transaction: t
      });

      // Update each revenue record to reflect cancellation, not refund
      for (const revenue of departmentRevenues) {
        // Get existing metadata or create empty object
        let metadata = {};
        try {
          if (revenue.metadata) {
            metadata = typeof revenue.metadata === 'string' ? 
              JSON.parse(revenue.metadata) : revenue.metadata;
          }
        } catch (e) {
          console.error('Error parsing revenue metadata:', e);
        }

        // Update metadata with cancellation flag
        metadata.isCancellation = true;
        metadata.isRefund = false;
        metadata.cancelledAt = new Date().toISOString();
        metadata.cancelledBy = currentUserId;

        // Update the revenue record
        await revenue.update({
          status: 'cancelled',
          metadata: JSON.stringify(metadata)
        }, { transaction: t });
      }

      // Handle rebate adjustments for cancelled transactions
      try {
        // Pass the database transaction to the rebate service
        await RebateService.handleTransactionCancellation(id, currentUserId, t);
      } catch (rebateError) {
        console.error('Error adjusting rebates for cancelled transaction:', rebateError);
        // Don't fail the transaction cancellation if rebate adjustment fails
      }
    }

    // Log activity with specific message for cancelled status
    let activityDetails;
    if (status === 'cancelled') {
      const patientName = `${transaction.firstName} ${transaction.lastName}`;
      activityDetails = `Cancelled transaction for ${patientName}`;
    } else {
      activityDetails = `Updated transaction status to ${status}`;
    }

    await ActivityLog.create({
      action: status === 'cancelled' ? 'CANCEL_TRANSACTION' : 'UPDATE',
      details: activityDetails,
      resourceType: 'TRANSACTION',
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

// Update transaction details
exports.updateTransaction = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      mcNo,
      firstName, 
      lastName, 
      referrerId,
      birthDate,
      sex,
      idType,
      idNumber,
      userId,
      testDetails,
      isRefundProcessing,
      excessRefunds
    } = req.body;
    
    const transaction = await Transaction.findByPk(id);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Track referrer change for rebate adjustments
    const oldReferrerId = transaction.referrerId;
    const newReferrerId = referrerId === "Out Patient" || referrerId === "" ? null : referrerId;
    const referrerChanged = oldReferrerId !== newReferrerId;

    // Update transaction with provided values
    const updateData = {};
    if (mcNo !== undefined) updateData.mcNo = mcNo;
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    // Convert "Out Patient" string to null for the database
    if (referrerId !== undefined) {
      updateData.referrerId = referrerId === "Out Patient" || referrerId === "" ? null : referrerId;
    }
    if (birthDate !== undefined) updateData.birthDate = birthDate;
    if (sex !== undefined) updateData.sex = sex;
    if (idType !== undefined) updateData.idType = idType;
    if (idNumber !== undefined) updateData.idNumber = idNumber;

    await transaction.update(updateData, { transaction: t });

    // Initialize variables outside the scope to avoid reference errors
    let totalCashAmount = 0;
    let totalGCashAmount = 0;
    let totalBalanceAmount = 0;
    let totalRefundAmount = 0;
    let totalDiscountAmount = 0;
    let totalExcessRefundAmount = 0;
    let refundedTestDetails = []; // Track refunded test details for rebate adjustment

    // Update test details if provided
    if (testDetails && Array.isArray(testDetails)) {
      
      // Process each test detail and update department revenue
      for (const detail of testDetails) {
        if (detail.testDetailId) {
          // Get the original test detail before updating
          const originalTestDetail = await TestDetails.findByPk(detail.testDetailId);
          if (!originalTestDetail) continue;
          
          // Parse values safely and ensure they're numbers
          const originalPrice = parseFloat(originalTestDetail.originalPrice) || 0;
          const discountPercentage = parseInt(detail.discountPercentage) || 0;
          const discountedPrice = parseFloat(detail.discountedPrice) || 0;
          const cashAmount = parseFloat(detail.cashAmount) || 0;
          const gCashAmount = parseFloat(detail.gCashAmount) || 0;
          const totalPayment = cashAmount + gCashAmount;
          
          // Calculate discount amount explicitly
          const discountAmount = originalPrice - discountedPrice;
          totalDiscountAmount += discountAmount;
          
          // Calculate refund if payment exceeds discounted price or if item was explicitly marked for refund
          let refundAmount = 0;
          let isRefunded = !!detail.isRefunded;
          
          if (isRefunded) {
            // Track refunded test details for rebate adjustment
            refundedTestDetails.push({
              testDetailId: detail.testDetailId,
              departmentId: originalTestDetail.departmentId,
              discountedPrice: parseFloat(originalTestDetail.discountedPrice) || 0,
              testName: originalTestDetail.testName
            });
        
            refundAmount = parseFloat(originalTestDetail.originalPrice) || 0;
            totalRefundAmount += refundAmount;
            
            await ActivityLog.create({
              action: 'REFUND',
              details: `Manual refund of test: ${originalTestDetail.testName} - ₱${refundAmount.toFixed(2)}`,
              resourceType: 'TRANSACTION',
              entityId: id,
              userId: userId || transaction.userId,
              metadata: JSON.stringify({
                refundAmount: refundAmount,
                testDetailId: detail.testDetailId,
                isManualRefund: true,
                testName: originalTestDetail.testName
              })
            }, { transaction: t });
          } 
          else if (totalPayment > discountedPrice) {
            // Handle automatic refunds from overpayment
            refundAmount = totalPayment - discountedPrice;
            totalRefundAmount += refundAmount;
            
            // Log the automatic refund with the amount clearly shown
            await ActivityLog.create({
              action: 'REFUND',
              details: `Automatic refund for test: ${originalTestDetail.testName} - ₱${refundAmount.toFixed(2)} due to overpayment`,
              resourceType: 'TRANSACTION',
              entityId: id,
              userId: userId || transaction.userId,
              metadata: JSON.stringify({
                refundAmount: refundAmount,
                testDetailId: detail.testDetailId,
                isManualRefund: false,
                testName: originalTestDetail.testName
              })
            }, { transaction: t });
          }
          
          // Calculate balance (cannot be negative)
          const balanceAmount = Math.max(0, discountedPrice - totalPayment);
          
          // Update the test detail with all values including refund status
          await TestDetails.update(
            {
              discountPercentage: discountPercentage,
              discountedPrice: discountedPrice,
              cashAmount: cashAmount,
              gCashAmount: gCashAmount,
              balanceAmount: balanceAmount,
              status: isRefunded ? 'refunded' : 'active'
            },
            {
              where: { testDetailId: detail.testDetailId },
              transaction: t
            }
          );
          
          // Update department revenue to reflect the discounted price or mark as refunded
          await DepartmentRevenue.update(
            {
              amount: isRefunded ? 0 : discountedPrice, // Set amount to 0 when refunded
              status: isRefunded ? 'refunded' : 'active', // Mark as refunded in department revenue
              metadata: JSON.stringify({
                originalAmount: originalPrice,
                discountAmount: discountAmount,
                discountPercentage: discountPercentage,
                refundAmount: isRefunded ? discountedPrice : 0,
                isRefunded: isRefunded
              })
            },
            {
              where: { 
                testDetailId: detail.testDetailId,
                transactionId: id
              },
              transaction: t
            }
          );
          
          // Only add active tests to running totals
          if (!isRefunded) {
            totalCashAmount += cashAmount;
            totalGCashAmount += gCashAmount;
            totalBalanceAmount += balanceAmount;
          }
        }
      }
      
      // Calculate total excess refunds from overpayment adjustments
      if (excessRefunds && typeof excessRefunds === 'object') {
        totalExcessRefundAmount = Object.values(excessRefunds).reduce((sum, amount) => {
          return sum + (parseFloat(amount) || 0);
        }, 0);
      }
      
      // Handle rebate adjustments for refunded test details
      if (refundedTestDetails.length > 0) {
        try {
          await RebateService.handleTestDetailRefund(id, refundedTestDetails, userId || transaction.userId, t);
        } catch (rebateError) {
          console.error('Error adjusting rebates for refunded test details:', rebateError);
          // Don't fail the transaction update if rebate adjustment fails
        }
      }
      
      // Handle referrer changes and update rebate expenses
      if (referrerChanged) {
        try {
          await RebateService.handleReferrerChange(id, oldReferrerId, newReferrerId, userId || transaction.userId, t);
        } catch (rebateError) {
          console.error('Error handling referrer change for rebates:', rebateError);
          // Don't fail the transaction update if rebate adjustment fails
        }
      }
      
      // Update transaction totals
      await transaction.update({
        totalCashAmount,
        totalGCashAmount,
        totalBalanceAmount,
        totalDiscountAmount,
        metadata: JSON.stringify({
          ...JSON.parse(transaction.metadata || '{}'),
          totalRefundAmount,
          totalDiscountAmount,
          excessRefundAmount: totalExcessRefundAmount,
          excessRefunds: excessRefunds || {},
          refundProcessed: isRefundProcessing ? true : false,
          updatedAt: new Date().toISOString()
        })
      }, { transaction: t });
    }

    // Log activity
    let activityDetails = `Updated transaction details for ${transaction.firstName} ${transaction.lastName}`;
    
    // Add referrer change information to activity log if present
    if (referrerChanged) {
      const oldReferrerName = oldReferrerId ? 
        (await Referrer.findByPk(oldReferrerId))?.lastName ? `Dr. ${(await Referrer.findByPk(oldReferrerId)).lastName}` : 'Unknown' 
        : 'Out Patient';
      const newReferrerName = newReferrerId ? 
        (await Referrer.findByPk(newReferrerId))?.lastName ? `Dr. ${(await Referrer.findByPk(newReferrerId)).lastName}` : 'Unknown'
        : 'Out Patient';
      activityDetails += `. Referrer changed from ${oldReferrerName} to ${newReferrerName}`;
    }
    
    // Add excess refund information to activity log if present
    if (totalExcessRefundAmount > 0) {
      activityDetails += `. Excess refund amount: ₱${totalExcessRefundAmount.toFixed(2)} due to payment adjustments`;
    }
    
    await ActivityLog.create({
      action: 'UPDATE',
      details: activityDetails,
      resourceType: 'TRANSACTION',
      entityId: id,
      userId: userId || transaction.userId,
      metadata: JSON.stringify({
        totalExcessRefundAmount,
        excessRefunds: excessRefunds || {},
        hasExcessRefunds: totalExcessRefundAmount > 0
      })
    }, { transaction: t });

    await t.commit();

    // Fetch the updated transaction with details for response
    const updatedTransaction = await Transaction.findByPk(id, {
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

    res.json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error.message
    });
  }
};

// Check if MC# exists
exports.checkMcNoExists = async (req, res) => {
  try {
    const { mcNo } = req.query;
    
    if (!mcNo) {
      return res.status(400).json({
        success: false,
        message: 'MC number is required'
      });
    }
    
    const transaction = await Transaction.findOne({
      where: { mcNo }
    });
    
    res.json({
      success: true,
      exists: !!transaction,
      data: transaction || null
    });
  } catch (error) {
    console.error('Error checking MC number:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check MC number',
      error: error.message
    });
  }
};

// Search transactions by patient name or date range
exports.searchTransactions = async (req, res) => {
  try {
    const { name, startDate, endDate, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const whereClause = {};
    
    if (name) {
      whereClause[Op.or] = [
        { firstName: { [Op.like]: `%${name}%` } },
        { lastName: { [Op.like]: `%${name}%` } }
      ];
    }
    
    if (startDate && endDate) {
      whereClause.transactionDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const { count, rows } = await Transaction.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['transactionDate', 'DESC']],
      include: [
        {
          model: TestDetails,
          attributes: ['testDetailId', 'testName', 'departmentId', 'originalPrice', 
                      'discountPercentage', 'discountedPrice', 'cashAmount', 
                      'gCashAmount', 'balanceAmount']
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

// Get transactions by referrer ID
exports.getTransactionsByReferrerId = async (req, res) => {
  try {
    const { referrerId, date } = req.query;
    
    if (!referrerId) {
      return res.status(400).json({
        success: false,
        message: 'Referrer ID is required'
      });
    }
    
    const whereClause = {
      referrerId: referrerId,
      status: 'active' // Only include active transactions
    };
    
    // Add date filter if provided
    if (date) {
      // Create a date range for the entire day
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      whereClause.transactionDate = {
        [Op.between]: [startDate, endDate]
      };
    }
    
    const transactions = await Transaction.findAll({
      where: whereClause,
      include: [
        {
          model: DepartmentRevenue,
          attributes: ['revenueId', 'departmentId', 'amount', 'status'],
          where: { status: 'active' }, // Only include active revenues
          required: false
        },
        {
          model: TestDetails,
          attributes: ['testDetailId', 'testName', 'departmentId', 'originalPrice', 
                       'discountPercentage', 'discountedPrice'],
          where: { status: { [Op.ne]: 'deleted' } }, // Exclude deleted tests
          required: false
        }
      ],
      order: [['transactionDate', 'DESC']]
    });
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error getting transactions by referrer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transactions by referrer',
      error: error.message
    });
  }
};