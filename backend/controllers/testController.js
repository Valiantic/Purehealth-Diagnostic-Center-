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
    
    if (!testName || !departmentId || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const department = await Department.findByPk(departmentId);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    
    const existingTest = await Test.findOne({ 
      where: { 
        testName: testName,
        departmentId: departmentId 
      } 
    });
    
    if (existingTest) {
      return res.status(400).json({ message: 'A test with this name already exists in this department' });
    }
    
    const newTest = await Test.create({
      testName,
      departmentId,
      price,
      dateCreated: dateCreated || new Date(), 
      status: 'active'
    });
    
    await department.increment('testQuantity', { by: 1 });
    
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

// Update a test 
exports.updateTest = async (req, res) => {
  try {
    const { id } = req.params;
    const { testName, departmentId, price, status, dateCreated, currentUserId } = req.body;
    
    if (!testName || !departmentId || !price) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    const test = await Test.findByPk(id, {
      include: [{ model: Department }]
    });
    
    if (!test) {
      return res.status(404).json({ message: 'Test not found' });
    }
    
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
    
    // Get new department info if department is changing
    let newDepartment = null;
    let newStatus = status;
    let statusChangedByDepartment = false;
    let oldDepartmentName = test.Department?.departmentName || 'Unknown Department';
    let newDepartmentName = '';

    const changingDepartment = test.departmentId !== departmentId;

    if (changingDepartment) {
      newDepartment = await Department.findByPk(departmentId);

      if (!newDepartment) {
        return res.status(404).json({ message: 'New department not found' });
      }

      newDepartmentName = newDepartment.departmentName;

      // Override status to match department status
      if (newDepartment.status !== test.status) {
        newStatus = newDepartment.status;
        statusChangedByDepartment = true;
      }
    }

    const changingNameOrPrice = 
      test.testName !== testName || 
      parseFloat(test.price) !== parseFloat(price);

      const changingDate = dateCreated && 
      new Date(test.dateCreated).toISOString() !== new Date(dateCreated).toISOString();
    
    const changingStatus = (status && test.status !== status) || statusChangedByDepartment;

      if (changingDepartment) {
      if (test.status === 'active') {
        const oldDepartment = await Department.findByPk(test.departmentId);
        if (oldDepartment) {
          await oldDepartment.decrement('testQuantity', { by: 1 });
        }
      }
      
      if (newStatus === 'active') {
        const newDepartment = await Department.findByPk(departmentId);
        if (newDepartment) {
          await newDepartment.increment('testQuantity', { by: 1 });
        }
      }
    } 

    else if (changingStatus) {
      const department = await Department.findByPk(test.departmentId);
      if (department) {
        if (newStatus === 'active') {
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
      status: newStatus || test.status
    });
    
    const updatedTest = await Test.findByPk(id, {
      include: [{ model: Department }]
    });
    
     if (changingDepartment) {
      await logActivity({
        userId: currentUserId,
        action: 'TRANSFER_TEST',
        resourceType: 'TEST',
        resourceId: test.testId,
        details: `Test "${testName}" has been moved to ${newDepartmentName} Department`,
        ipAddress: req.ip || 'unknown',
        metadata: {
          oldDepartment: {
            id: test.departmentId,
            name: oldDepartmentName
          },
          newDepartment: {
            id: departmentId,
            name: newDepartmentName
          }
        }
      });
    }

      if ((changingNameOrPrice || changingDate) && !changingDepartment) {
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
            price: oldValues.price,
            dateCreated: oldValues.dateCreated ? new Date(oldValues.dateCreated).toISOString() : null
          },
          newValues: {
            testName,
            price,
            dateCreated: dateCreated ? new Date(dateCreated).toISOString() : new Date(oldValues.dateCreated).toISOString()
          }
        }
      });
    }
    
    if (changingStatus) {
      await logActivity({
        userId: currentUserId,
        action: newStatus === 'active' ? 'ACTIVATE_TEST' : 'DEACTIVATE_TEST',
        resourceType: 'TEST',
        resourceId: test.testId,
        details: `${statusChangedByDepartment ? 'Automatically ' : ''}${newStatus === 'active' ? 'Unarchived' : 'Archived'} test: ${testName}${statusChangedByDepartment ? ' due to department status' : ''}`,
        ipAddress: req.ip || 'unknown',
        metadata: {
          oldStatus: oldValues.status,
          newStatus: newStatus,
          automaticChange: statusChangedByDepartment
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