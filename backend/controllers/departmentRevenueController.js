const { Department, DepartmentRevenue, sequelize, TestDetails, Transaction } = require('../models');
const { Op } = require('sequelize');

// Get revenue by department with optional date range
exports.getRevenueByDepartment = async (req, res) => {
  try {
    const { startDate, endDate, excludeCancelled = 'true' } = req.query;
    
    const whereClause = {};
    
    // Add date filter if provided
    if (startDate && endDate) {
      whereClause.revenueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Exclude cancelled or refunded transactions 
    if (excludeCancelled === 'true') {
      whereClause.status = 'active';
    }

    // Get total revenue by department
    const departmentRevenue = await DepartmentRevenue.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('sum', sequelize.col('amount')), 'totalRevenue']
      ],
      where: whereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentName']
        }
      ],
      group: ['departmentId', 'Department.departmentId'],
      order: [[sequelize.fn('sum', sequelize.col('amount')), 'DESC']]
    });

    // Get overall total
    const totalRevenue = await DepartmentRevenue.sum('amount', {
      where: whereClause
    });
    
    // Get refunded amounts by department to provide complete information
    const refundWhereClause = { status: { [Op.in]: ['refunded', 'cancelled'] } };
    
    if (startDate && endDate) {
      refundWhereClause.revenueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    const refundsByDepartment = await DepartmentRevenue.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('sum', sequelize.col('amount')), 'totalRefund']
      ],
      where: refundWhereClause,
      group: ['departmentId'],
      raw: true
    });
    
    // Add refund information to the department revenue data
    departmentRevenue.forEach(dept => {
      const refund = refundsByDepartment.find(r => r.departmentId === dept.departmentId);
      dept.dataValues.totalRefund = refund ? parseFloat(refund.totalRefund) : 0;
      dept.dataValues.netRevenue = dept.dataValues.totalRevenue - (refund ? parseFloat(refund.totalRefund) : 0);
    });

    res.json({
      success: true,
      data: {
        departmentRevenue,
        totalRevenue: totalRevenue || 0
      }
    });
  } catch (error) {
    console.error('Error getting department revenue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department revenue',
      error: error.message
    });
  }
};

// Get revenue trend over time (daily, weekly, monthly) using Sequelize native approach
exports.getRevenueTrend = async (req, res) => {
  try {
    const { period = 'monthly', startDate, endDate, departmentId, excludeCancelled = 'true' } = req.query;
    
    // Build the where clause for date and department filters
    const whereClause = {};
    
    if (startDate && endDate) {
      whereClause.revenueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }
    
    if (departmentId) {
      whereClause.departmentId = departmentId;
    }
    
    // Exclude cancelled or refunded transactions 
    if (excludeCancelled === 'true') {
      whereClause.status = 'active';
    }
    
    // Define time period formatting attributes based on the selected period
    let timePeriodAttribute;
    switch (period) {
      case 'daily':
        // Format: YYYY-MM-DD
        timePeriodAttribute = [
          sequelize.fn('DATE', sequelize.col('revenueDate')), 
          'timePeriod'
        ];
        break;
      case 'weekly':
        // Format: YYYY-Week WW
        timePeriodAttribute = [
          sequelize.literal(`CONCAT(YEAR(revenueDate), '-Week ', WEEK(revenueDate))`),
          'timePeriod'
        ];
        break;
      case 'monthly':
      default:
        // Format: YYYY-MM
        timePeriodAttribute = [
          sequelize.fn('DATE_FORMAT', sequelize.col('revenueDate'), '%Y-%m'),
          'timePeriod'
        ];
        break;
    }

    // Perform the grouped query using Sequelize's native methods
    const revenueTrend = await DepartmentRevenue.findAll({
      attributes: [
        timePeriodAttribute,
        [sequelize.fn('SUM', sequelize.col('amount')), 'revenue']
      ],
      where: whereClause,
      group: ['timePeriod'],
      order: [['timePeriod', 'ASC']],
      raw: true // Return plain objects instead of model instances
    });

    res.json({
      success: true,
      data: revenueTrend
    });
  } catch (error) {
    console.error('Error getting revenue trend:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve revenue trend',
      error: error.message
    });
  }
};

// Get refunds by department with optional date range
exports.getRefundsByDepartment = async (req, res) => {
  try {
    const { startDate, endDate, date } = req.query;
    
    const whereClause = {};
    
    // Add date filter based on provided parameters
    if (startDate && endDate) {
      whereClause.revenueDate = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (date) {
      // If single date is provided, get refunds for that specific day
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      whereClause.revenueDate = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      };
    }
    
    // First, do a quick check to see if there are any refunds at all
    const hasAnyRefunds = await DepartmentRevenue.count({
      where: {
        ...whereClause,
        [Op.or]: [
          { status: 'refunded' },
          { status: 'cancelled' }
        ]
      }
    });
    
    // Also check for refunded test details
    const testDetailCheckWhereClause = { status: 'refunded' };
    if (startDate && endDate) {
      testDetailCheckWhereClause.updatedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      testDetailCheckWhereClause.updatedAt = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      };
    }
    
    const hasAnyTestRefunds = await TestDetails.count({
      where: testDetailCheckWhereClause
    });
    
    // If there are no refunds at all, return empty result early
    if (hasAnyRefunds === 0 && hasAnyTestRefunds === 0) {
      return res.json({
        success: true,
        data: {
          departmentRefunds: [],
          totalRefund: 0,
          departmentCancellations: [],
          totalCancelled: 0,
          refundDetails: {
            deptRevenueTotalRefund: 0,
            rawTotalRefund: 0,
            metadataRefundTotal: 0,
            totalTestRefunds: 0
          }
        }
      });
    }
    
    // First query: Get only actual refunds (status is 'refunded' OR has metadata.isRefunded = true)
    const refundWhereClause = {
      ...whereClause,
      [Op.or]: [
        { status: 'refunded' },
        sequelize.literal("(metadata::json->>'isRefunded')::boolean = true")
      ]
    };

    // Second query: Get only cancellations (has metadata.isCancellation = true)
    const cancellationWhereClause = {
      ...whereClause,
      [Op.and]: [
        { status: 'cancelled' }, 
        sequelize.literal("(metadata::json->>'isCancellation')::boolean = true")
      ]
    };

    // Get refunded amounts by department (actual refunds)
    const departmentRefunds = await DepartmentRevenue.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('sum', sequelize.col('amount')), 'totalRefund'],
        // Add a literal to extract refundAmount from metadata when available
        [
          sequelize.literal(`
            SUM(
              CASE WHEN metadata IS NOT NULL AND (metadata::json->>'refundAmount') IS NOT NULL 
              THEN (metadata::json->>'refundAmount')::decimal(10,2)
              ELSE 0 
              END
            )
          `),
          'metadataRefundAmount'
        ]
      ],
      where: refundWhereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentName']
        }
      ],
      group: ['departmentId', 'Department.departmentId'],
      order: [[sequelize.fn('sum', sequelize.col('amount')), 'DESC']]
    });

    // Get cancelled amounts by department
    const departmentCancellations = await DepartmentRevenue.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('sum', sequelize.col('amount')), 'totalCancelled']
      ],
      where: cancellationWhereClause,
      include: [
        {
          model: Department,
          attributes: ['departmentName']
        }
      ],
      group: ['departmentId', 'Department.departmentId'],
      order: [[sequelize.fn('sum', sequelize.col('amount')), 'DESC']]
    });

    // Get total refunded amount from DepartmentRevenue
    const rawTotalRefund = await DepartmentRevenue.sum('amount', {
      where: refundWhereClause
    }) || 0;
    
    // Also get total refund amount from metadata
    const metadataRefundResult = await DepartmentRevenue.findOne({
      attributes: [
        [
          sequelize.literal(`
            SUM(
              CASE WHEN metadata IS NOT NULL AND (metadata::json->>'refundAmount') IS NOT NULL 
              THEN (metadata::json->>'refundAmount')::decimal(10,2)
              ELSE 0 
              END
            )
          `), 
          'totalMetadataRefund'
        ]
      ],
      where: {
        ...whereClause,
        metadata: {
          [Op.not]: null
        }
      },
      raw: true
    });
    
    const metadataRefundTotal = metadataRefundResult?.totalMetadataRefund || 0;

    // Get total cancelled amount
    const totalCancelled = await DepartmentRevenue.sum('amount', {
      where: cancellationWhereClause
    }) || 0;

    // Also include test-level refunds that might not be captured in DepartmentRevenue
    const testDetailWhereClause = { status: 'refunded' };
    
    if (startDate && endDate) {
      testDetailWhereClause.updatedAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    } else if (date) {
      const targetDate = new Date(date);
      const nextDay = new Date(targetDate);
      nextDay.setDate(nextDay.getDate() + 1);
      
      testDetailWhereClause.updatedAt = {
        [Op.gte]: targetDate,
        [Op.lt]: nextDay
      };
    }
    
    // Get test-level refunds by department
    const testRefunds = await TestDetails.findAll({
      attributes: [
        'departmentId',
        [sequelize.fn('sum', sequelize.col('originalPrice')), 'testRefundAmount']
      ],
      where: testDetailWhereClause,
      group: ['departmentId'],
      raw: true
    });
    
    // Track total test refunds separately
    const totalTestRefunds = await TestDetails.sum('originalPrice', {
      where: testDetailWhereClause
    }) || 0;
    
    // Combine both datasets
    const combinedRefunds = [...departmentRefunds];
    
    // Add test refunds that might not be in department refunds
    testRefunds.forEach(testRefund => {
      const existingDept = combinedRefunds.find(
        dept => dept.departmentId === testRefund.departmentId
      );
      
      if (existingDept) {
        // Add to existing department
        existingDept.dataValues.totalRefund = 
          parseFloat(existingDept.dataValues.totalRefund || 0) + 
          parseFloat(testRefund.testRefundAmount || 0);
      } else {
        // Create new department entry
        const dept = { 
          departmentId: testRefund.departmentId,
          dataValues: {
            departmentId: testRefund.departmentId,
            totalRefund: parseFloat(testRefund.testRefundAmount || 0)
          }
        };
        combinedRefunds.push(dept);
      }
    });
    
    // Calculate total refund (include both department revenue and test detail refunds)
    // Use the larger of the metadata refund total or the raw total
    const deptRevenueTotalRefund = Math.max(rawTotalRefund, metadataRefundTotal);
    const totalRefund = deptRevenueTotalRefund + totalTestRefunds;

    res.json({
      success: true,
      data: {
        departmentRefunds: combinedRefunds,
        totalRefund: totalRefund,
        departmentCancellations: departmentCancellations,
        totalCancelled: totalCancelled,
        // Include detailed breakdown for debugging
        refundDetails: {
          deptRevenueTotalRefund,
          rawTotalRefund,
          metadataRefundTotal, 
          totalTestRefunds
        }
      }
    });
  } catch (error) {
    console.error('Error getting department refunds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve department refunds',
      error: error.message
    });
  }
};
