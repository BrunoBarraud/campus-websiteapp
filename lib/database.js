// lib/database.js
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://usuario:contraseña@localhost:5432/campus_virtual', {
  dialect: 'postgres',
  logging: false
});

module.exports = sequelize;
