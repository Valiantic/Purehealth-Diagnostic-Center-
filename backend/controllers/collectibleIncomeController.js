const { CollectibleIncome } = require('../models');
const { logActivity } = require('../utils/activityLogger');

const createCollectibleIncome = async (req, res) => {
    try {
        const { companyName, coordinatorName, totalIncome, date, currentUserId } = req.body;

        if (!companyName || !coordinatorName || totalIncome === undefined) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const collectibleIncome = await CollectibleIncome.create({
            companyName,
            coordinatorName,
            totalIncome: parseFloat(totalIncome).toFixed(2),
            dateConducted: date ? new Date(date) : new Date(),
            createdAt: date ? new Date(date) : new Date(),
            updatedAt: date ? new Date(date) : new Date()
        });

        res.status(201).json({
            success: true,
            message: 'Collectible income added successfully',
            data: collectibleIncome
        });

        try {
            const userId = currentUserId || req.userId;
            
            await logActivity({
                userId: userId,
                action: 'ADD_COLLECTIBLE_INCOME',
                resourceType: 'COLLECTIBLE_INCOME',
                resourceId: collectibleIncome.id || collectibleIncome.companyId,
                details: `Added collectible income for ${companyName} with total income ${parseFloat(totalIncome).toFixed(2)}`,
                ipAddress: req.ip || '0.0.0.0',
                metadata: {
                    companyName,
                    coordinatorName,
                    totalIncome: parseFloat(totalIncome).toFixed(2),
                    dateConducted: date || new Date().toISOString()
                }
            });
        } catch (logError) {
            console.error('Error logging activity:', logError);
        }
    } catch (error) {
        console.error('Error adding collectible income:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
}

const getCollectibleIncome = async (req, res) => {
    try {
        const collectibleIncomes = await CollectibleIncome.findAll({
            order: [['dateConducted', 'DESC']]
        });

        res.status(200).json({
            success: true,
            data: collectibleIncomes
        });
    } catch (error) {
        console.error('Error fetching collectible incomes:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}

const updateCollectibleIncome = async (req, res) => {
    try{
        // Extract parameters and body
        const { id } = req.params;
        const { companyName, coordinatorName, totalIncome, date, currentUserId } = req.body;
        

        // Validate required fields
       if (!companyName || !coordinatorName || totalIncome === undefined) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required' 
            });
        }

        const existingCollectible = await CollectibleIncome.findByPk(id);
        
        if (!existingCollectible) {
            return res.status(404).json({
                success: false,
                message: 'Collectible income record not found'
            });
        }

        // Store original data for logging
        const originalData = {
            companyName: existingCollectible.companyName,
            coordinatorName: existingCollectible.coordinatorName,
            totalIncome: existingCollectible.totalIncome,
            dateConducted: existingCollectible.dateConducted,
            createdAt: existingCollectible.createdAt
        };

        // Prepare the date to use
        let selectedDate;
        if (date) {
            selectedDate = new Date(date);
        }

        // Update the collectible income record
        const updateData = {
            companyName,
            coordinatorName,
            totalIncome: parseFloat(totalIncome).toFixed(2)
        };

        // Update dateConducted, createdAt, and updatedAt if a new date is provided
        if (date) {
            updateData.dateConducted = selectedDate;
            updateData.createdAt = selectedDate;
            updateData.updatedAt = selectedDate;
        }

        const updatedCollectible = await existingCollectible.update(updateData);

        res.status(200).json({
            success: true,
            message: 'Collectible income updated successfully',
            data: updatedCollectible
        });

        try {
            const userId = currentUserId || req.userId;

            const changes = [];
            if (originalData.companyName !== companyName) {
                changes.push(`Company: "${originalData.companyName}" → "${companyName}"`);
            } 
            if (originalData.coordinatorName !== coordinatorName) {
                changes.push(`Coordinator: "${originalData.coordinatorName}" → "${coordinatorName}"`);
            }
            if (parseFloat(originalData.totalIncome) !== parseFloat(totalIncome)) {
                changes.push(`Amount: "${originalData.totalIncome}" → "${parseFloat(totalIncome).toFixed(2)}"`);
            }
            if (date && new Date(originalData.dateConducted).toDateString() !== new Date(date).toDateString()) {
                changes.push(`Date: "${new Date(originalData.dateConducted).toDateString()}" → "${new Date(date).toDateString()}"`);
            }

            const changeDetails = changes.length > 0 
                ? `Updated collectible income details for ${companyName}: ${changes.join(', ')} with total income ${parseFloat(totalIncome).toFixed(2)}`
                : `Updated collectible income details for ${companyName}`;

            await logActivity({
                userId: userId,
                action: 'UPDATE_COLLECTIBLE_INCOME',
                resourceType: 'COLLECTIBLE_INCOME',
                resourceId: id,
                details: changeDetails,
                ipAddress: req.ip || '0.0.0.0',
                metadata: {
                    originalData,
                    newData: {
                        companyName,
                        coordinatorName,
                        totalIncome: parseFloat(totalIncome).toFixed(2),
                        dateConducted: date ? new Date(date) : originalData.dateConducted,
                        createdAt: date ? new Date(date) : originalData.createdAt
                    },
                    changes: changes
                }
            });
        }   catch (logError) {
            console.error('Error logging update activity:', logError);
        }

    }catch(error) {
        console.error('Error updating collectible income:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error', 
            error: error.message 
        });
    }
};

module.exports = {
    createCollectibleIncome,
    getCollectibleIncome,
    updateCollectibleIncome
}