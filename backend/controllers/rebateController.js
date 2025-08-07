const RebateService = require('../services/rebateService');
const { ReferrerRebate, Referrer } = require('../models');
const { Op } = require('sequelize');

exports.getRebatesByDate = async (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const rebates = await RebateService.getRebatesByDateRange(date, date);
    
    res.json({
      success: true,
      data: rebates
    });
  } catch (error) {
    console.error('Error fetching rebates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rebates',
      error: error.message
    });
  }
};

exports.getMonthlyRebates = async (req, res) => {
  try {
    const { month = new Date().getMonth() + 1, year = new Date().getFullYear() } = req.query;
    
    const summary = await RebateService.getMonthlyRebateSummary(month, year);
    
    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error fetching monthly rebates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly rebates',
      error: error.message
    });
  }
};

exports.getRebatesByReferrer = async (req, res) => {
  try {
    const { referrerId, startDate, endDate } = req.query;
    
    if (!referrerId) {
      return res.status(400).json({
        success: false,
        message: 'Referrer ID is required'
      });
    }

    const whereClause = { 
      referrerId,
      status: 'active'
    };

    if (startDate && endDate) {
      whereClause.rebateDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const rebates = await ReferrerRebate.findAll({
      where: whereClause,
      include: [
        {
          model: Referrer,
          attributes: ['firstName', 'lastName', 'clinicName']
        }
      ],
      order: [['rebateDate', 'DESC']]
    });

    res.json({
      success: true,
      data: rebates
    });
  } catch (error) {
    console.error('Error fetching referrer rebates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch referrer rebates',
      error: error.message
    });
  }
};