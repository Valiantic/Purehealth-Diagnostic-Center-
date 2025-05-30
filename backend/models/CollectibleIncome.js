const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const CollectibleIncome = sequelize.define('CollectibleIncome', {
        companyId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        companyName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        coordinatorName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        totalIncome: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },

    }, {
        timestamps: true,
        createdAt: 'createdAt',
        updatedAt: 'updatedAt',
        tableName: 'CollectibleIncome',
        freezeTableName: true
    });
    
    return CollectibleIncome;
};