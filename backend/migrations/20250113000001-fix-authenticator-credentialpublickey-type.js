'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, clear all authenticators (they have corrupted data)
    await queryInterface.bulkDelete('Authenticators', {}, {});

    // Then alter the column type to BYTEA for PostgreSQL
    await queryInterface.changeColumn('Authenticators', 'credentialPublicKey', {
      type: Sequelize.BLOB,
      allowNull: false
    });

    console.log('Fixed credentialPublicKey column type and cleared authenticators');
  },

  down: async (queryInterface, Sequelize) => {
    // Cannot revert
    console.log('Cannot revert credentialPublicKey type change');
  }
};
