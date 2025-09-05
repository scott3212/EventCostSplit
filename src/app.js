const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const { CORS_ORIGIN, IS_DEVELOPMENT } = require('./config/constants');
const { 
  errorHandler, 
  notFoundHandler 
} = require('./middleware/errorHandler');
const { 
  createLogger, 
  requestLogger, 
  responseLogger,
  performanceLogger 
} = require('./middleware/logger');

/**
 * Create Express application with middleware setup
 */
function createApp() {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Disable for development
  }));

  // CORS configuration
  app.use(cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing middleware
  app.use(express.json({ 
    limit: '10mb',
    // Custom error handling for JSON parsing
    verify: (req, res, buf, encoding) => {
      try {
        JSON.parse(buf);
      } catch (error) {
        error.type = 'entity.parse.failed';
        throw error;
      }
    }
  }));
  
  app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
  }));

  // Logging middleware
  app.use(createLogger());
  
  if (IS_DEVELOPMENT) {
    app.use(requestLogger);
    app.use(responseLogger);
    app.use(performanceLogger);
  }

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: IS_DEVELOPMENT ? 0 : '1d', // No caching in development
    etag: true,
    lastModified: true,
  }));

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // API routes
  const createApiRoutes = require('./routes');
  app.use('/api', createApiRoutes());

  // Serve index.html for SPA routes (catch-all)
  app.get('*', (req, res, next) => {
    // Only serve index.html for non-API routes
    if (req.path.startsWith('/api/')) {
      return next(); // Let API routes handle this
    }
    
    // Serve index.html for frontend routes
    res.sendFile(path.join(__dirname, '../public/index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;