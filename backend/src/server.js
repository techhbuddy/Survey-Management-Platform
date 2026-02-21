require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB, getConnectionStatus, isConnected } = require('./config/database');
const { errorHandler } = require('./utils/errorHandler');
const passport = require('passport');

// Import routes
const authRoutes = require('./routes/auth');
const surveyRoutes = require('./routes/surveys');
const responseRoutes = require('./routes/responses');
const publicRoutes = require('./routes/public');

const app = express();

// Initialize passport (Google OAuth strategy)
require('./config/passport');


// Store server instance for graceful shutdown
let server;

// Initialize Database Connection
const initializeDatabase = async () => {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to initialize database:', error.message);
    // Continue startup but with limited functionality
  }
};

// Middleware
const corsOptions = {
  origin: process.env.FRONTEND_URL === '*' ? '*' : (process.env.FRONTEND_URL || 'http://localhost:3000'),
  credentials: process.env.FRONTEND_URL !== '*', // Only allow credentials if not wildcard
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(passport.initialize());

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/responses', responseRoutes);

// Health Check Endpoint - Basic
app.get('/api/health', (req, res) => {
  res.json({
    status: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Health Check Endpoint - Detailed (includes database status)
app.get('/api/health/detailed', (req, res) => {
  const dbStatus = getConnectionStatus();

  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: {
      environment: process.env.NODE_ENV || 'development',
      port: process.env.PORT || 5000,
    },
    database: {
      connected: isConnected(),
      ...dbStatus,
    },
    memory: {
      heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)} MB`,
    },
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
    method: req.method,
  });
});

// Global error handling middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server with graceful shutdown handling
const startServer = async () => {
  try {
    // Initialize database first
    await initializeDatabase();

    // Start HTTP server
    server = app.listen(PORT, () => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✓ Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
      console.log(`✓ API URL: http://localhost:${PORT}/api`);
      console.log(`✓ Health check: http://localhost:${PORT}/api/health/detailed`);
      console.log(`${'='.repeat(50)}\n`);
    });

    // Graceful shutdown handler
    process.on('SIGTERM', () => {
      console.log('\n✓ SIGTERM signal received: closing HTTP server');
      if (server) {
        server.close(() => {
          console.log('✓ HTTP server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    process.on('SIGINT', () => {
      console.log('\n✓ SIGINT signal received: closing HTTP server');
      if (server) {
        server.close(() => {
          console.log('✓ HTTP server closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('✗ Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('✗ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  } catch (error) {
    console.error('✗ Failed to start server:', error.message);
    process.exit(1);
  }
};

// Start the server if this is the main module
if (require.main === module) {
  startServer();
}

module.exports = app;
