// Пропускает запрос дальше только с действительным JWT-токеном
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function authMiddleware(req, res, next) {
  // Заголовок имеет вид "Bearer <токен>"
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ message: 'требуется Bearer токен' });
  }

  try {
    // Данные из токена становятся доступны обработчику маршрута
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ message: 'невалидный или просроченный токен' });
  }
}

module.exports = authMiddleware;
