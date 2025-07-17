const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    transactionId: {
      type: DataTypes.STRING(5),
      primaryKey: true,
      defaultValue: () => {
        // Generate a random 5-digit number (10000-99999)
        return Math.floor(10000 + Math.random() * 90000).toString();
      }
    },
    mcNo: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: () => {
        const num = Math.floor(10000 + Math.random() * 90000);
        return num.toString();
      }
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    idType: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Regular'
    },
    idNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      defaultValue: 'XXXX-XXXX'
    },
    referrerId: {
      type: DataTypes.UUID,
      allowNull: true,
      references: null // Disable automatic reference creation
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    sex: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Male'
    },
    transactionDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalDiscountAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalCashAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalGCashAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    totalBalanceAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.00
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active'
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: null // Disable automatic reference creation
    }
  }, {
    timestamps: true,
    tableName: 'Transactions', 
    freezeTableName: true,
    indexes: [
      {
        name: 'idx_referrer',
        fields: ['referrerId']
      },
      {
        name: 'idx_user',
        fields: ['userId']
      }
    ]
  });

  return Transaction;
};
