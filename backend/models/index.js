const sequelize = require('../config/database');
const User = require('./User');
const Authenticator = require('./Authenticator');
const Department = require('./Department')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);
const Test = require('./Test')(sequelize);
const Referrer = require('./Referrer')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const TestDetails = require('./TestDetails')(sequelize);

// Relationships
User.hasMany(Authenticator, { foreignKey: 'userId' });
Authenticator.belongsTo(User, { foreignKey: 'userId' });

// User has many activity logs, but logs remain when users are deleted
User.hasMany(ActivityLog, { 
  foreignKey: 'userId',
  onDelete: 'SET NULL'
});
ActivityLog.belongsTo(User, { 
  foreignKey: 'userId', 
  onDelete: 'SET NULL'
});

// Department has many tests
Department.hasMany(Test, { foreignKey: 'departmentId' });
Test.belongsTo(Department, { foreignKey: 'departmentId' });

// Transaction relationships
User.hasMany(Transaction, { 
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  constraints: false // Disable constraint checking during model initialization
});
Transaction.belongsTo(User, { 
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  constraints: false
});

Referrer.hasMany(Transaction, { 
  foreignKey: 'referrerId',
  onDelete: 'SET NULL',
  constraints: false
});
Transaction.belongsTo(Referrer, { 
  foreignKey: 'referrerId',
  onDelete: 'SET NULL',
  constraints: false
});

// TestDetails relationships - with STRING(5) transactionId
Transaction.hasMany(TestDetails, { 
  foreignKey: 'transactionId',
  sourceKey: 'transactionId', // Make explicit that we're using transactionId
  constraints: false
});
TestDetails.belongsTo(Transaction, { 
  foreignKey: 'transactionId',
  targetKey: 'transactionId', // Make explicit that we're using transactionId
  constraints: false
});

Test.hasMany(TestDetails, { 
  foreignKey: 'testId',
  constraints: false
});
TestDetails.belongsTo(Test, { 
  foreignKey: 'testId',
  constraints: false
});

Department.hasMany(TestDetails, { 
  foreignKey: 'departmentId',
  constraints: false
});
TestDetails.belongsTo(Department, { 
  foreignKey: 'departmentId',
  constraints: false
});

module.exports = {
  sequelize,
  User,
  Authenticator,
  Department,
  ActivityLog,
  Test,
  Referrer,
  Transaction,
  TestDetails
};