const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Referrer = sequelize.define('Referrer', {
        referrerId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: false
        },
        birthday: {
            type: DataTypes.DATEONLY,
            allowNull: true
        },
        contactNo: {
            type: DataTypes.STRING,
            allowNull: true
        },
        clinicName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        clinicAddress: {
            type: DataTypes.TEXT,
            allowNull: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            allowNull: false
        },
        dateAdded: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
            allowNull: false
        }
    }, {
        timepstamps: true,
        tableName: 'referrers',
    });

    return Referrer;
}