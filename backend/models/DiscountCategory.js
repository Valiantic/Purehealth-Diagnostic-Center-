const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DiscountCategory = sequelize.define('DiscountCategory', {
    discountCategoryId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    categoryName: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Name of the discount category (e.g., Senior Citizen, PWD, Student)'
    },
    percentage: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: 0,
        max: 100
      },
      comment: 'Discount percentage (0-100)'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of the discount category'
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      allowNull: false,
      defaultValue: 'active',
      comment: 'Status of the discount category'
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who created this category'
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who last updated this category'
    }
  }, {
    tableName: 'discount_categories',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return DiscountCategory;
};
