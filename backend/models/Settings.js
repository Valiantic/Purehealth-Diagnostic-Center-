const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Settings = sequelize.define('Settings', {
    settingId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    settingKey: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Unique key for the setting (e.g., referral_fee_percentage)'
    },
    settingValue: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: 'JSON string or plain value for the setting'
    },
    settingType: {
      type: DataTypes.ENUM('text', 'number', 'json', 'boolean'),
      allowNull: false,
      defaultValue: 'text',
      comment: 'Type of the setting value'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Description of what this setting does'
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'User ID who last updated this setting'
    }
  }, {
    tableName: 'settings',
    timestamps: true,
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  });

  return Settings;
};
