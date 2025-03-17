const sequelize = require('../config/database');
const User = require('./User');
const Authenticator = require('./Authenticator');

// Relationships
User.hasMany(Authenticator, { foreignKey: 'userId' });
Authenticator.belongsTo(User, { foreignKey: 'userId' });

module.exports = {
  sequelize,
  User,
  Authenticator
}; 