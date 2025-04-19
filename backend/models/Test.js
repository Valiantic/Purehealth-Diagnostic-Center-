module.exports = (sequelize) => {
  const { DataTypes } = require('sequelize');
  
  const Test = sequelize.define('Test', {
    testId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Departments',
        key: 'departmentId'
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active'
    },
    dateCreated: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'tests',
    timestamps: true
  });
  
  return Test;
};
