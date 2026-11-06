const express = require('express');
const cors = require('cors');
const sequelize = require('./db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');

const PORT = 3000;

const app = express();

app.use(cors());
app.use(express.json());

app.get(['/', '/index.html'], (req, res) => res.sendFile('index.html', { root: __dirname }));
app.get('/app.js', (req, res) => res.sendFile('app.js', { root: __dirname }));
app.get('/style.css', (req, res) => res.sendFile('style.css', { root: __dirname }));

app.get('/api/', (req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

app.get('/api/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

async function startServer() {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('База данных подключена');

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
