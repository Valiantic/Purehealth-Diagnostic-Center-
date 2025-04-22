const { Referrer, User } = require('../models');
const { Op } = require('sequelize');
const { logActivity } = require('../utils/activityLogger');

// Get all referrers
exports.getAllReferrers = async (req, res) => {
    try {
        const referrers = await Referrer.findAll({
            order: [
                ['lastName', 'ASC'],
                ['firstName', 'ASC']
            ]
        });

        res.json({
            success: true,
            data: referrers 
        })
    } catch (error) {
        console.error('Error fetching referrers:', error);
        res.status(500).json({
            success: false, 
            message: 'Failed to fetch referrers',
            error: error.message
        });
    }
};

// Create a new referrer
exports.createReferrer = async (req, res) => {
    try {
        const {
            firstName, lastName, birthday, sex, contactNo,
            clinicName, clinicAddress, status, currentUserId    
        } = req.body;

        // Validate required fields
        if (!firstName || !lastName) {
            return res.status(400).json({
                success: false,
                message: 'First name and last name are required'
            });
        }

        const newReferrer = await Referrer.create({
            firstName, 
            lastName,
            birthday,
            sex,
            contactNo,
            clinicName,
            clinicAddress,
            status: 'active',
            dateAdded: new Date()
        });

        // Log activity upon adding a referrer
        await logActivity({
            userId: currentUserId,
            action: 'ADD_REFERRER',
            resourceType: 'REFERRER',
            resourceId: newReferrer.referrerId,
            details: `New referrer created: ${firstName} ${lastName}`,
            ipAddress: req.ip
        });
    
        res.status(201).json({
            success: true,
            message: 'Referrer created successfully',
            data: newReferrer
        });
    
    } catch (error) {
        console.error('Error creating referrer:', error);
        res.status(500).json({
            success: false, 
            message: 'Failed to create referrer',
            error: error.message
        });
    }
};

// Update referrer details
exports.updateReferrer = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            firstName, lastName, birthday, sex, contactNo,
            clinicName, clinicAddress, status, currentUserId,
        } = req.body;

        const referrer = await Referrer.findByPk(id);

        if(!referrer) {
            return res.status(404).json({
                success: false,
                message: 'Referrer not found'
            });
        }

        // Store old values for activity log
        const oldValues = {
            firstName: referrer.firstName,
            lastName: referrer.lastName,
            birthday: referrer.birthday,
            sex: referrer.sex,
            contactNo: referrer.contactNo,
            clinicName: referrer.clinicName,
            clinicAddress: referrer.clinicAddress,
            status: referrer.status
        };

        // Determine if status is changing
        const statusChanged = oldValues.status !== status;
        
        // Determine if details are changing
        const detailsChanged = 
            oldValues.firstName !== firstName ||
            oldValues.lastName !== lastName ||
            oldValues.birthday !== birthday ||
            oldValues.sex !== sex ||
            oldValues.contactNo !== contactNo ||
            oldValues.clinicName !== clinicName ||
            oldValues.clinicAddress !== clinicAddress;

        // Update the referrer with all fields
        await referrer.update({
            firstName,
            lastName,
            birthday,
            sex,
            contactNo,
            clinicName,
            clinicAddress,
            status: status || referrer.status
        });

        // SEPAREATE ACTIVITY LOGGING FOR STATUS AND DETAILS
        
        // Log status change if status changed
        if (statusChanged) {
            const statusText = status === 'active' ? 'activated' : 'deactivated';
            const explicitActionType = status === 'active' ? 'ACTIVATE_REFERRER' : 'DEACTIVATE_REFERRER';
            
            await logActivity({
                userId: currentUserId,
                action: explicitActionType,
                resourceType: 'REFERRER',
                resourceId: referrer.referrerId,
                details: `Referrer ${statusText}: ${firstName} ${lastName}`,
                ipAddress: req.ip,
                metadata: {
                    oldStatus: oldValues.status,
                    newStatus: status
                }
            });
        }
        
        // Log details change only if details changed
        if (detailsChanged) {
            await logActivity({
                userId: currentUserId,
                action: 'UPDATE_REFERRER_DETAILS',
                resourceType: 'REFERRER',
                resourceId: referrer.referrerId,
                details: `Updated referrer details: ${firstName} ${lastName}`,
                ipAddress: req.ip,
                metadata: {
                    oldValues: {
                        firstName: oldValues.firstName,
                        lastName: oldValues.lastName,
                        birthday: oldValues.birthday,
                        sex: oldValues.sex,
                        contactNo: oldValues.contactNo,
                        clinicName: oldValues.clinicName,
                        clinicAddress: oldValues.clinicAddress
                    },
                    newValues: {
                        firstName,
                        lastName,
                        birthday,
                        sex,
                        contactNo,
                        clinicName,
                        clinicAddress
                    }
                }
            });
        }

        res.json({
            success: true,
            message: 'Referrer updated successfully',
            data: referrer
        });
    } catch (error) {
        console.error('Error updating referrer:', error);
        res.status(500).json({
            success: false, 
            message: 'Failed to update referrer',
            error: error.message
        });
    }
};

// Update referrer status
exports.updateReferrerStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, currentUserId } = req.body; 

      const referrer = await Referrer.findByPk(id);

      if(!referrer) {
        return res.status(404).json({
            success: false,
            message: 'Referrer not found'
        });
      }

      // Validate status value
      if (status !== 'active' && status !== 'inactive') {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value. Use "active" or "inactive".'
        });
      }

      const oldStatus = referrer.status;
      
      // Update the status 
      await referrer.update({ status });

      // Log activity with status change details
      const statusText = status === 'active' ? 'activated' : 'deactivated';
      await logActivity({
        userId: currentUserId,
        action: status === 'active' ? 'ACTIVATE_REFERRER' : 'DEACTIVATE_REFERRER',
        resourceType: 'REFERRER',
        resourceId: referrer.referrerId,
        details: `Referrer ${statusText}: ${referrer.firstName} ${referrer.lastName}`,
        ipAddress: req.ip,
        metadata: {
          oldStatus,
          newStatus: status
        }
      });

      res.json({
        success: true,
        message: `Referrer ${statusText} successfully`,
        data: referrer  
      });
    } catch (error) {
        console.error('Error updating referrer status:', error);
        res.status(500).json({
            success: false, 
            message: 'Failed to update referrer status',
            error: error.message
        });
    }
};

// Search for referrers
exports.searchReferrer = async (req, res) => {
    try {
        const { search } = req.query;
        
        let whereClause = {};
        
        if (search) {
            // Use sequelize.fn and sequelize.literal for date formatting
            const sequelize = require('../models').sequelize;
            const { Op, fn, col, literal } = require('sequelize');
            
            whereClause[Op.or] = [
                { firstName: { [Op.like]: `%${search}%` } },
                { lastName: { [Op.like]: `%${search}%` } },
                { clinicName: { [Op.like]: `%${search}%` } },
                { clinicAddress: { [Op.like]: `%${search}%` } },
                
                // Birthday search with LIKE operator - use date format similar to toLocaleDateString
                sequelize.where(
                    fn('DATE_FORMAT', col('birthday'), '%c/%e/%Y'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('DATE_FORMAT', col('birthday'), '%m/%d/%Y'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('DATE_FORMAT', col('birthday'), '%Y-%m-%d'),
                    { [Op.like]: `%${search}%` }
                ),
                
                // CreatedAt search with LIKE operator - match frontend display format
                sequelize.where(
                    fn('DATE_FORMAT', col('createdAt'), '%c/%e/%Y'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('DATE_FORMAT', col('createdAt'), '%m/%d/%Y'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('DATE_FORMAT', col('createdAt'), '%Y-%m-%d'),
                    { [Op.like]: `%${search}%` }
                )
            ];
            
            // Add direct day/month search if the search term is a number
            if (!isNaN(search)) {
                const numSearch = parseInt(search);
                if (numSearch > 0) {
                    // Day of month search
                    whereClause[Op.or].push(
                        sequelize.where(
                            fn('DAY', col('birthday')),
                            numSearch
                        ),
                        sequelize.where(
                            fn('MONTH', col('birthday')),
                            numSearch
                        ),
                        sequelize.where(
                            fn('DAY', col('createdAt')),
                            numSearch
                        ),
                        sequelize.where(
                            fn('MONTH', col('createdAt')),
                            numSearch
                        )
                    );
                    
                    // Year search
                    if (numSearch > 1000) {
                        whereClause[Op.or].push(
                            sequelize.where(
                                fn('YEAR', col('birthday')),
                                numSearch
                            ),
                            sequelize.where(
                                fn('YEAR', col('createdAt')),
                                numSearch
                            )
                        );
                    }
                }
            }
        }

        console.log('Searching with criteria:', search);
        
        const referrers = await Referrer.findAll({
            where: whereClause,
            order: [
                ['lastName', 'ASC'],
                ['firstName', 'ASC']
            ]
        });

        console.log(`Found ${referrers.length} referrers matching search term: ${search}`);
        
        res.json({
            success: true,
            data: referrers
        });
    } catch(error) {
        console.error('Error searching referrers:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search referrers',
            error: error.message
        });
    }
}