const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const TestDetails = sequelize.define('TestDetails', {
    testDetailId: {
      type: DataTypes.STRING(5),
      primaryKey: true,
      // Generate a 5-digit number as string (10000-99999)
      defaultValue: () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
      }
    },
    transactionId: {
      type: DataTypes.STRING(5),
      allowNull: false
      // Let relationships be handled in index.js
    },
    testId: {
      type: DataTypes.UUID,
      allowNull: false
      // Let relationships be handled in index.js
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.UUID,
      allowNull: false
      // Let relationships be handled in index.js
    },
    originalPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    discountPercentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    discountedPrice: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    cashAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    gCashAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    balanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    }
  }, {
    timestamps: true,
    tableName: 'TestDetails',
    freezeTableName: true
  });

  return TestDetails;
};
