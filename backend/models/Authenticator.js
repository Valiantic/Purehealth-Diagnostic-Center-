const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Authenticator = sequelize.define('Authenticator', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  credentialId: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  credentialPublicKey: {
    type: DataTypes.BLOB,
    allowNull: false,
    get() {
      const value = this.getDataValue('credentialPublicKey');
      // Ensure it's always returned as Buffer
      if (Buffer.isBuffer(value)) {
        return value;
      }
      if (typeof value === 'string') {
        // If stored as hex string (PostgreSQL BYTEA format), convert to Buffer
        return Buffer.from(value, 'hex');
      }
      return value;
    },
    set(value) {
      // Store as Buffer
      if (Buffer.isBuffer(value)) {
        this.setDataValue('credentialPublicKey', value);
      } else if (typeof value === 'string') {
        this.setDataValue('credentialPublicKey', Buffer.from(value, 'base64'));
      } else {
        this.setDataValue('credentialPublicKey', value);
      }
    }
  },
  counter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  credentialDeviceType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  credentialBackedUp: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  transports: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const value = this.getDataValue('transports');
      return value ? JSON.parse(value) : null;
    },
    set(value) {
      this.setDataValue('transports', value ? JSON.stringify(value) : null);
    }
  },
  isPrimary: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
});

module.exports = Authenticator; 