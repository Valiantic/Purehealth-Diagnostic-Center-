const Sequelize = require('sequelize');
const config = require('./config')[process.env.NODE_ENV || 'development'];

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    dialectOptions: config.dialectOptions || {},
    logging: config.logging !== undefined ? config.logging : console.log
  }
);

module.exports = sequelize; 