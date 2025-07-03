const { User, Authenticator } = require('../models');
const { logActivity } = require('../utils/activityLogger');

// Register user details
exports.registerUserDetails = async (req, res) => {
  try {
    const { email, firstName, middleName, lastName } = req.body;

    if (!email || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, and last name are required'
      });
    }

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const user = await User.create({
      email,
      firstName,
      middleName: middleName || null,
      lastName
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName
      }
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
}

// Find user by email
exports.findUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Username'
      });
    }

    const authenticators = await Authenticator.findAll({
      where: { userId: user.userId }
    });

    if (authenticators.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No authenticators found for this user'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error finding user:', error);
    res.status(500).json({
      success: false,
      message: 'Error finding user',
      error: error.message
    });
  }
}

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['userId', 'firstName', 'middleName', 'lastName', 'email', 'role', 'status', 'createdAt'],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      users: users.map(user => ({
        userId: user.userId,
        name: `${user.firstName} ${user.middleName ? user.middleName + ' ' : ''}${user.lastName}`,
        username: user.email.split('@')[0], 
        email: user.email,
        role: user.role,
        status: user.status, 
        createdAt: user.createdAt
      }))
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
}

exports.updateUserStatus = async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, currentUserId } = req.body;

    if (!userId || !status) {
      return res.status(400).json({
        success: false,
        message: 'User ID and status are required'
      });
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either active or inactive'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ status });

    await logActivity({
      userId: currentUserId || userId, 
      action: status === 'active' ? 'ACTIVATE_ACCOUNT' : 'DEACTIVATE_ACCOUNT',
      resourceType: 'USER',
      resourceId: user.userId,
      details: `User account ${status === 'active' ? 'activated' : 'deactivated'} for ${user.email}`,
      ipAddress: req.ip
    });

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: {
        userId: user.userId,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user status',
      error: error.message
    });
  }
}

// update user details
exports.updateUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    const { 
      firstName, 
      middleName, 
      lastName, 
      email, 
      status, 
      statusChanged, 
      detailsChanged,
      currentUserId  
    } = req.body;
    
    console.log('Update request received with raw data:', JSON.stringify(req.body));
    
    const boolStatusChanged = statusChanged === true || statusChanged === 'true';
    const boolDetailsChanged = detailsChanged === true || detailsChanged === 'true';
    
    console.log('Parsed change flags:', {
      statusChanged: boolStatusChanged,
      detailsChanged: boolDetailsChanged
    });
    
    const user = await User.findByPk(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    const oldValues = {
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      email: user.email,
      status: user.status
    };
    
    let editorEmail = user.email; 
    let editorId = currentUserId || userId; 
    
    if (currentUserId) {
      try {
        const editor = await User.findByPk(currentUserId);
        if (editor) {
          editorEmail = editor.email;
          editorId = editor.userId;
          console.log(`Editor identified: ${editorEmail} (ID: ${editorId})`);
        } else {
          console.warn(`Editor with ID ${currentUserId} not found`);
        }
      } catch (error) {
        console.error('Error fetching editor details:', error);
      }
    } else {
      console.warn('No currentUserId provided for logging, using user being edited');
    }
    
    const updatedStatus = status !== undefined ? status : user.status;
    
    await user.update({
      firstName,
      middleName,
      lastName,
      email,
      status: updatedStatus 
    });
    
    await user.reload();
    
    const shouldLogDetailsChange = boolDetailsChanged || false;
    const shouldLogStatusChange = boolStatusChanged || false;
    
    console.log('Will log changes:', {
      detailsChange: shouldLogDetailsChange,
      statusChange: shouldLogStatusChange
    });
    
    if (shouldLogDetailsChange || 
        oldValues.firstName !== firstName || 
        oldValues.middleName !== middleName || 
        oldValues.lastName !== lastName || 
        oldValues.email !== email) {
      
      console.log('Detected field changes, logging details update');
      
      try {
        let detailsMessage;
        
        if (oldValues.email !== email) {
          detailsMessage = `User email updated for ${oldValues.email} (old email) to ${email} (new email) by ${editorEmail}`;
        } else {
          detailsMessage = `User details updated: ${email}`;
        }

        const activityLog = await logActivity({
          userId: editorId,
          action: 'UPDATE_USER_DETAILS',
          resourceType: 'USER',
          resourceId: userId,
          details: detailsMessage,
          ipAddress: req.ip || '127.0.0.1',
          metadata: {
            editor: {
              userId: editorId,
              email: editorEmail
            },
            oldValues: {
              firstName: oldValues.firstName,
              middleName: oldValues.middleName,
              lastName: oldValues.lastName,
              email: oldValues.email
            },
            newValues: {
              firstName,
              middleName,
              lastName,
              email
            }
          }
        });
        console.log('Activity log result:', activityLog ? 'Success' : 'Failed');
      } catch (logError) {
        console.error('Failed to log user details change:', logError);
      }
    }
        const hasStatusChanged = oldValues.status !== updatedStatus && updatedStatus !== undefined;
    
    if (hasStatusChanged) {
      console.log('Detected status change, logging status update');
      
      try {
        const statusMessage = `User account ${updatedStatus === 'active' ? 'activated' : 'deactivated'} for ${email} (${oldValues.status} → ${updatedStatus}) by ${editorEmail}`;
        
        const activityLog = await logActivity({
          userId: editorId,
          action: updatedStatus === 'active' ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
          resourceType: 'USER',
          resourceId: userId,
          details: statusMessage,
          ipAddress: req.ip || '127.0.0.1',
          metadata: {
            editor: {
              userId: editorId,
              email: editorEmail
            },
            oldStatus: oldValues.status,
            newStatus: updatedStatus
          }
        });
        console.log('Activity log result:', activityLog ? 'Success' : 'Failed');
      } catch (logError) {
        console.error('Failed to log user status change:', logError);
      }
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        userId: user.userId,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        email: user.email,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error updating user details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error',
      error: error.message 
    });
  }
}

// Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user: {
        userId: user.userId,
        email: user.email,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Error getting user details:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting user details',
      error: error.message
    });
  }
}
