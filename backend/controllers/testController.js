const { Test, Department} = require('../models');
const { logActivity } = require('../utils/activityLogger');
const { Op } = require('sequelize');

// Get all tests
exports.getAllTests = async (req, res) => {
  try {
    const tests = await Test.findAll({
      include: [
        {
          model: Department,
          attributes: ['departmentName']
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json(tests);
  } catch (error) {
    console.error('Error fetching tests:', error);
    res.status(500).json({ message: 'Error fetching tests', error: error.message });
  }
};

// Create a new test
exports.createTest = async (req, res) => {
  try {
    const { testName, departmentId, price, dateCreated, currentUserId } = req.body;
    
    // Validation
    if (!testName || !departmentId || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Check if department exists
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    // Check if test name already exists in this department
    const existingTest = await Test.findOne({ 
      where: { 
        testName: testName,
        departmentId: departmentId 
      } 
    });
    
    if (existingTest) {
      return res.status(400).json({ message: 'A test with this name already exists in this department' });
    }
    
    // Create test
    const newTest = await Test.create({
      testName,
      departmentId,
      price,
      dateCreated: dateCreated || new Date(), // Use provided date or default to now
      status: 'active'
    });
    
    // Update department test count
    await department.increment('testQuantity', { by: 1 });
    
    // Log activity exactly like departmentController
    await logActivity({
      userId: currentUserId,
      action: 'ADD_TEST',
      resourceType: 'TEST',
      resourceId: newTest.testId,
      details: `New test created: ${testName} for department ${department.departmentName}`,
      ipAddress: req.ip || 'unknown'
    });
    
    res.status(201).json({ message: 'Test created successfully', test: newTest });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(500).json({ message: 'Error creating test', error: error.message });
  }
};

// Update a test (including status changes)
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { testName, departmentId, price, status, dateCreated, currentUserId } = req.body;
    
    // Validation
    if (!testName || !departmentId || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const test = await Test.findByPk(id, {
      include: [{ model: Department }]
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
    // Check if we're changing the name or department
    if (testName !== test.testName || departmentId !== test.departmentId) {
      const existingTest = await Test.findOne({ 
        where: { 
          testName: testName,
          departmentId: departmentId,
          testId: { [Op.ne]: id } 
        } 
      });
      
      if (existingTest) {
        return res.status(400).json({ message: 'A test with this name already exists in this department' });
      }
    }
    
    const oldValues = {
      testName: test.testName,
      departmentId: test.departmentId,
      price: test.price,
      status: test.status,
      dateCreated: test.dateCreated
    };
    
    const changingDetails = 
      test.testName !== testName || 
      test.departmentId !== departmentId || 
      parseFloat(test.price) !== parseFloat(price) ||
      (dateCreated && new Date(test.dateCreated).toISOString() !== new Date(dateCreated).toISOString());
      
    const changingStatus = status && test.status !== status;
    
    if (test.departmentId !== departmentId) {
      if (test.status === 'active') {
        const oldDepartment = await Department.findByPk(test.departmentId);
        if (oldDepartment) {
          await oldDepartment.decrement('testQuantity', { by: 1 });
        }
      }
      
      if (status === 'active' || (!status && test.status === 'active')) {
        const newDepartment = await Department.findByPk(departmentId);
        if (newDepartment) {
          await newDepartment.increment('testQuantity', { by: 1 });
        }
      }
    } 

    else if (changingStatus) {
      const department = await Department.findByPk(test.departmentId);
      if (department) {
        if (status === 'active') {
          await department.increment('testQuantity', { by: 1 });
        } else {
          await department.decrement('testQuantity', { by: 1 });
        }
      }
    }
    
    await test.update({
      testName,
      departmentId,
      price,
      dateCreated: dateCreated || test.dateCreated,
      status: status || test.status
    });
    
    const updatedTest = await Test.findByPk(id, {
      include: [{ model: Department }]
    });
    
    // SEPARATE LOGGING FOR DETAILS AND STATUS CHANGES
    if (changingDetails) {
      await logActivity({
        userId: currentUserId,
        action: 'UPDATE_TEST_DETAILS',
        resourceType: 'TEST',
        resourceId: test.testId,
        details: `Updated test details for: ${testName}`,
        ipAddress: req.ip || 'unknown',
        metadata: {
          oldValues: {
            testName: oldValues.testName,
            departmentId: oldValues.departmentId,
            departmentName: test.Department?.departmentName,
            price: oldValues.price,
            dateCreated: oldValues.dateCreated ? new Date(oldValues.dateCreated).toISOString() : null
          },
          newValues: {
            testName,
            departmentId,
            departmentName: updatedTest.Department?.departmentName,
            price,
            dateCreated: dateCreated ? new Date(dateCreated).toISOString() : new Date(oldValues.dateCreated).toISOString()
          }
        }
      });
    }
    
    if (changingStatus) {
      await logActivity({
        userId: currentUserId,
        action: status === 'active' ? 'ACTIVATE_TEST' : 'DEACTIVATE_TEST',
        resourceType: 'TEST',
        resourceId: test.testId,
        details: `Test ${status === 'active' ? 'activated' : 'deactivated'}: ${testName}`,
        ipAddress: req.ip || 'unknown',
        metadata: {
          oldStatus: oldValues.status,
          newStatus: status
        }
      });
    }
    
    res.json({ 
      message: 'Test updated successfully', 
      test: updatedTest 
    });
  } catch (error) {
    console.error('Error updating test:', error);
    res.status(500).json({ message: 'Error updating test', error: error.message });
  }
};

module.exports = {
  getAllTests: exports.getAllTests,
  createTest: exports.createTest,
  updateTest: exports.updateTest
};
