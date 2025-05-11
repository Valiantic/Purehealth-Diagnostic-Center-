const { TestDetails, ActivityLog, DepartmentRevenue, sequelize } = require('../models');

// Update test detail
exports.updateTestDetail = async (req, res) => {
  const t = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { 
      discountPercentage, 
      discountedPrice, 
      cashAmount, 
      gCashAmount, 
      balanceAmount,
      userId
    } = req.body;
    
    const testDetail = await TestDetails.findByPk(id);
    
    if (!testDetail) {
      return res.status(404).json({
        success: false,
        message: 'Test detail not found'
      });
    }

    // Update test detail with provided values
    const updateData = {};
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (discountedPrice !== undefined) updateData.discountedPrice = discountedPrice;
    if (cashAmount !== undefined) updateData.cashAmount = cashAmount;
    if (gCashAmount !== undefined) updateData.gCashAmount = gCashAmount;
    if (balanceAmount !== undefined) updateData.balanceAmount = balanceAmount;

    await testDetail.update(updateData, { transaction: t });
    
    // Update department revenue to reflect discounted price
    if (discountedPrice !== undefined) {
      // Find and update the associated department revenue record
      const departmentRevenue = await DepartmentRevenue.findOne({
        where: {
          testDetailId: id,
          transactionId: testDetail.transactionId
        }
      });
      
      if (departmentRevenue) {
        // Calculate discount information
        const originalPrice = parseFloat(testDetail.originalPrice) || 0;
        const newDiscountedPrice = parseFloat(discountedPrice) || 0;
        const discountAmount = originalPrice - newDiscountedPrice;
        
        await departmentRevenue.update({
          amount: newDiscountedPrice,
          metadata: JSON.stringify({
            originalAmount: originalPrice,
            discountAmount: discountAmount,
            discountPercentage: discountPercentage || 0
          })
        }, { transaction: t });
      }
    }

    // Log activity
    await ActivityLog.create({
      action: 'UPDATE',
      details: `Updated test details for test ${testDetail.testName}`,
      resourceType: 'TEST_DETAIL',
      entityId: id,
      userId
    }, { transaction: t });

    await t.commit();

    res.json({
      success: true,
      message: 'Test detail updated successfully',
      data: testDetail
    });
  } catch (error) {
    await t.rollback();
    console.error('Error updating test detail:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update test detail',
      error: error.message
    });
  }
};
