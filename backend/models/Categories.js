const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Category = sequelize.define('Category', {
        categoryId: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
       name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            allowNull: false
        }
    }, {
        timestamps: true,
        tableName: 'Categories',
        freezeTableName: true,
        indexes: [
            {
                name: 'idx_category_name',
                fields: ['name']
            },
            {
                name: 'idx_category_status',
                fields: ['status']
            }
        ]
    });
    return Category;
}