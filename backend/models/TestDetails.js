const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  // Define the model with explicit options
  const TestDetails = sequelize.define('TestDetails', {
    testDetailId: {
      type: DataTypes.STRING(5),
      primaryKey: true,
      defaultValue: () => {
        // Generate a random 5-digit number (10000-99999)
        return Math.floor(10000 + Math.random() * 90000).toString();
      }
    },
    transactionId: {
      type: DataTypes.STRING(5),
      allowNull: false,
      references: null // Disable automatic reference creation
    },
    testId: {
      type: DataTypes.UUID,
      allowNull: false
    },
    testName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    departmentId: {
      type: DataTypes.INTEGER,
      allowNull: false
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
    freezeTableName: true,
    // Add indexes for better performance and foreign key relations
    indexes: [
      {
        name: 'idx_transaction',
        fields: ['transactionId']
      },
      {
        name: 'idx_test',
        fields: ['testId']
      },
      {
        name: 'idx_department',
        fields: ['departmentId']
      }
    ]
  });

  return TestDetails;
};
