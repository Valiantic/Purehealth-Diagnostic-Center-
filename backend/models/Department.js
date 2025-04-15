const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Department = sequelize.define('Department', {
    departmentId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    departmentName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    testQuantity: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    modelName: 'Department',
    tableName: 'Departments',
    timestamps: true,
    underscored: false,
    id: 'departmentId'
  });

  Department.addHook('beforeCreate', (instance, options) => {
    console.log('Before creating department:', JSON.stringify(instance, null, 2));
  });

  Department.addHook('afterCreate', (instance, options) => {
    console.log('Created department:', JSON.stringify(instance, null, 2));
  });

  return Department;
};
