const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActivityLog = sequelize.define('ActivityLog', {
    logId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // Allow NULL for deleted users
      references: {
        model: 'Users',
        key: 'userId'
      }
    },
    action: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true // Add index for faster searches
    },
    resourceType: {
      type: DataTypes.STRING,
      allowNull: false,
      index: true
    },
    resourceId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    // Store user information as JSON in case the user gets deleted
    userInfo: {
      type: DataTypes.TEXT,
      allowNull: true,
      get() {
        const value = this.getDataValue('userInfo');
        return value ? JSON.parse(value) : null;
      },
      set(value) {
        this.setDataValue('userInfo', value ? JSON.stringify(value) : null);
      }
    }
  }, {
    tableName: 'ActivityLogs',
    timestamps: true,
    indexes: [
      // Add indexes for faster searching
      {
        name: 'activity_log_user_id',
        fields: ['userId']
      },
      {
        name: 'activity_log_action',
        fields: ['action']
      },
      {
        name: 'activity_log_resource_type',
        fields: ['resourceType']
      },
      {
        name: 'activity_log_created_at',
        fields: ['createdAt']
      }
    ]
  });

  return ActivityLog;
};
