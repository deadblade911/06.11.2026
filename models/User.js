// Модель пользователя: таблица Users в базе данных
const { DataTypes } = require('sequelize');
const sequelize = require('../db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  // Здесь хранится хеш пароля, а не сам пароль
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = User;
