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
            allowNull: false
        },
        status: {
            type: DataTypes.ENUM('active', 'inactive'),
            defaultValue: 'active',
            allowNull: false
        }
    }, {
        timestamps: true,
        tableName: 'Category',
        freezeTableName: true,
        indexes: [
            {
                name: 'unique_category_name',
                unique: true,
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