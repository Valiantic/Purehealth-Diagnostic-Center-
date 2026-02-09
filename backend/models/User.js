const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  middleName: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.STRING(50),
    allowNull: true, // Made nullable for migration - will be removed after full migration
    defaultValue: 'receptionist'
  },
  roleId: {
    type: DataTypes.INTEGER,
    allowNull: true, // Will be made NOT NULL after migration
    references: {
      model: 'Roles',
      key: 'roleId'
    }
  },
  status: {
    type: DataTypes.ENUM('active', 'archived'),
    allowNull: false,
    defaultValue: 'active'
  },
  currentChallenge: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  indexes: [
    {
      name: 'unique_user_email',
      unique: true,
      fields: ['email']
    }
  ]
});

module.exports = User;