const request = require('supertest');
const createApp = require('../../src/app');

/**
 * API test helper utilities
 * Provides common testing patterns and assertions
 */

class APITestHelper {
  constructor() {
    this.app = createApp();
  }

  /**
   * Make GET request with common assertions
   */
  async get(path, expectedStatus = 200) {
    const response = await request(this.app)
      .get(path)
      .expect('Content-Type', /json/)
      .expect(expectedStatus);
    
    return this.parseResponse(response);
  }

  /**
   * Make POST request with common assertions
   */
  async post(path, data, expectedStatus = 201) {
    const response = await request(this.app)
      .post(path)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(expectedStatus);
    
    return this.parseResponse(response);
  }

  /**
   * Make PUT request with common assertions
   */
  async put(path, data, expectedStatus = 200) {
    const response = await request(this.app)
      .put(path)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(expectedStatus);
    
    return this.parseResponse(response);
  }

  /**
   * Make PATCH request with common assertions
   */
  async patch(path, data, expectedStatus = 200) {
    const response = await request(this.app)
      .patch(path)
      .send(data)
      .expect('Content-Type', /json/)
      .expect(expectedStatus);
    
    return this.parseResponse(response);
  }

  /**
   * Make DELETE request with common assertions
   */
  async delete(path, expectedStatus = 204) {
    const response = await request(this.app)
      .delete(path)
      .expect(expectedStatus);
    
    if (expectedStatus === 204) {
      return { success: true };
    }
    
    return this.parseResponse(response);
  }

  /**
   * Parse and validate response structure
   */
  parseResponse(response) {
    const body = response.body;
    
    // Validate response structure
    expect(body).toHaveProperty('success');
    expect(body).toHaveProperty('timestamp');
    
    if (body.success) {
      expect(body).toHaveProperty('message');
      return {
        success: body.success,
        message: body.message,
        data: body.data || null,
        timestamp: body.timestamp,
      };
    } else {
      expect(body).toHaveProperty('error');
      expect(body.error).toHaveProperty('message');
      return {
        success: body.success,
        error: body.error,
        timestamp: body.timestamp,
      };
    }
  }

  /**
   * Test successful response structure
   */
  expectSuccessResponse(response, expectedData = null) {
    expect(response.success).toBe(true);
    expect(response.message).toBeDefined();
    expect(response.timestamp).toBeDefined();
    
    if (expectedData) {
      expect(response.data).toEqual(expect.objectContaining(expectedData));
    }
  }

  /**
   * Test error response structure
   */
  expectErrorResponse(response, expectedMessage = null, expectedField = null) {
    expect(response.success).toBe(false);
    expect(response.error).toBeDefined();
    expect(response.error.message).toBeDefined();
    expect(response.timestamp).toBeDefined();
    
    if (expectedMessage) {
      expect(response.error.message).toContain(expectedMessage);
    }
    
    if (expectedField) {
      expect(response.error.field).toBe(expectedField);
    }
  }

  /**
   * Test validation error response
   */
  expectValidationError(response, field = null) {
    this.expectErrorResponse(response, 'validation failed', field);
  }

  /**
   * Test not found error response
   */
  expectNotFoundError(response) {
    this.expectErrorResponse(response, 'not found');
  }

  /**
   * Test pagination response structure
   */
  expectPaginatedResponse(response, expectedItemCount = null) {
    this.expectSuccessResponse(response);
    
    expect(response.data).toHaveProperty('data');
    expect(response.data).toHaveProperty('pagination');
    expect(Array.isArray(response.data.data)).toBe(true);
    
    const pagination = response.data.pagination;
    expect(pagination).toHaveProperty('page');
    expect(pagination).toHaveProperty('limit');
    expect(pagination).toHaveProperty('total');
    expect(pagination).toHaveProperty('totalPages');
    expect(pagination).toHaveProperty('hasNext');
    expect(pagination).toHaveProperty('hasPrev');
    
    if (expectedItemCount !== null) {
      expect(response.data.data).toHaveLength(expectedItemCount);
    }
  }

  /**
   * Test array response structure
   */
  expectArrayResponse(response, expectedLength = null) {
    this.expectSuccessResponse(response);
    expect(Array.isArray(response.data)).toBe(true);
    
    if (expectedLength !== null) {
      expect(response.data).toHaveLength(expectedLength);
    }
  }

  /**
   * Test object response structure with required fields
   */
  expectObjectResponse(response, requiredFields = []) {
    this.expectSuccessResponse(response);
    expect(typeof response.data).toBe('object');
    expect(response.data).not.toBeNull();
    
    requiredFields.forEach(field => {
      expect(response.data).toHaveProperty(field);
    });
  }

  /**
   * Create user via API (helper for tests)
   */
  async createTestUser(userData = {}) {
    const defaultUser = {
      name: 'Test User',
      email: 'test@example.com',
      phone: '+1-555-0123',
      ...userData,
    };
    
    const response = await this.post('/api/users', defaultUser);
    return response.data;
  }

  /**
   * Create event via API (helper for tests)
   */
  async createTestEvent(eventData = {}, participantIds = []) {
    const defaultEvent = {
      name: 'Test Event',
      date: new Date('2024-12-01T18:00:00.000Z').toISOString(),
      description: 'Test badminton session',
      participants: participantIds,
      ...eventData,
    };
    
    const response = await this.post('/api/events', defaultEvent);
    return response.data;
  }

  /**
   * Create cost item via API (helper for tests)
   */
  async createTestCostItem(costItemData = {}) {
    const defaultCostItem = {
      description: 'Test Expense',
      amount: 30.00,
      date: new Date().toISOString(),
      splitPercentage: { 'user1': 50.00, 'user2': 50.00 },
      ...costItemData,
    };
    
    const response = await this.post('/api/cost-items', defaultCostItem);
    return response.data;
  }

  /**
   * Create payment via API (helper for tests)
   */
  async createTestPayment(paymentData = {}) {
    const defaultPayment = {
      amount: 25.00,
      date: new Date().toISOString(),
      description: 'Test payment',
      ...paymentData,
    };
    
    const response = await this.post('/api/payments', defaultPayment);
    return response.data;
  }

  /**
   * Setup test data (users, events, etc.)
   */
  async setupTestData() {
    // Create test users
    const user1 = await this.createTestUser({
      name: 'Alice Test',
      email: 'alice.test@example.com',
    });
    
    const user2 = await this.createTestUser({
      name: 'Bob Test', 
      email: 'bob.test@example.com',
    });
    
    // Create test event with participants
    const event = await this.createTestEvent(
      { name: 'Test Badminton Session' },
      [user1.id, user2.id]
    );
    
    return { user1, user2, event };
  }

  /**
   * Clean up test data (if needed)
   */
  async cleanupTestData() {
    // Implementation depends on whether we add cleanup endpoints
    // For now, tests should use isolated data directories
  }
}

/**
 * Common test assertions for model objects
 */
const ModelAssertions = {
  /**
   * Assert user object structure
   */
  assertUserStructure(user) {
    expect(user).toHaveProperty('id');
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('totalBalance');
    expect(user).toHaveProperty('createdAt');
    expect(user).toHaveProperty('updatedAt');
    
    expect(typeof user.id).toBe('string');
    expect(typeof user.name).toBe('string');
    expect(typeof user.totalBalance).toBe('number');
    expect(user.name.length).toBeGreaterThan(0);
  },

  /**
   * Assert event object structure
   */
  assertEventStructure(event) {
    expect(event).toHaveProperty('id');
    expect(event).toHaveProperty('name');
    expect(event).toHaveProperty('date');
    expect(event).toHaveProperty('participants');
    expect(event).toHaveProperty('participantCount');
    expect(event).toHaveProperty('createdAt');
    expect(event).toHaveProperty('updatedAt');
    
    expect(typeof event.id).toBe('string');
    expect(typeof event.name).toBe('string');
    expect(Array.isArray(event.participants)).toBe(true);
    expect(typeof event.participantCount).toBe('number');
  },

  /**
   * Assert cost item object structure
   */
  assertCostItemStructure(costItem) {
    expect(costItem).toHaveProperty('id');
    expect(costItem).toHaveProperty('eventId');
    expect(costItem).toHaveProperty('description');
    expect(costItem).toHaveProperty('amount');
    expect(costItem).toHaveProperty('paidBy');
    expect(costItem).toHaveProperty('splitPercentage');
    expect(costItem).toHaveProperty('participantCount');
    expect(costItem).toHaveProperty('createdAt');
    expect(costItem).toHaveProperty('updatedAt');
    
    expect(typeof costItem.id).toBe('string');
    expect(typeof costItem.eventId).toBe('string');
    expect(typeof costItem.amount).toBe('number');
    expect(costItem.amount).toBeGreaterThan(0);
  },

  /**
   * Assert payment object structure
   */
  assertPaymentStructure(payment) {
    expect(payment).toHaveProperty('id');
    expect(payment).toHaveProperty('userId');
    expect(payment).toHaveProperty('amount');
    expect(payment).toHaveProperty('date');
    expect(payment).toHaveProperty('createdAt');
    expect(payment).toHaveProperty('updatedAt');
    
    expect(typeof payment.id).toBe('string');
    expect(typeof payment.userId).toBe('string');
    expect(typeof payment.amount).toBe('number');
    expect(payment.amount).toBeGreaterThan(0);
  },
};

module.exports = {
  APITestHelper,
  ModelAssertions,
};