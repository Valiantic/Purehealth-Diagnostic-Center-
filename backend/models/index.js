const sequelize = require('../config/database');
const User = require('./User');
const Authenticator = require('./Authenticator');
const Department = require('./Department')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);
const Test = require('./Test')(sequelize);

// Relationships
User.hasMany(Authenticator, { foreignKey: 'userId' });
Authenticator.belongsTo(User, { foreignKey: 'userId' });

// User has many activity logs, but logs remain when users are deleted
User.hasMany(ActivityLog, { 
  foreignKey: 'userId',
  onDelete: 'SET NULL' // Changed from CASCADE to SET NULL
});
ActivityLog.belongsTo(User, { 
  foreignKey: 'userId', 
  onDelete: 'SET NULL' // Changed from CASCADE to SET NULL
});

// Department has many tests
Department.hasMany(Test, { foreignKey: 'departmentId' });
Test.belongsTo(Department, { foreignKey: 'departmentId' });

module.exports = {
  sequelize,
  User,
  Authenticator,
  Department,
  ActivityLog,
  Test
};