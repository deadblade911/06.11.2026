// Точка входа: настраивает Express, подключает маршруты и запускает сервер
const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const PORT = 3000;

const app = express();

// --- Общие middleware ---
// Разрешает запросы к API со страниц с других адресов (своя страница работает и без этого)
app.use(cors());
app.use(express.json());

// --- Файлы фронтенда ---
// Отдаём только эти три файла. express.static на корень проекта нельзя:
// он открыл бы всем server.js, config.js и database.sqlite
app.get(['/', '/index.html'], (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/app.js', (req, res) => res.sendFile('app.js', { root: __dirname }));
app.get('/style.css', (req, res) => res.sendFile('style.css', { root: __dirname }));

// --- API ---
// Проверка, что сервер работает
app.get('/api/', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

// Защищённый маршрут: возвращает данные из токена, а не из базы (id, email, время выдачи iat и окончания exp)
app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

// --- Запуск ---
async function startServer() {
  try {
    await sequelize.authenticate();
    // Создаёт таблицы по моделям. Модель User уже загружена цепочкой:
    // routes/auth.js -> controllers/authController.js -> models/User.js
    await sequelize.sync();
    console.log('База данных подключена');

    // Express передаёт сюда и ошибку запуска, например если порт уже занят
    app.listen(PORT, (err) => {
      if (err) {
        console.error('Не удалось запустить сервер:', err.message);
        process.exit(1);
      }
      console.log(`Сервер запущен: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Не удалось запустить сервер:', err);
    process.exit(1);
  }
}

startServer();
