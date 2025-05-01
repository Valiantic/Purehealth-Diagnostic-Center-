const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    transactionId: {
      type: DataTypes.STRING(5),
      primaryKey: true,
      // Generate a 5-digit number as string (10000-99999)
      defaultValue: () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
      }
    },
    mcNo: {
      type: DataTypes.STRING(5),
      allowNull: true,
      // Generate a 5-digit number (10000-99999)
      defaultValue: () => {
        return Math.floor(10000 + Math.random() * 90000).toString();
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
    referrerId: {
      type: DataTypes.UUID,
      allowNull: true,
      // Don't define references here, they'll be handled by the associations
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
      // Don't define references here, they'll be handled by the associations
    }
  }, {
    timestamps: true,
    tableName: 'Transactions',
    freezeTableName: true,
    hooks: {
      // Add a hook to ensure unique 5-digit IDs
      beforeCreate: async (transaction) => {
        try {
          let isUnique = false;
          let attempts = 0;
          let newId;
          
          while (!isUnique && attempts < 10) {
            newId = Math.floor(10000 + Math.random() * 90000).toString();
            // Check if the ID exists only if the table exists
            try {
              const existingTransaction = await sequelize.models.Transaction.findByPk(newId);
              if (!existingTransaction) {
                isUnique = true;
                transaction.transactionId = newId;
              }
            } catch (err) {
              // If table doesn't exist yet, just use the ID
              isUnique = true;
              transaction.transactionId = newId;
            }
            attempts++;
          }
        } catch (error) {
          console.error('Error in beforeCreate hook:', error);
          // Fallback to a random ID
          transaction.transactionId = Math.floor(10000 + Math.random() * 90000).toString();
        }
      }
    }
  });

  return Transaction;
};
