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

  // Security middleware - minimal configuration for development
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP completely for development
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    hsts: false,
    noSniff: false,
    xssFilter: false,
    frameguard: false,
    hidePoweredBy: false,
    referrerPolicy: false,
    expectCt: false,
    dnsPrefetchControl: false,
    ieNoOpen: false,
    permittedCrossDomainPolicies: false,
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

  // Development headers middleware to prevent HTTPS enforcement
  if (IS_DEVELOPMENT) {
    app.use((req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      next();
    });
  }

  // Serve static files from public directory
  app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: IS_DEVELOPMENT ? 0 : '1d', // No caching in development
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
      // Explicitly set headers to prevent HTTPS enforcement
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    }
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