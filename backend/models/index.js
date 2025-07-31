const sequelize = require('../config/database');
const User = require('./User');
const Authenticator = require('./Authenticator');
const Department = require('./Department')(sequelize);
const ActivityLog = require('./ActivityLog')(sequelize);
const Test = require('./Test')(sequelize);
const Referrer = require('./Referrer')(sequelize);
const Transaction = require('./Transaction')(sequelize);
const TestDetails = require('./TestDetails')(sequelize);
const DepartmentRevenue = require('./DepartmentRevenue')(sequelize);
const Expense = require('./Expenses')(sequelize);
const ExpenseItem = require('./ExpenseItems')(sequelize);
const Category = require('./Category')(sequelize);
const CollectibleIncome = require('./CollectibleIncome')(sequelize);

// Relationships
User.hasMany(Authenticator, { foreignKey: 'userId' });
Authenticator.belongsTo(User, { foreignKey: 'userId' });
Department.hasMany(Expense, { foreignKey: 'departmentId' });
Expense.belongsTo(Department, { foreignKey: 'departmentId' });

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

User.hasMany(Transaction, { 
  foreignKey: 'userId',
  onDelete: 'RESTRICT',
  constraints: false
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

// TestDetails relationships
Transaction.hasMany(TestDetails, { 
  foreignKey: 'transactionId',
  constraints: false
});

Category.hasMany(ExpenseItem, { 
  foreignKey: 'categoryId',
  onDelete: 'SET NULL'
});

ExpenseItem.belongsTo(Category, { 
  foreignKey: 'categoryId'
});

TestDetails.belongsTo(Transaction, { 
  foreignKey: 'transactionId',
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

// Department Revenue relationships
Department.hasMany(DepartmentRevenue, {
  foreignKey: 'departmentId',
  constraints: false
});
DepartmentRevenue.belongsTo(Department, {
  foreignKey: 'departmentId',
  constraints: false
});

Transaction.hasMany(DepartmentRevenue, {
  foreignKey: 'transactionId',
  sourceKey: 'transactionId',
  constraints: false
});
DepartmentRevenue.belongsTo(Transaction, {
  foreignKey: 'transactionId',
  targetKey: 'transactionId',
  constraints: false
});

TestDetails.hasOne(DepartmentRevenue, {
  foreignKey: 'testDetailId',
  sourceKey: 'testDetailId',
  constraints: false
});
DepartmentRevenue.belongsTo(TestDetails, {
  foreignKey: 'testDetailId',
  targetKey: 'testDetailId',
  constraints: false
});

// Fix Expense relationships
User.hasMany(Expense, { 
  foreignKey: 'userId',
  onDelete: 'RESTRICT'
});

Expense.belongsTo(User, {
  foreignKey: 'userId',
  onDelete: 'RESTRICT'
});

Department.hasMany(Expense, { 
  foreignKey: 'departmentId',
  onDelete: 'SET NULL'
});

Expense.belongsTo(Department, { 
  foreignKey: 'departmentId',
  onDelete: 'SET NULL'
});

Expense.hasMany(ExpenseItem, { 
  foreignKey: 'expenseId', 
  onDelete: 'CASCADE' 
});
ExpenseItem.belongsTo(Expense, { 
  foreignKey: 'expenseId' 
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
  TestDetails,
  DepartmentRevenue,
  Expense,
  ExpenseItem,
  Category,
  CollectibleIncome
};