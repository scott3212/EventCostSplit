const createApp = require('./app');
const { PORT, NODE_ENV } = require('./config/constants');
const { activityLogger } = require('./middleware/logger');

/**
 * Start the server
 */
function startServer() {
  const app = createApp();
  
  const server = app.listen(PORT, () => {
    activityLogger(`🏸 Badminton Cost Splitter server started`, {
      port: PORT,
      environment: NODE_ENV,
      url: `http://localhost:${PORT}`,
    });
    
    if (NODE_ENV === 'development') {
      console.log(`
🎉 Ready to split some badminton costs!
   
📱 Open your browser: http://localhost:${PORT}
🎯 Environment: ${NODE_ENV}
⚡ Hot reload: enabled
      `);
    }
  });

  // Graceful shutdown handling
  process.on('SIGTERM', () => {
    activityLogger('🛑 Received SIGTERM, shutting down gracefully');
    
    server.close(() => {
      activityLogger('✅ Server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    activityLogger('🛑 Received SIGINT (Ctrl+C), shutting down gracefully');
    
    server.close(() => {
      activityLogger('✅ Server closed');
      process.exit(0);
    });
  });

  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    activityLogger('💥 Uncaught Exception, shutting down', { error: error.message });
    
    server.close(() => {
      process.exit(1);
    });
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    activityLogger('💥 Unhandled Rejection, shutting down', { reason });
    
    server.close(() => {
      process.exit(1);
    });
  });

  return server;
}

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = startServer;