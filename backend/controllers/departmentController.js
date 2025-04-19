const { Department } = require('../models');
const { logActivity } = require('../utils/activityLogger');
const sequelize = require('../models').sequelize;
const { Op } = require('sequelize'); 

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    // Use Sequelize include to get fresh test counts directly from the database
    const departments = await Department.findAll({
      include: [
        {
          model: sequelize.models.Test,
          attributes: [],
          where: { status: 'active' },
          required: false
        }
      ],
      attributes: [
        'departmentId', 
        'departmentName', 
        'status', 
        'createdAt', 
        'updatedAt',
        [sequelize.fn('COUNT', sequelize.col('Tests.testId')), 'testQuantity']
      ],
      group: ['Department.departmentId'],
      order: [['createdAt', 'DESC']]
    });

    // Format the response to match the expected structure
    const formattedDepartments = departments.map(dept => {
      const plainDept = dept.get({ plain: true });
      return {
        ...plainDept,
        testQuantity: parseInt(plainDept.testQuantity || 0)
      };
    });

    res.json(formattedDepartments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const { departmentName, currentUserId } = req.body;
    
    if (!departmentName) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ where: { departmentName } });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    // Create department explicitly WITHOUT specifying departmentId
    const department = await Department.create({
      departmentName,
      testQuantity: 0,
      status: 'active'
    }, {
      returning: true,
      fields: ['departmentName', 'testQuantity', 'status'] // Explicitly exclude departmentId
    });
    
    // Fetch the complete record to ensure we have the auto-generated ID
    const createdDepartment = await Department.findOne({
      where: { departmentName }
    });
    
    console.log('Department created:', createdDepartment.toJSON());
    res.status(201).json(createdDepartment);

    // Log department creation
    await logActivity({
      userId: currentUserId,
      action: 'ADD_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: createdDepartment.departmentId,
      details: `New department created: ${departmentName}`,
      ipAddress: req.ip
    });
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update department status
const updateDepartmentStatus = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { status, currentUserId } = req.body;
    
    const department = await Department.findOne({ 
      where: { departmentId: departmentId }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const oldStatus = department.status;
    department.status = status;
    await department.save();
    
    res.json(department);

    await logActivity({
      userId: currentUserId,
      action: status === 'active' ? 'ACTIVATE_DEPARTMENT' : 'DEACTIVATE_DEPARTMENT',
      resourceType: 'DEPARTMENT',
      resourceId: department.departmentId, 
      details: `Department ${status === 'active' ? 'activated' : 'deactivated'}: ${department.departmentName}`,
      ipAddress: req.ip,
      metadata: {
        oldStatus: oldStatus,
        newStatus: status
      }
    });
  } catch (error) {
    console.error('Error updating department status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { departmentName, dateCreated, status, currentUserId } = req.body;
    
    const department = await Department.findOne({ 
      where: { departmentId: departmentId }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    if (departmentName !== department.departmentName) {
      const existingDepartment = await Department.findOne({ 
        where: { 
          departmentName,
          departmentId: { [Op.ne]: departmentId }
        } 
      });
      
      if (existingDepartment) {
        return res.status(400).json({ message: 'Department name already exists' });
      }
    }
    
    const oldValues = {
      departmentName: department.departmentName,
      dateCreated: department.createdAt,
      status: department.status
    };
    
    const changingDetails = 
      department.departmentName !== departmentName || 
      (dateCreated && new Date(department.createdAt).toISOString() !== new Date(dateCreated).toISOString());
      
    const changingStatus = status && department.status !== status;
    
    await department.update({
      departmentName,
      createdAt: dateCreated || department.createdAt,
      status: status || department.status
    });
    
    res.json(department);

    // SEPARATE LOGGING FOR DETAILS AND STATUS CHANGES
    if (changingDetails) {
      await logActivity({
        userId: currentUserId,
        action: 'UPDATE_DEPARTMENT_DETAILS',
        resourceType: 'DEPARTMENT',
        resourceId: department.departmentId,
        details: `Updated department details: ${departmentName}`,
        ipAddress: req.ip,
        metadata: {
          oldValues: {
            departmentName: oldValues.departmentName,
            dateCreated: oldValues.dateCreated ? new Date(oldValues.dateCreated).toISOString() : null
          },
          newValues: {
            departmentName,
            dateCreated: dateCreated ? new Date(dateCreated).toISOString() : new Date(oldValues.dateCreated).toISOString()
          }
        }
      });
    }
    
    if (changingStatus) {
      await logActivity({
        userId: currentUserId,
        action: status === 'active' ? 'ACTIVATE_DEPARTMENT' : 'DEACTIVATE_DEPARTMENT',
        resourceType: 'DEPARTMENT',
        resourceId: department.departmentId,
        details: `Department ${status === 'active' ? 'activated' : 'deactivated'}: ${departmentName}`,
        ipAddress: req.ip,
        metadata: {
          oldStatus: oldValues.status,
          newStatus: status
        }
      });
    }
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartmentStatus,
  updateDepartment
};
