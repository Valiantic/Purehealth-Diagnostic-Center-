'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // For PostgreSQL
    if (queryInterface.sequelize.getDialect() === 'postgres') {
      await queryInterface.sequelize.query(`
        ALTER TYPE "enum_ExpenseItems_status" ADD VALUE IF NOT EXISTS 'reimbursed';
        ALTER TYPE "enum_ExpenseItems_status" ADD VALUE IF NOT EXISTS 'cancelled';
      `);
    } 
    // For MySQL
    else if (queryInterface.sequelize.getDialect() === 'mysql') {
      await queryInterface.changeColumn('ExpenseItems', 'status', {
        type: Sequelize.ENUM('pending', 'reimbursed', 'paid', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // For MySQL - rollback to original ENUM values
    if (queryInterface.sequelize.getDialect() === 'mysql') {
      await queryInterface.changeColumn('ExpenseItems', 'status', {
        type: Sequelize.ENUM('pending', 'paid'),
        allowNull: false,
        defaultValue: 'pending'
      });
    }
    // Note: PostgreSQL doesn't support removing ENUM values easily
    // You would need to create a new type and migrate data if rollback is needed
  }
};
