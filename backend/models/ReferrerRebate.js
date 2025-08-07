const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const ReferrerRebate = sequelize.define('ReferrerRebate', {
        rebateId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        referrerId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'referrers',
                key: 'referrerId'
            }
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        rebateDate: {
            type: DataTypes.DATEONLY,
            allowNull: false
        },
        totalRebateAmount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            defaultValue: 0.00
        },
        transactionCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            allowNull: false
        }
    }, {
        timestamps: true,
        tableName: 'ReferrerRebates',
        freezeTableName: true,
        indexes: [
            {
                name: 'unique_referrer_date',
                unique: true,
                fields: ['referrerId', 'rebateDate']
            },
            {
                name: 'idx_rebate_date',
                fields: ['rebateDate']
            },
            {
                name: 'idx_rebate_referrer',
                fields: ['referrerId']
            }
        ]
    });

    return ReferrerRebate;
};