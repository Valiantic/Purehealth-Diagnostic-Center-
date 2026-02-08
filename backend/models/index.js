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
const ReferrerRebate = require('./ReferrerRebate')(sequelize);
const Settings = require('./Settings')(sequelize);
const DiscountCategory = require('./DiscountCategory')(sequelize);
const CollectibleIncomeItems = require('./CollectibleIncomeItems')(sequelize);
const Role = require('./Role')(sequelize);
const Permission = require('./Permission')(sequelize);
const RolePermission = require('./RolePermission')(sequelize);

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

Referrer.hasMany(ReferrerRebate, {
  foreignKey: 'referrerId',
  onDelete: 'CASCADE'
});

ReferrerRebate.belongsTo(Referrer, {
  foreignKey: 'referrerId',
  onDelete: 'CASCADE'
});

CollectibleIncome.hasMany(CollectibleIncomeItems, {
  foreignKey: 'companyId',
  onDelete: 'CASCADE'
});

CollectibleIncomeItems.belongsTo(CollectibleIncome, {
  foreignKey: 'companyId'
});

// Role and Permission relationships
Role.hasMany(User, {
  foreignKey: 'roleId',
  onDelete: 'RESTRICT'
});
User.belongsTo(Role, {
  foreignKey: 'roleId',
  onDelete: 'RESTRICT'
});

Role.belongsToMany(Permission, {
  through: RolePermission,
  foreignKey: 'roleId',
  otherKey: 'permissionId'
});
Permission.belongsToMany(Role, {
  through: RolePermission,
  foreignKey: 'permissionId',
  otherKey: 'roleId'
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
  CollectibleIncome,
  CollectibleIncomeItems,
  ReferrerRebate,
  Settings,
  DiscountCategory,
  Role,
  Permission,
  RolePermission
};