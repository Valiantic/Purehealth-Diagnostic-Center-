const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Permission = sequelize.define('Permission', {
        permissionId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        permissionKey: {
            type: DataTypes.STRING(100),
            allowNull: false,
            unique: true,
            validate: {
                notEmpty: true,
                is: /^[a-z]+\.[a-z]+$/i // Format: category.action (e.g., transactions.view)
            }
        },
        displayName: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        category: {
            type: DataTypes.STRING(50),
            allowNull: false,
            comment: 'Permission category for grouping in UI (e.g., Transactions, Expenses)'
        }
    }, {
        tableName: 'Permissions',
        timestamps: true,
        indexes: [
            {
                name: 'permission_key_unique',
                unique: true,
                fields: ['permissionKey']
            },
            {
                name: 'permission_category',
                fields: ['category']
            }
        ]
    });

    return Permission;
};
