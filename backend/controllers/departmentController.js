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
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ where: { name } });
    if (existingDepartment) {
      return res.status(400).json({ message: 'Department already exists' });
    }

    const department = await Department.create({
      name,
      testQuantity: 0,
      status: 'active'
    });

    res.status(201).json(department);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update department status
const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const department = await Department.findByPk(id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
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
