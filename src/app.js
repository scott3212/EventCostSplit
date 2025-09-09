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
    noSniff: true, // Keep basic content type protection
    xssFilter: false,
    frameguard: true, // Keep basic clickjacking protection
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

  // Generate cache-busting version
  const cacheVersion = IS_DEVELOPMENT ? Date.now() : require('crypto').createHash('md5').update(require('fs').readFileSync(path.join(__dirname, '../package.json'))).digest('hex').substring(0, 8);

  // Serve static files from public directory (excluding index.html)
  app.use(express.static(path.join(__dirname, '../public'), {
    maxAge: IS_DEVELOPMENT ? 0 : '1d', // No caching in development
    etag: true,
    lastModified: true,
    index: false, // Don't serve index.html from static middleware
    setHeaders: (res, filePath) => {
      // Explicitly set headers to prevent HTTPS enforcement
      res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
      
      // Set cache headers for assets
      if (filePath.match(/\.(js|css)$/)) {
        res.setHeader('Cache-Control', IS_DEVELOPMENT ? 'no-cache' : 'public, max-age=31536000'); // 1 year for versioned assets
      }
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

  // Serve index.html for SPA routes (catch-all) with cache-busting
  app.get('*', (req, res, next) => {
    // Only serve index.html for non-API routes
    if (req.path.startsWith('/api/')) {
      return next(); // Let API routes handle this
    }
    
    // Read and process index.html with cache-busting parameters
    try {
      let html = require('fs').readFileSync(path.join(__dirname, '../public/index.html'), 'utf8');
      
      // Inject cache-busting parameters into CSS and JS assets
      html = html.replace(/href="\/css\/([\w\/-]+\.css)"/g, `href="/css/$1?v=${cacheVersion}"`);
      html = html.replace(/src="\/js\/([\w\/-]+\.js)"/g, `src="/js/$1?v=${cacheVersion}"`);
      
      // Set appropriate headers for HTML
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      res.send(html);
    } catch (err) {
      next(err);
    }
  });

  // Error handling middleware (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;