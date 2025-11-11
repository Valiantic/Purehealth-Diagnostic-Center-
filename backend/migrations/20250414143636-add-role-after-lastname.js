'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Check if role column already exists
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (!tableDescription.role) {
      // Add role column after lastName only if it doesn't exist
      await queryInterface.addColumn('Users', 'role', {
        type: Sequelize.ENUM('admin', 'receptionist'),
        allowNull: false,
        defaultValue: 'receptionist',
        after: 'lastName'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Check if role column exists before removing
    const tableDescription = await queryInterface.describeTable('Users');
    
    if (tableDescription.role) {
      // First remove the column
      await queryInterface.removeColumn('Users', 'role');
      
      // Then clean up the ENUM type
      return queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Users_role";'
      );
    }
  }
};
