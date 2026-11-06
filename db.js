// Подключение к базе данных SQLite через Sequelize
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  // Не выводить SQL-запросы в консоль
  logging: false,
});

module.exports = sequelize;
