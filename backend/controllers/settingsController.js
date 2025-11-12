const { Settings, DiscountCategory } = require('../models');
const { logActivity } = require('../utils/activityLogger');

// Settings Controllers
async function getAllSettings(req, res) {
  try {
    const settings = await Settings.findAll({
      order: [['settingKey', 'ASC']]
    });

    res.json({
      success: true,
      settings: settings
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching settings',
      error: error.message
    });
  }
}

async function getSettingByKey(req, res) {
  try {
    const { key } = req.params;

    const setting = await Settings.findOne({
      where: { settingKey: key }
    });

    if (!setting) {
      return res.status(404).json({
        success: false,
        message: 'Setting not found'
      });
    }

    res.json({
      success: true,
      setting: setting
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching setting',
      error: error.message
    });
  }
}

async function updateSetting(req, res) {
  try {
    const { key } = req.params;
    const { settingValue, currentUserId } = req.body;

    const setting = await Settings.findOne({
      where: { settingKey: key }
    });

    if (!setting) {
      // Create new setting if it doesn't exist
      const newSetting = await Settings.create({
        settingKey: key,
        settingValue: settingValue,
        settingType: 'number',
        updatedBy: currentUserId
      });

      await logActivity({
        userId: currentUserId,
        action: 'CREATE_SETTING',
        resourceType: 'SETTING',
        resourceId: newSetting.settingId,
        details: `Created setting: ${key} with value ${settingValue}`,
        ipAddress: req.ip
      });

      return res.json({
        success: true,
        message: 'Setting created successfully',
        setting: newSetting
      });
    }

    const oldValue = setting.settingValue;
    await setting.update({
      settingValue: settingValue,
      updatedBy: currentUserId
    });

    await logActivity({
      userId: currentUserId,
      action: 'UPDATE_SETTING',
      resourceType: 'SETTING',
      resourceId: setting.settingId,
      details: `Updated setting: ${key} from ${oldValue} to ${settingValue}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Setting updated successfully',
      setting: setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating setting',
      error: error.message
    });
  }
}

// Discount Category Controllers
async function getAllDiscountCategories(req, res) {
  try {
    const categories = await DiscountCategory.findAll({
      order: [['categoryName', 'ASC']]
    });

    res.json({
      success: true,
      categories: categories
    });
  } catch (error) {
    console.error('Error fetching discount categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching discount categories',
      error: error.message
    });
  }
}

async function createDiscountCategory(req, res) {
  try {
    const { categoryName, percentage, description, currentUserId } = req.body;

    if (!categoryName || percentage === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Category name and percentage are required'
      });
    }

    // Check if category already exists
    const existing = await DiscountCategory.findOne({
      where: { categoryName }
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Discount category with this name already exists'
      });
    }

    const category = await DiscountCategory.create({
      categoryName,
      percentage,
      description,
      createdBy: currentUserId,
      updatedBy: currentUserId
    });

    await logActivity({
      userId: currentUserId,
      action: 'CREATE_DISCOUNT_CATEGORY',
      resourceType: 'DISCOUNT_CATEGORY',
      resourceId: category.discountCategoryId,
      details: `Created discount category: ${categoryName} with ${percentage}% discount`,
      ipAddress: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Discount category created successfully',
      category: category
    });
  } catch (error) {
    console.error('Error creating discount category:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating discount category',
      error: error.message
    });
  }
}

async function updateDiscountCategory(req, res) {
  try {
    const { id } = req.params;
    const { categoryName, percentage, description, status, currentUserId } = req.body;

    const category = await DiscountCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Discount category not found'
      });
    }

    const oldValues = {
      categoryName: category.categoryName,
      percentage: category.percentage,
      status: category.status
    };

    await category.update({
      categoryName: categoryName || category.categoryName,
      percentage: percentage !== undefined ? percentage : category.percentage,
      description: description !== undefined ? description : category.description,
      status: status || category.status,
      updatedBy: currentUserId
    });

    await logActivity({
      userId: currentUserId,
      action: 'UPDATE_DISCOUNT_CATEGORY',
      resourceType: 'DISCOUNT_CATEGORY',
      resourceId: category.discountCategoryId,
      details: `Updated discount category: ${category.categoryName}`,
      ipAddress: req.ip,
      metadata: { oldValues, newValues: { categoryName, percentage, status } }
    });

    res.json({
      success: true,
      message: 'Discount category updated successfully',
      category: category
    });
  } catch (error) {
    console.error('Error updating discount category:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating discount category',
      error: error.message
    });
  }
}

async function deleteDiscountCategory(req, res) {
  try {
    const { id } = req.params;
    const { currentUserId } = req.body;

    const category = await DiscountCategory.findByPk(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Discount category not found'
      });
    }

    const categoryName = category.categoryName;
    await category.destroy();

    await logActivity({
      userId: currentUserId,
      action: 'DELETE_DISCOUNT_CATEGORY',
      resourceType: 'DISCOUNT_CATEGORY',
      resourceId: id,
      details: `Deleted discount category: ${categoryName}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: 'Discount category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting discount category:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting discount category',
      error: error.message
    });
  }
}

module.exports = {
  getAllSettings,
  getSettingByKey,
  updateSetting,
  getAllDiscountCategories,
  createDiscountCategory,
  updateDiscountCategory,
  deleteDiscountCategory
};
