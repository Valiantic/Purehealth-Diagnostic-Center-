const Sequelize = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    logging: console.log,
    timezone: '+00:00', // Store all dates in UTC
    dialectOptions: {
      timezone: '+00:00' // Ensure MySQL connection uses UTC
    }
  }
);

module.exports = sequelize; 