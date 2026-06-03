const express = require('express');
const db = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { connectRabbitMQ } = require('./src/utils/rabbitmq'); // ДОДАНО
const certificateRoutes = require('./src/routes/certificateRoutes'); // ДОДАНО

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Universal body parsers for inbound API calls
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS validation layer for decoupled layout communication
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH');
    return res.status(200).json({});
  }
  next();
});

// Routing Layer Definitions
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/dashboard', require('./src/routes/dashboardRoutes'));
app.use('/api/learning', require('./src/routes/learningRoutes'));
app.use('/api/profiles', require('./src/routes/profileRoutes'));
app.use('/api/admin', require('./src/routes/dashboardRoutes'));
app.use('/api/student', require('./src/routes/studentRoutes'));
app.use('/api/certificates', certificateRoutes);

// =========================================================================
// ХЕНДЛЕР ПОМИЛКИ 404 ТА ЗАХИСТУ ВІД ПРЯМОГО СКАНУВАННЯ ФАЙЛІВ
// =========================================================================
app.use((req, res, next) => {
  console.log(`[404 SECURITY DEBUG]: Спроба доступу до шляху або файлу -> ${req.method} ${req.originalUrl}`);
  
  // Встановлюємо HTTP статус 404
  res.status(404).send(`
    <!DOCTYPE html>
    <html lang="uk">
    <head>
        <meta charset="UTF-8">
        <title>404 - Об'єкт не знайдено</title>
        <link rel="stylesheet" href="/css/styles.css">
    </head>
    <body style="display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background-color: var(--bg-main, #f4f7f6);">
        <div style="text-align: center; background: var(--bg-card, #ffffff); padding: 3rem; border-radius: 8px; border: 1px solid var(--error, #e74c3c); max-width: 550px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); margin: 20px;">
            <h1 style="color: var(--error, #e74c3c); font-size: 4rem; margin: 0;">404</h1>
            <h3 style="color: var(--text-main, #2c3e50); margin-top: 10px;">Сторінку або файл не знайдено</h3>
            <p style="color: var(--text-muted, #7f8c8d); margin-bottom: 2rem; line-height: 1.6; font-size: 15px;">
                Об'єкт за адресою <b style="font-family: monospace; background: rgba(231, 76, 60, 0.08); padding: 3px 6px; border-radius: 4px; color: #c0392b;">${req.originalUrl}</b> відсутній у системі <b>IT-Tutor</b>, або прямий доступ до цього архітектурного файлу суворо обмежено політикою безпеки.
            </p>
            <a href="/" class="btn" style="display: inline-block; text-decoration: none; padding: 10px 20px; background: #2980b9; color: white; border-radius: 4px; font-weight: bold;">Повернутися на головну</a>
        </div>
    </body>
    </html>
  `);
});

// Catch-All Interceptor Layer
app.use(errorHandler);

async function bootSystem() {
  try {
    // Spin up connection pooling matrix before handling user endpoints
    await db.initializePool();
    await connectRabbitMQ();
    app.listen(PORT, () => {
      console.log(`[API Engine Engine Live]: Securely handling connections on port ${PORT}`);
    });
  } catch (err) {
    console.error('Critical boot sequence failure. Terminating process:', err);
    process.exit(1);
  }
}

bootSystem();