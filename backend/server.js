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

// Fallback Unhandled Route Handler
app.use((req, res, next) => {
  console.log(`[404 DEBUG]: Фронтенд шукає маршрут -> ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: 'Endpoint destination requested was not found.' });
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