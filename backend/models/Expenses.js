const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Expense = sequelize.define('Expense', {
        expenseId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        departmentId: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        date: {
            type: DataTypes.DATEONLY,
            allowNull: false,
            defaultValue: DataTypes.NOW
        },
        totalAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        userId: {
            type: DataTypes.INTEGER,  
            allowNull: false,
        },
        status: {
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'active'
        }
    }, {
        timestamps: true,
        tableName: 'Expenses',
        freezeTableName: true,
        indexes: [
            {
                name: 'idx_expense_department',
                fields: ['departmentId']
            },
            {
                name: 'idx_expense_user',
                fields: ['userId']
            }
        ]
    });
    return Expense;
}
