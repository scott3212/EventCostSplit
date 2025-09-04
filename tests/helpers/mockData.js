const { v4: uuidv4 } = require('uuid');

/**
 * Mock data generator for tests
 * Provides realistic test data following our models
 */

// Fixed UUIDs for predictable testing
const FIXED_UUIDS = {
  USER_1: '550e8400-e29b-41d4-a716-446655440001',
  USER_2: '550e8400-e29b-41d4-a716-446655440002',  
  USER_3: '550e8400-e29b-41d4-a716-446655440003',
  USER_4: '550e8400-e29b-41d4-a716-446655440004',
  EVENT_1: '660e8400-e29b-41d4-a716-446655440001',
  EVENT_2: '660e8400-e29b-41d4-a716-446655440002',
  COST_ITEM_1: '770e8400-e29b-41d4-a716-446655440001',
  COST_ITEM_2: '770e8400-e29b-41d4-a716-446655440002',
  PAYMENT_1: '880e8400-e29b-41d4-a716-446655440001',
  PAYMENT_2: '880e8400-e29b-41d4-a716-446655440002',
};

/**
 * Generate mock users
 */
function createMockUsers() {
  const baseTime = new Date('2024-01-01T00:00:00.000Z').toISOString();
  
  return [
    {
      id: FIXED_UUIDS.USER_1,
      name: 'Alice Johnson',
      email: 'alice@example.com',
      phone: '+1-555-0101',
      totalBalance: -25.50,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    {
      id: FIXED_UUIDS.USER_2,
      name: 'Bob Smith',
      email: 'bob@example.com',
      phone: '+1-555-0102',
      totalBalance: 15.75,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    {
      id: FIXED_UUIDS.USER_3,
      name: 'Charlie Davis',
      email: null,
      phone: '+1-555-0103',
      totalBalance: 0.00,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    {
      id: FIXED_UUIDS.USER_4,
      name: 'Diana Wilson',
      email: 'diana@example.com',
      phone: null,
      totalBalance: 9.75,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
  ];
}

/**
 * Generate mock events
 */
function createMockEvents() {
  const baseTime = new Date('2024-01-01T00:00:00.000Z').toISOString();
  const eventDate1 = new Date('2024-09-04T18:00:00.000Z').toISOString();
  const eventDate2 = new Date('2024-09-11T18:00:00.000Z').toISOString();
  
  return [
    {
      id: FIXED_UUIDS.EVENT_1,
      name: 'Tuesday Badminton Session',
      date: eventDate1,
      description: 'Weekly badminton at Community Center',
      participants: [FIXED_UUIDS.USER_1, FIXED_UUIDS.USER_2, FIXED_UUIDS.USER_3],
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    {
      id: FIXED_UUIDS.EVENT_2,
      name: 'Saturday Tournament Prep',
      date: eventDate2,
      description: 'Practice session for upcoming tournament',
      participants: [FIXED_UUIDS.USER_1, FIXED_UUIDS.USER_2, FIXED_UUIDS.USER_3, FIXED_UUIDS.USER_4],
      createdAt: baseTime,
      updatedAt: baseTime,
    },
  ];
}

/**
 * Generate mock cost items
 */
function createMockCostItems() {
  const baseTime = new Date('2024-01-01T00:00:00.000Z').toISOString();
  const itemDate1 = new Date('2024-09-04T18:00:00.000Z').toISOString();
  const itemDate2 = new Date('2024-09-04T18:30:00.000Z').toISOString();
  
  return [
    {
      id: FIXED_UUIDS.COST_ITEM_1,
      eventId: FIXED_UUIDS.EVENT_1,
      description: 'Court Rental',
      amount: 60.00,
      paidBy: FIXED_UUIDS.USER_1,
      date: itemDate1,
      splitPercentage: {
        [FIXED_UUIDS.USER_1]: 33.33,
        [FIXED_UUIDS.USER_2]: 33.33,
        [FIXED_UUIDS.USER_3]: 33.34,
      },
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    {
      id: FIXED_UUIDS.COST_ITEM_2,
      eventId: FIXED_UUIDS.EVENT_1,
      description: 'Shuttlecocks',
      amount: 24.00,
      paidBy: FIXED_UUIDS.USER_2,
      date: itemDate2,
      splitPercentage: {
        [FIXED_UUIDS.USER_1]: 50.00,
        [FIXED_UUIDS.USER_2]: 50.00,
        [FIXED_UUIDS.USER_3]: 0.00, // Charlie excluded
      },
      createdAt: baseTime,
      updatedAt: baseTime,
    },
  ];
}

/**
 * Generate mock payments
 */
function createMockPayments() {
  const baseTime = new Date('2024-01-01T00:00:00.000Z').toISOString();
  const paymentDate1 = new Date('2024-09-05T10:00:00.000Z').toISOString();
  const paymentDate2 = new Date('2024-09-01T15:00:00.000Z').toISOString();
  
  return [
    {
      id: FIXED_UUIDS.PAYMENT_1,
      userId: FIXED_UUIDS.USER_3,
      amount: 20.17,
      date: paymentDate1,
      description: 'Payment for Tuesday badminton session',
      relatedEventId: FIXED_UUIDS.EVENT_1,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    {
      id: FIXED_UUIDS.PAYMENT_2,
      userId: FIXED_UUIDS.USER_4,
      amount: 50.00,
      date: paymentDate2,
      description: 'Advance payment for future events',
      relatedEventId: null,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
  ];
}

/**
 * Create minimal valid user data for testing
 */
function createValidUserData(overrides = {}) {
  return {
    name: 'Test User',
    email: 'test@example.com',
    phone: '+1-555-0123',
    totalBalance: 0,
    ...overrides,
  };
}

/**
 * Create minimal valid event data for testing
 */
function createValidEventData(overrides = {}) {
  return {
    name: 'Test Event',
    date: new Date('2024-12-01T18:00:00.000Z').toISOString(),
    description: 'Test badminton session',
    participants: [FIXED_UUIDS.USER_1, FIXED_UUIDS.USER_2],
    ...overrides,
  };
}

/**
 * Create minimal valid cost item data for testing
 */
function createValidCostItemData(overrides = {}) {
  return {
    eventId: FIXED_UUIDS.EVENT_1,
    description: 'Test Expense',
    amount: 30.00,
    paidBy: FIXED_UUIDS.USER_1,
    date: new Date().toISOString(),
    splitPercentage: {
      [FIXED_UUIDS.USER_1]: 50.00,
      [FIXED_UUIDS.USER_2]: 50.00,
    },
    ...overrides,
  };
}

/**
 * Create minimal valid payment data for testing
 */
function createValidPaymentData(overrides = {}) {
  return {
    userId: FIXED_UUIDS.USER_1,
    amount: 25.00,
    date: new Date().toISOString(),
    description: 'Test payment',
    relatedEventId: null,
    ...overrides,
  };
}

/**
 * Generate invalid data for negative testing
 */
const INVALID_DATA = {
  user: {
    emptyName: { name: '' },
    shortName: { name: 'A' },
    longName: { name: 'A'.repeat(101) },
    invalidEmail: { name: 'Test', email: 'invalid-email' },
    invalidPhone: { name: 'Test', phone: '123' },
  },
  
  event: {
    emptyName: { name: '' },
    shortName: { name: 'AB' },
    longName: { name: 'A'.repeat(201) },
    invalidDate: { name: 'Test', date: 'invalid-date' },
    emptyParticipants: { name: 'Test', date: new Date().toISOString(), participants: [] },
    invalidParticipants: { name: 'Test', date: new Date().toISOString(), participants: ['invalid-uuid'] },
  },
  
  costItem: {
    emptyDescription: { description: '' },
    shortDescription: { description: 'AB' },
    zeroAmount: { description: 'Test', amount: 0 },
    negativeAmount: { description: 'Test', amount: -10 },
    invalidAmount: { description: 'Test', amount: 'not-a-number' },
    invalidSplit: { description: 'Test', amount: 10, splitPercentage: { 'user1': 60, 'user2': 30 } }, // Not 100%
  },
  
  payment: {
    zeroAmount: { amount: 0 },
    negativeAmount: { amount: -10 },
    invalidAmount: { amount: 'not-a-number' },
    invalidDate: { amount: 10, date: 'invalid-date' },
    invalidUserId: { amount: 10, userId: 'invalid-uuid' },
  },
};

/**
 * Create test database state
 */
function createTestDatabaseState() {
  return {
    users: createMockUsers(),
    events: createMockEvents(), 
    costItems: createMockCostItems(),
    payments: createMockPayments(),
  };
}

/**
 * Generate a fresh UUID for testing
 */
function generateTestUUID() {
  return uuidv4();
}

/**
 * Create date strings for testing
 */
function createTestDates() {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  return {
    now: now.toISOString(),
    yesterday: yesterday.toISOString(),
    tomorrow: tomorrow.toISOString(),
    past: new Date('2024-01-01').toISOString(),
    future: new Date('2024-12-31').toISOString(),
  };
}

module.exports = {
  FIXED_UUIDS,
  createMockUsers,
  createMockEvents,
  createMockCostItems,
  createMockPayments,
  createValidUserData,
  createValidEventData,
  createValidCostItemData,
  createValidPaymentData,
  INVALID_DATA,
  createTestDatabaseState,
  generateTestUUID,
  createTestDates,
};