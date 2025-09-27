const request = require('supertest');
const { app } = require('../../src/app');
const { APITestHelper } = require('../helpers/apiHelper');

describe('Event-Specific Balance Display Integration', () => {
  let apiHelper;
  let testUsers = [];
  let testEvent = null;
  let testExpenses = [];

  beforeAll(async () => {
    apiHelper = new APITestHelper();

    // Clear existing test data
    await request(app).delete('/api/test/clear-data').expect(200);

    // Create test users
    testUsers = await Promise.all([
      apiHelper.createTestUser({
        name: 'Alice Test',
        email: 'alice@integration.test',
        phone: '+1111111111'
      }),
      apiHelper.createTestUser({
        name: 'Bob Test',
        email: 'bob@integration.test',
        phone: '+2222222222'
      }),
      apiHelper.createTestUser({
        name: 'Charlie Test',
        email: 'charlie@integration.test',
        phone: '+3333333333'
      })
    ]);

    // Create test event with all participants
    testEvent = await apiHelper.createTestEvent({
      name: 'Integration Test Event',
      date: '2025-12-25',
      location: 'Test Venue',
      description: 'Event for testing balance display integration'
    }, testUsers.map(u => u.id));
  });

  afterAll(async () => {
    await request(app).delete('/api/test/clear-data').expect(200);
  });

  describe('Event Balance Calculation and API Response', () => {
    test('should return correct event-specific balances for participants', async () => {
      // Add expense: Alice pays $60, split equally among Alice, Bob, Charlie
      const expenseResponse = await request(app).post('/api/cost-items').send({
        eventId: testEvent.id,
        description: 'Court Rental',
        amount: 60,
        paidBy: testUsers[0].id, // Alice
        date: '2025-12-25',
        splitPercentage: {
          [testUsers[0].id]: 33.33, // Alice
          [testUsers[1].id]: 33.33, // Bob
          [testUsers[2].id]: 33.34  // Charlie (rounding adjustment)
        }
      });

      expect(expenseResponse.status).toBe(201);
      testExpenses.push(expenseResponse.body.data);

      // Get event balance
      const balanceResponse = await request(app)
        .get(`/api/events/${testEvent.id}/balance`)
        .expect(200);

      const balanceData = balanceResponse.body.data;

      // Verify event-specific balance structure
      expect(balanceData).toHaveProperty('eventId', testEvent.id);
      expect(balanceData).toHaveProperty('eventName', testEvent.name);
      expect(balanceData).toHaveProperty('userBalances');
      expect(balanceData).toHaveProperty('totalCosts', 60.00);

      // Verify individual user balances for this event only
      const aliceBalance = balanceData.userBalances[testUsers[0].id];
      const bobBalance = balanceData.userBalances[testUsers[1].id];
      const charlieBalance = balanceData.userBalances[testUsers[2].id];

      // Alice: paid $60, owes $33.33, net = +$26.67
      expect(aliceBalance.paid).toBe(60.00);
      expect(aliceBalance.owes).toBe(33.33);
      expect(aliceBalance.net).toBeCloseTo(26.67, 2);

      // Bob: paid $0, owes $33.33, net = -$33.33
      expect(bobBalance.paid).toBe(0.00);
      expect(bobBalance.owes).toBe(33.33);
      expect(bobBalance.net).toBeCloseTo(-33.33, 2);

      // Charlie: paid $0, owes $33.34, net = -$33.34
      expect(charlieBalance.paid).toBe(0.00);
      expect(charlieBalance.owes).toBe(33.34);
      expect(charlieBalance.net).toBeCloseTo(-33.34, 2);
    });

    test('should handle complex multi-expense scenarios', async () => {
      // Add second expense: Bob pays $30, split between Bob and Charlie only
      const expense2Response = await request(app).post('/api/cost-items').send({
        eventId: testEvent.id,
        description: 'Shuttlecocks',
        amount: 30,
        paidBy: testUsers[1].id, // Bob
        date: '2025-12-25',
        splitPercentage: {
          [testUsers[0].id]: 0,    // Alice excluded
          [testUsers[1].id]: 50,   // Bob
          [testUsers[2].id]: 50    // Charlie
        }
      });

      expect(expense2Response.status).toBe(201);

      // Get updated event balance
      const balanceResponse = await request(app)
        .get(`/api/events/${testEvent.id}/balance`)
        .expect(200);

      const balanceData = balanceResponse.body.data;
      expect(balanceData.totalCosts).toBe(90.00); // $60 + $30

      // Verify updated balances
      const aliceBalance = balanceData.userBalances[testUsers[0].id];
      const bobBalance = balanceData.userBalances[testUsers[1].id];
      const charlieBalance = balanceData.userBalances[testUsers[2].id];

      // Alice: paid $60, owes $33.33 (from first expense only), net = +$26.67
      expect(aliceBalance.paid).toBe(60.00);
      expect(aliceBalance.owes).toBe(33.33);
      expect(aliceBalance.net).toBeCloseTo(26.67, 2);

      // Bob: paid $90 ($60 + $30), owes $48.33 ($33.33 + $15), net = +$41.67
      expect(bobBalance.paid).toBe(90.00);
      expect(bobBalance.owes).toBeCloseTo(48.33, 2);
      expect(bobBalance.net).toBeCloseTo(41.67, 2);

      // Charlie: paid $0, owes $48.34 ($33.34 + $15), net = -$48.34
      expect(charlieBalance.paid).toBe(0.00);
      expect(charlieBalance.owes).toBeCloseTo(48.34, 2);
      expect(charlieBalance.net).toBeCloseTo(-48.34, 2);
    });
  });

  describe('Event Participants API Integration', () => {
    test('should return participants with event context data', async () => {
      const participantsResponse = await request(app)
        .get(`/api/events/${testEvent.id}/participants`)
        .expect(200);

      const participants = participantsResponse.body.data;

      expect(participants).toHaveLength(3);
      expect(participants.every(p => testUsers.some(u => u.id === p.id))).toBe(true);

      // Verify participant data structure
      participants.forEach(participant => {
        expect(participant).toHaveProperty('id');
        expect(participant).toHaveProperty('name');
        expect(participant).toHaveProperty('email');
        expect(participant).toHaveProperty('phone');
      });
    });
  });

  describe('Data Consistency Between APIs', () => {
    test('should maintain consistency between balance and participant APIs', async () => {
      // Get both balance and participant data
      const [balanceResponse, participantsResponse] = await Promise.all([
        request(app).get(`/api/events/${testEvent.id}/balance`),
        request(app).get(`/api/events/${testEvent.id}/participants`)
      ]);

      const balanceData = balanceResponse.body.data;
      const participants = participantsResponse.body.data;

      // Every participant should have balance data
      participants.forEach(participant => {
        expect(balanceData.userBalances).toHaveProperty(participant.id);

        const balance = balanceData.userBalances[participant.id];
        expect(balance).toHaveProperty('owes');
        expect(balance).toHaveProperty('paid');
        expect(balance).toHaveProperty('net');
        expect(typeof balance.owes).toBe('number');
        expect(typeof balance.paid).toBe('number');
        expect(typeof balance.net).toBe('number');
      });

      // Every balance entry should correspond to an event participant
      Object.keys(balanceData.userBalances).forEach(userId => {
        expect(participants.some(p => p.id === userId)).toBe(true);
      });
    });

    test('should update balances when expenses change', async () => {
      // Get initial balance
      const initialResponse = await request(app)
        .get(`/api/events/${testEvent.id}/balance`)
        .expect(200);

      const initialAliceBalance = initialResponse.body.data.userBalances[testUsers[0].id].net;

      // Add payment by Alice
      await request(app).post('/api/payments').send({
        userId: testUsers[0].id,
        amount: 10.00,
        description: 'Additional payment',
        date: '2025-12-25',
        eventId: testEvent.id,
        type: 'settlement'
      });

      // Get updated balance
      const updatedResponse = await request(app)
        .get(`/api/events/${testEvent.id}/balance`)
        .expect(200);

      const updatedAliceBalance = updatedResponse.body.data.userBalances[testUsers[0].id].net;

      // Alice's net balance should increase by $10
      expect(updatedAliceBalance).toBeCloseTo(initialAliceBalance + 10.00, 2);
    });
  });

  describe('Event-Specific vs Global Balance Separation', () => {
    test('should show different balances for same user across different events', async () => {
      // Create second event with different participants
      const event2Response = await request(app).post('/api/events').send({
        name: 'Second Integration Test Event',
        date: '2025-12-26',
        location: 'Test Venue 2',
        description: 'Second event for balance testing',
        participants: [testUsers[0].id, testUsers[1].id] // Alice and Bob only
      });

      const testEvent2 = event2Response.body.data;

      // Add expense to second event: Bob pays $40, split equally with Alice
      await request(app).post('/api/cost-items').send({
        eventId: testEvent2.id,
        description: 'Equipment Rental',
        amount: 40,
        paidBy: testUsers[1].id, // Bob
        date: '2025-12-26',
        splitPercentage: {
          [testUsers[0].id]: 50, // Alice
          [testUsers[1].id]: 50  // Bob
        }
      });

      // Get balances for both events
      const [event1Balance, event2Balance] = await Promise.all([
        request(app).get(`/api/events/${testEvent.id}/balance`),
        request(app).get(`/api/events/${testEvent2.id}/balance`)
      ]);

      // Alice should have different balances in each event
      const aliceEvent1Balance = event1Balance.body.data.userBalances[testUsers[0].id];
      const aliceEvent2Balance = event2Balance.body.data.userBalances[testUsers[0].id];

      // Event 1: Alice has positive balance (~$36.67 after payment)
      expect(aliceEvent1Balance.net).toBeGreaterThan(0);

      // Event 2: Alice has negative balance (-$20, owes $20, paid $0)
      expect(aliceEvent2Balance.net).toBe(-20.00);
      expect(aliceEvent2Balance.owes).toBe(20.00);
      expect(aliceEvent2Balance.paid).toBe(0.00);

      // Balances should be different
      expect(aliceEvent1Balance.net).not.toEqual(aliceEvent2Balance.net);
    });
  });

  describe('Error Handling', () => {
    test('should handle requests for non-existent event', async () => {
      const fakeEventId = '00000000-0000-0000-0000-000000000000';

      const balanceResponse = await request(app)
        .get(`/api/events/${fakeEventId}/balance`)
        .expect(404);

      expect(balanceResponse.body.success).toBe(false);
      expect(balanceResponse.body.error).toContain('Event not found');
    });

    test('should handle events with no expenses', async () => {
      // Create event with no expenses
      const emptyEventResponse = await request(app).post('/api/events').send({
        name: 'Empty Event',
        date: '2025-12-27',
        location: 'Test Venue',
        participants: [testUsers[0].id]
      });

      const emptyEvent = emptyEventResponse.body.data;

      const balanceResponse = await request(app)
        .get(`/api/events/${emptyEvent.id}/balance`)
        .expect(200);

      const balanceData = balanceResponse.body.data;

      expect(balanceData.totalCosts).toBe(0);
      expect(balanceData.totalPayments).toBe(0);
      expect(balanceData.userBalances[testUsers[0].id]).toEqual({
        owes: 0,
        paid: 0,
        net: 0
      });
    });
  });
});