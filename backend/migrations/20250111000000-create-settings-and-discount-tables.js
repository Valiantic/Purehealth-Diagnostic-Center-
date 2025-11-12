'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Create Settings table
    await queryInterface.createTable('settings', {
      settingId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      settingKey: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      settingValue: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      settingType: {
        type: Sequelize.ENUM('text', 'number', 'json', 'boolean'),
        allowNull: false,
        defaultValue: 'text'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Create DiscountCategory table
    await queryInterface.createTable('discount_categories', {
      discountCategoryId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      categoryName: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      percentage: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Insert default referral fee setting
    await queryInterface.bulkInsert('settings', [{
      settingKey: 'referral_fee_percentage',
      settingValue: '12',
      settingType: 'number',
      description: 'Percentage of referral fee for referred clients',
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    // Insert default discount categories
    await queryInterface.bulkInsert('discount_categories', [
      {
        categoryName: 'Senior Citizen',
        percentage: 20.00,
        description: 'Discount for senior citizens (60 years and above)',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        categoryName: 'Person with Disability',
        percentage: 20.00,
        description: 'Discount for persons with disability (PWD)',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('discount_categories');
    await queryInterface.dropTable('settings');
  }
};
