'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the status column already exists
    const tableInfo = await queryInterface.describeTable('Users');
    
    if (!tableInfo.status) {
      // Create the ENUM type first if it doesn't exist
      try {
        await queryInterface.sequelize.query(
          'CREATE TYPE "enum_Users_status" AS ENUM(\'active\', \'inactive\');'
        );
      } catch (error) {
        console.log('ENUM type might already exist, continuing...');
      }
      
      // Add the status column
      await queryInterface.addColumn('Users', 'status', {
        type: Sequelize.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: 'active'
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      // Remove the column if it exists
      await queryInterface.removeColumn('Users', 'status');
      
      // Drop the ENUM type if possible
      await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_status";');
    } catch (error) {
      console.log('Error in migration rollback:', error);
    }
  }
};