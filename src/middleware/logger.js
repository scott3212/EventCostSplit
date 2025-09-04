const morgan = require('morgan');
const { IS_DEVELOPMENT, IS_TEST } = require('../config/constants');

/**
 * Custom morgan token for response time with color coding
 */
morgan.token('response-time-colored', (req, res) => {
  const responseTime = parseFloat(morgan['response-time'](req, res));
  
  if (responseTime < 100) {
    return `\x1b[32m${responseTime}ms\x1b[0m`; // Green for fast responses
  } else if (responseTime < 500) {
    return `\x1b[33m${responseTime}ms\x1b[0m`; // Yellow for moderate responses
  } else {
    return `\x1b[31m${responseTime}ms\x1b[0m`; // Red for slow responses
  }
});

/**
 * Custom morgan token for status code with color coding
 */
morgan.token('status-colored', (req, res) => {
  const status = morgan.status(req, res);
  const code = parseInt(status);
  
  if (code < 300) {
    return `\x1b[32m${status}\x1b[0m`; // Green for success
  } else if (code < 400) {
    return `\x1b[36m${status}\x1b[0m`; // Cyan for redirects
  } else if (code < 500) {
    return `\x1b[33m${status}\x1b[0m`; // Yellow for client errors
  } else {
    return `\x1b[31m${status}\x1b[0m`; // Red for server errors
  }
});

/**
 * Custom morgan token for HTTP method with color coding
 */
morgan.token('method-colored', (req, res) => {
  const method = req.method;
  
  const colors = {
    'GET': '\x1b[32m',    // Green
    'POST': '\x1b[33m',   // Yellow
    'PUT': '\x1b[34m',    // Blue
    'PATCH': '\x1b[35m',  // Magenta
    'DELETE': '\x1b[31m', // Red
  };
  
  const color = colors[method] || '\x1b[37m'; // Default to white
  return `${color}${method}\x1b[0m`;
});

/**
 * Development format with colors and detailed info
 */
const developmentFormat = [
  '🏸',
  ':method-colored',
  ':url',
  ':status-colored',
  ':response-time-colored',
  ':res[content-length]',
  '-',
  ':user-agent'
].join(' ');

/**
 * Production format (more concise, no colors)
 */
const productionFormat = [
  ':remote-addr',
  ':method',
  ':url',
  ':status',
  ':response-time ms',
  ':res[content-length]',
  '":user-agent"'
].join(' ');

/**
 * Create logger middleware based on environment
 */
function createLogger() {
  // Don't log in test environment
  if (IS_TEST) {
    return (req, res, next) => next();
  }
  
  const format = IS_DEVELOPMENT ? developmentFormat : productionFormat;
  
  return morgan(format, {
    // Skip logging for static files and health checks
    skip: (req, res) => {
      return req.url.startsWith('/assets/') || 
             req.url.startsWith('/css/') || 
             req.url.startsWith('/js/') ||
             req.url === '/favicon.ico' ||
             req.url === '/health';
    },
    
    // Custom stream for development (with colors)
    stream: IS_DEVELOPMENT ? process.stdout : undefined,
  });
}

/**
 * Request logger for debugging (logs request body in development)
 */
function requestLogger(req, res, next) {
  if (IS_DEVELOPMENT && req.method !== 'GET') {
    console.log(`📝 Request Body for ${req.method} ${req.path}:`, 
      JSON.stringify(req.body, null, 2));
  }
  next();
}

/**
 * Response logger for debugging (logs response data in development)
 */
function responseLogger(req, res, next) {
  if (IS_DEVELOPMENT) {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 400) {
        console.log(`❌ Error Response for ${req.method} ${req.path}:`, 
          JSON.stringify(JSON.parse(data), null, 2));
      } else if (req.method !== 'GET') {
        console.log(`✅ Success Response for ${req.method} ${req.path}:`, 
          JSON.stringify(JSON.parse(data), null, 2));
      }
      
      originalSend.call(this, data);
    };
  }
  
  next();
}

/**
 * Performance logger (logs slow requests)
 */
function performanceLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    if (duration > 1000) { // Log requests taking more than 1 second
      console.warn(`⚠️  Slow request: ${req.method} ${req.path} took ${duration}ms`);
    }
  });
  
  next();
}

/**
 * Activity logger for important events
 */
function activityLogger(action, details = {}) {
  if (!IS_TEST) {
    const timestamp = new Date().toISOString();
    console.log(`🎯 ${timestamp} - ${action}`, 
      Object.keys(details).length > 0 ? details : '');
  }
}

module.exports = {
  createLogger,
  requestLogger,
  responseLogger,
  performanceLogger,
  activityLogger,
};