// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../lib/database');

const User = sequelize.define('User', {
  firebase_uid: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  name: {
    type: DataTypes.STRING
  },
  role: {
    type: DataTypes.STRING,
    defaultValue: 'student'
  }
}, {
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = User;
