'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check for and fix any duplicate mcNo values
    const [duplicates] = await queryInterface.sequelize.query(`
      SELECT mcNo, COUNT(*) as count 
      FROM Transactions 
      GROUP BY mcNo 
      HAVING COUNT(*) > 1
    `);

    // If there are duplicates, update them with unique values
    if (duplicates.length > 0) {
      console.log(`Found ${duplicates.length} duplicate mcNo values. Fixing...`);
      
      for (const dup of duplicates) {
        // Get all transactions with this duplicate mcNo
        const [transactions] = await queryInterface.sequelize.query(`
          SELECT transactionId, mcNo 
          FROM Transactions 
          WHERE mcNo = :mcNo 
          ORDER BY createdAt ASC
        `, {
          replacements: { mcNo: dup.mcNo }
        });

        // Keep the first one, update the rest
        for (let i = 1; i < transactions.length; i++) {
          // Find the highest mcNo in the database
          const [highestResult] = await queryInterface.sequelize.query(`
            SELECT MAX(CAST(mcNo AS UNSIGNED)) as maxMcNo FROM Transactions
          `);
          
          const nextMcNo = String(parseInt(highestResult[0].maxMcNo || 10000) + 1).padStart(5, '0');
          
          await queryInterface.sequelize.query(`
            UPDATE Transactions 
            SET mcNo = :newMcNo 
            WHERE transactionId = :transactionId
          `, {
            replacements: { 
              newMcNo: nextMcNo,
              transactionId: transactions[i].transactionId 
            }
          });
          
          console.log(`Updated duplicate mcNo ${dup.mcNo} to ${nextMcNo} for transaction ${transactions[i].transactionId}`);
        }
      }
    }

    // Add unique constraint to mcNo column
    await queryInterface.addConstraint('Transactions', {
      fields: ['mcNo'],
      type: 'unique',
      name: 'unique_mcNo'
    });

    console.log('Successfully added unique constraint to mcNo column');
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the unique constraint
    await queryInterface.removeConstraint('Transactions', 'unique_mcNo');
    console.log('Removed unique constraint from mcNo column');
  }
};
