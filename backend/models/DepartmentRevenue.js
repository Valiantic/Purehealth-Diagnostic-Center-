const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DepartmentRevenue = sequelize.define('DepartmentRevenue', {
    revenueId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
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
    },
    status: {
      type: DataTypes.STRING,
      defaultValue: 'active',
      allowNull: false
    },
    metadata: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const metadataStr = this.getDataValue('metadata');
        if (metadataStr) {
          try {
            return JSON.parse(metadataStr);
          } catch (e) {
            return {};
          }
        }
        return {};
      },
      set(value) {
        this.setDataValue('metadata', JSON.stringify(value));
      }
    }
  }, {
    timestamps: true,
    tableName: 'DepartmentRevenues',
    freezeTableName: true
  });

  return DepartmentRevenue;
};
