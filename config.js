// Настройки JWT-токенов
// В реальном развёртывании секрет хранится в переменной окружения, а не в коде
const JWT_SECRET = 'super_secret_key_change_me';
const JWT_EXPIRES_IN = '7d';

module.exports = { JWT_SECRET, JWT_EXPIRES_IN };
