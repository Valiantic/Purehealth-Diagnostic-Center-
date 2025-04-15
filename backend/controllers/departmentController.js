const { Department } = require('../models');

// Get all departments
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.findAll();
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Create a new department
const createDepartment = async (req, res) => {
  try {
    const { departmentName } = req.body;
    
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
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update department status
const updateDepartmentStatus = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const { status } = req.body;
    
    console.log("Finding department with ID:", departmentId);
    
    // Use the correct parameter name
    const department = await Department.findOne({ 
      where: { departmentId: departmentId }
    });
    
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    console.log("Found department:", department.toJSON());
    
    department.status = status;
    await department.save();
    
    res.json(department);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllDepartments,
  createDepartment,
  updateDepartmentStatus
};
