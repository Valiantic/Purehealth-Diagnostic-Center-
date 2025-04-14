'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add role column after lastName
    await queryInterface.addColumn('Users', 'role', {
      type: Sequelize.ENUM('admin', 'receptionist'),
      allowNull: false,
      defaultValue: 'receptionist',
      after: 'lastName'
    });
  },

  async down(queryInterface, Sequelize) {
    // First remove the column
    await queryInterface.removeColumn('Users', 'role');
    
    // Then clean up the ENUM type
    return queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_Users_role";'
    );
  }
};
