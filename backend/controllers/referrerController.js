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
            statusOnly = false // Add a flag to indicate status-only update
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
        
        // Only check for details changes if this is not a status-only update
        const detailsChanged = !statusOnly && (
            oldValues.firstName !== firstName ||
            oldValues.lastName !== lastName ||
            oldValues.birthday !== birthday ||
            oldValues.sex !== sex ||
            oldValues.contactNo !== contactNo ||
            oldValues.clinicName !== clinicName ||
            oldValues.clinicAddress !== clinicAddress
        );

        // Update the referrer with all fields or just status if statusOnly is true
        if (statusOnly) {
            await referrer.update({ status });
        } else {
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
        }

        // Log status change if status changed
        if (statusChanged) {
            const statusText = status === 'active' ? 'Unarchived' : 'Archived';
            const explicitActionType = status === 'active' ? 'ACTIVATE_REFERRER' : 'DEACTIVATE_REFERRER';
            
            await logActivity({
                userId: currentUserId,
                action: explicitActionType,
                resourceType: 'REFERRER',
                resourceId: referrer.referrerId,
                details: `${statusText} referrer: ${firstName} ${lastName}`,
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
      const statusText = status === 'active' ? 'Unarchived' : 'Archived';
      await logActivity({
        userId: currentUserId,
        action: status === 'active' ? 'ACTIVATE_REFERRER' : 'DEACTIVATE_REFERRER',
        resourceType: 'REFERRER',
        resourceId: referrer.referrerId,
        details: `${statusText} referrer: ${referrer.firstName} ${referrer.lastName}`,
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
                    fn('TO_CHAR', col('birthday'), 'FMMM/FMDD/YYYY'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('TO_CHAR', col('birthday'), 'MM/DD/YYYY'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('TO_CHAR', col('birthday'), 'YYYY-MM-DD'),
                    { [Op.like]: `%${search}%` }
                ),
                
                // CreatedAt search with LIKE operator - match frontend display format
                sequelize.where(
                    fn('TO_CHAR', col('createdAt'), 'FMMM/FMDD/YYYY'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('TO_CHAR', col('createdAt'), 'MM/DD/YYYY'),
                    { [Op.like]: `%${search}%` }
                ),
                sequelize.where(
                    fn('TO_CHAR', col('createdAt'), 'YYYY-MM-DD'),
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
                            fn('EXTRACT', literal(`DAY FROM "birthday"`)),
                            numSearch
                        ),
                        sequelize.where(
                            fn('EXTRACT', literal(`MONTH FROM "birthday"`)),
                            numSearch
                        ),
                        sequelize.where(
                            fn('EXTRACT', literal(`DAY FROM "createdAt"`)),
                            numSearch
                        ),
                        sequelize.where(
                            fn('EXTRACT', literal(`MONTH FROM "createdAt"`)),
                            numSearch
                        )
                    );

                    // Year search
                    if (numSearch > 1000) {
                        whereClause[Op.or].push(
                            sequelize.where(
                                fn('EXTRACT', literal(`YEAR FROM "birthday"`)),
                                numSearch
                            ),
                            sequelize.where(
                                fn('EXTRACT', literal(`YEAR FROM "createdAt"`)),
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