const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ExpenseItem = sequelize.define('ExpenseItem', {
        expenseItemId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        expenseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        paidTo: {
            type: DataTypes.STRING,
            allowNull: false
        },
        purpose: {
            type: DataTypes.STRING,
            allowNull: false
        },
        categoryId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('pending', 'reimbursed', 'paid', 'cancelled', 'refunded'),
            defaultValue: 'pending',
            allowNull: false
        }
    }, {
        timestamps: true,
        tableName: 'ExpenseItems',
        freezeTableName: true, 
        indexes: [
            {
                name: 'idx_expense_item_expense',
                fields: ['expenseId']
            },
            {
                name: 'idx_expense_item_category',
                fields: ['categoryId']
            }
        ]
    });
    return ExpenseItem;
}