const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DepartmentRevenue = sequelize.define('DepartmentRevenue', {
    revenueId: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    transactionId: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    testDetailId: {
      type: DataTypes.STRING(5),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    revenueDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    timestamps: true,
    tableName: 'DepartmentRevenues',
    freezeTableName: true
  });

  return DepartmentRevenue;
};
