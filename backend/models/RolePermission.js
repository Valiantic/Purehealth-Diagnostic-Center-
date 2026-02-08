const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const RolePermission = sequelize.define('RolePermission', {
        roleId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'Roles',
                key: 'roleId'
            }
        },
        permissionId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            primaryKey: true,
            references: {
                model: 'Permissions',
                key: 'permissionId'
            }
        }
    }, {
        tableName: 'RolePermissions',
        timestamps: true,
        indexes: [
            {
                name: 'role_permission_role',
                fields: ['roleId']
            },
            {
                name: 'role_permission_permission',
                fields: ['permissionId']
            }
        ]
    });

    return RolePermission;
};
