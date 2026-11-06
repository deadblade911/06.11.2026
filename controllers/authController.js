// Обработчики регистрации и входа пользователя
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config');

// Сложность хеширования пароля в bcrypt
const SALT_ROUNDS = 10;

// Создаёт токен, внутри которого записаны id и email пользователя
function createToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Данные пользователя для ответа клиенту: без хеша пароля
function toPublicUser(user) {
  return { id: user.id, email: user.email, phone: user.phone };
}

async function register(req, res) {
  try {
    const { email, phone, password } = req.body;

    if (!email || !phone || !password) {
      return res.status(400).json({ message: 'email, phone и password обязательны' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, phone, password: passwordHash });
    const token = createToken(user);

    return res.status(201).json({ token, user: toPublicUser(user) });
  } catch (err) {
    // Ошибки Sequelize: данные не прошли проверку модели или email/телефон уже есть в базе
    if (err.name === 'SequelizeValidationError') {
      return res.status(400).json({ message: err.errors[0].message });
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'email или телефон уже занят' });
    }
    console.error(err);
    return res.status(500).json({ message: 'внутренняя ошибка' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email и password обязательны' });
    }

    // Ответ при ошибке один и тот же, чтобы нельзя было узнать, зарегистрирован ли email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'неверный email или пароль' });
    }

    // В user.password лежит хеш: bcrypt.compare сверяет с ним введённый пароль
    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'неверный email или пароль' });
    }

    const token = createToken(user);

    return res.json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'внутренняя ошибка' });
  }
}

module.exports = { register, login };
