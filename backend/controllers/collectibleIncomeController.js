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
            createdAt: date ? new Date(date) : new Date() 
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
                    dateAdded: date || new Date().toISOString()
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
            order: [['createdAt', 'DESC']]
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

module.exports = {
    createCollectibleIncome,
    getCollectibleIncome,
}