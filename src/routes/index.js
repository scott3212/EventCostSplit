const express = require('express');

// Repository imports
const BaseRepository = require('../repositories/BaseRepository');
const UserRepository = require('../repositories/UserRepository');
const EventRepository = require('../repositories/EventRepository');
const CostItemRepository = require('../repositories/CostItemRepository');
const PaymentRepository = require('../repositories/PaymentRepository');

// Service imports
const CalculationService = require('../services/CalculationService');
const UserService = require('../services/UserService');
const EventService = require('../services/EventService');
const CostItemService = require('../services/CostItemService');
const PaymentService = require('../services/PaymentService');

// Controller imports
const UserController = require('../controllers/UserController');
const EventController = require('../controllers/EventController');
const CostItemController = require('../controllers/CostItemController');
const PaymentController = require('../controllers/PaymentController');
const TestController = require('../controllers/TestController');

// Route factory imports
const createUserRoutes = require('./userRoutes');
const createEventRoutes = require('./eventRoutes');
const createCostItemRoutes = require('./costItemRoutes');
const createPaymentRoutes = require('./paymentRoutes');

/**
 * Create and configure all API routes with dependency injection
 */
function createApiRoutes() {
  const router = express.Router();

  // Initialize repositories
  const userRepo = new UserRepository();
  const eventRepo = new EventRepository();
  const costItemRepo = new CostItemRepository();
  const paymentRepo = new PaymentRepository();

  // Initialize services with dependency injection
  const calculationService = new CalculationService(userRepo, eventRepo, costItemRepo, paymentRepo);
  const userService = new UserService(userRepo, calculationService, eventRepo, paymentRepo);
  const eventService = new EventService(eventRepo, userRepo, costItemRepo, paymentRepo, calculationService);
  const costItemService = new CostItemService(costItemRepo, eventRepo, userRepo, calculationService);
  const paymentService = new PaymentService(paymentRepo, userRepo, eventRepo, calculationService);

  // Initialize controllers with service injection
  const userController = new UserController(userService);
  const eventController = new EventController(eventService, costItemService, paymentService);
  const costItemController = new CostItemController(costItemService);
  const paymentController = new PaymentController(paymentService);
  
  // Initialize test controller (only in development/test environments)
  const testController = new TestController({
    userService,
    eventService,
    costItemService,
    paymentService
  });

  // Mount routes
  router.use('/users', createUserRoutes(userController));
  router.use('/events', createEventRoutes(eventController));
  router.use('/cost-items', createCostItemRoutes(costItemController));
  router.use('/payments', createPaymentRoutes(paymentController));
  
  // Mount test routes (only in non-production environments)
  if (process.env.NODE_ENV !== 'production') {
    router.delete('/test/clear-data', testController.clearAllData.bind(testController));
    router.get('/test/stats', testController.getTestStats.bind(testController));
    router.get('/test/health', testController.healthCheck.bind(testController));
  }

  // API information endpoint
  router.get('/', (req, res) => {
    res.json({
      name: 'Badminton Cost Splitter API',
      version: '1.0.0',
      description: 'REST API for managing badminton session expenses and cost splitting',
      endpoints: {
        users: '/api/users',
        events: '/api/events',
        costItems: '/api/cost-items',
        payments: '/api/payments'
      },
      features: [
        'User management with balance tracking',
        'Event organization and participant management',
        'Flexible cost splitting with custom percentages',
        'Payment processing and settlement suggestions',
        'Comprehensive analytics and reporting'
      ],
      documentation: 'See README.md for detailed API documentation'
    });
  });

  // Health check for API
  router.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        calculation: 'active',
        user: 'active',
        event: 'active',
        costItem: 'active',
        payment: 'active'
      },
      repositories: {
        user: userRepo.count() + ' records',
        event: eventRepo.count() + ' records',
        costItem: costItemRepo.count() + ' records',
        payment: paymentRepo.count() + ' records'
      }
    });
  });

  return router;
}

module.exports = createApiRoutes;