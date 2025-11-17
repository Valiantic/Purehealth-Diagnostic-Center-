require('dotenv').config();
const { sequelize } = require('./models');

async function setupDatabase() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    console.log('Syncing database models...');
    // Force sync will drop existing tables and recreate them
    // Use { force: false, alter: true } for safer sync that alters existing tables
    await sequelize.sync({ force: false, alter: true });
    console.log('Database tables created/updated successfully.');

    console.log('Database setup complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up database:', error);
    process.exit(1);
  }
}

setupDatabase();
