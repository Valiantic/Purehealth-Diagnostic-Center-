const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CollectibleIncomeItems = sequelize.define('CollectibleIncomeItems', {
        itemId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        testName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        quantity: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
        }
    }, {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        tableName: 'CollectibleIncomeItems',
        freezeTableName: true
    });

    return CollectibleIncomeItems;
};
