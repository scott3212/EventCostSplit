const { JSDOM } = require('jsdom');
const path = require('path');

// Set up DOM environment
const { window } = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost:3000',
  resources: 'usable'
});

global.window = window;
global.document = window.document;
global.navigator = window.navigator;

// Mock formatCurrency utility
global.formatCurrency = jest.fn((amount, options = {}) => {
  if (options.showSign) {
    return amount >= 0 ? `+$${Math.abs(amount).toFixed(2)}` : `-$${Math.abs(amount).toFixed(2)}`;
  }
  return `$${Math.abs(amount).toFixed(2)}`;
});

// Mock ParticipantComponent
global.ParticipantComponent = {
  createDisplayCard: jest.fn((participant) => `<div class="participant-card">${participant.name}</div>`)
};

// Mock API
global.api = {
  getEventParticipants: jest.fn(),
  getEventBalance: jest.fn(),
  getEventCostItems: jest.fn()
};

// Load the EventDetailPage class
const EventDetailPagePath = path.join(__dirname, '../../../public/js/pages/event-detail.js');
const fs = require('fs');
const EventDetailPageCode = fs.readFileSync(EventDetailPagePath, 'utf8');

// Create a modified version that exports the class
const modifiedCode = EventDetailPageCode.replace(
  'class EventDetailPage {',
  'class EventDetailPage {'
) + '\nmodule.exports = EventDetailPage;';

eval(modifiedCode);
const EventDetailPage = module.exports;

describe('EventDetailPage Participant Balance Display', () => {
  let eventDetailPage;
  let mockElements;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock DOM elements
    mockElements = {
      participantsLoading: { style: { display: 'none' } },
      participantsList: { innerHTML: '' }
    };

    // Mock document.getElementById to return our mock elements
    document.getElementById = jest.fn((id) => mockElements[id] || null);

    // Create EventDetailPage instance
    eventDetailPage = new EventDetailPage();
    eventDetailPage.elements = mockElements;
    eventDetailPage.currentEventId = 'test-event-123';
  });

  describe('Balance Data Processing', () => {
    test('should process event-specific balance data correctly', async () => {
      // Mock API responses
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' },
        { id: 'user2', name: 'Bob Test', email: 'bob@test.com' },
        { id: 'user3', name: 'Charlie Test', email: 'charlie@test.com' }
      ];

      const mockBalanceData = {
        eventId: 'test-event-123',
        userBalances: {
          'user1': { owes: 15.50, paid: 30.00, net: 14.50 },   // Alice has credit
          'user2': { owes: 25.00, paid: 10.00, net: -15.00 },  // Bob owes money
          'user3': { owes: 20.00, paid: 20.00, net: 0.00 }     // Charlie is settled
        }
      };

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue(mockBalanceData);

      // Call loadParticipants
      await eventDetailPage.loadParticipants();

      // Verify participants were processed with event balance data
      expect(eventDetailPage.participants).toHaveLength(3);

      const alice = eventDetailPage.participants.find(p => p.id === 'user1');
      expect(alice.eventBalance).toBe(14.50);
      expect(alice.eventOwes).toBe(15.50);
      expect(alice.eventPaid).toBe(30.00);
      expect(alice.balance).toBe(14.50); // Backward compatibility

      const bob = eventDetailPage.participants.find(p => p.id === 'user2');
      expect(bob.eventBalance).toBe(-15.00);
      expect(bob.eventOwes).toBe(25.00);
      expect(bob.eventPaid).toBe(10.00);

      const charlie = eventDetailPage.participants.find(p => p.id === 'user3');
      expect(charlie.eventBalance).toBe(0.00);
      expect(charlie.eventOwes).toBe(20.00);
      expect(charlie.eventPaid).toBe(20.00);
    });

    test('should handle participants with no event activity', async () => {
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' }
      ];

      const mockBalanceData = {
        eventId: 'test-event-123',
        userBalances: {} // No balance data for user1
      };

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue(mockBalanceData);

      await eventDetailPage.loadParticipants();

      const alice = eventDetailPage.participants.find(p => p.id === 'user1');
      expect(alice.eventBalance).toBe(0);
      expect(alice.eventOwes).toBe(0);
      expect(alice.eventPaid).toBe(0);
      expect(alice.balance).toBe(0);
    });

    test('should maintain backward compatibility with balance field', async () => {
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' }
      ];

      const mockBalanceData = {
        eventId: 'test-event-123',
        userBalances: {
          'user1': { owes: 10.00, paid: 25.00, net: 15.00 }
        }
      };

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue(mockBalanceData);

      await eventDetailPage.loadParticipants();

      const alice = eventDetailPage.participants.find(p => p.id === 'user1');
      // Both eventBalance and balance should have the same value
      expect(alice.eventBalance).toBe(alice.balance);
      expect(alice.balance).toBe(15.00);
    });

    test('should pass event balance context to component', async () => {
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' }
      ];

      const mockBalanceData = {
        eventId: 'test-event-123',
        userBalances: {
          'user1': { owes: 5.00, paid: 15.00, net: 10.00 }
        }
      };

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue(mockBalanceData);

      await eventDetailPage.loadParticipants();

      // Verify ParticipantComponent.createDisplayCard was called with the participant data
      expect(ParticipantComponent.createDisplayCard).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'user1',
          name: 'Alice Test',
          eventBalance: 10.00,
          eventOwes: 5.00,
          eventPaid: 15.00
        })
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      api.getEventParticipants.mockRejectedValue(new Error('API Error'));
      api.getEventBalance.mockRejectedValue(new Error('API Error'));

      // Should not throw
      await expect(eventDetailPage.loadParticipants()).resolves.not.toThrow();

      // Loading should be hidden
      expect(mockElements.participantsLoading.style.display).toBe('none');
    });

    test('should handle missing balance data gracefully', async () => {
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' }
      ];

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue({ userBalances: {} }); // Empty balance data

      await eventDetailPage.loadParticipants();

      const alice = eventDetailPage.participants.find(p => p.id === 'user1');
      expect(alice.eventBalance).toBe(0);
      expect(alice.balance).toBe(0);
    });
  });

  describe('UI State Management', () => {
    test('should show and hide loading state correctly', async () => {
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' }
      ];

      const mockBalanceData = {
        eventId: 'test-event-123',
        userBalances: {
          'user1': { owes: 0, paid: 0, net: 0 }
        }
      };

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue(mockBalanceData);

      const loadPromise = eventDetailPage.loadParticipants();

      // Should show loading initially
      expect(mockElements.participantsLoading.style.display).toBe('block');

      await loadPromise;

      // Should hide loading after completion
      expect(mockElements.participantsLoading.style.display).toBe('none');
    });

    test('should render participants after successful load', async () => {
      const mockParticipants = [
        { id: 'user1', name: 'Alice Test', email: 'alice@test.com' }
      ];

      const mockBalanceData = {
        eventId: 'test-event-123',
        userBalances: {
          'user1': { owes: 10.00, paid: 5.00, net: -5.00 }
        }
      };

      api.getEventParticipants.mockResolvedValue(mockParticipants);
      api.getEventBalance.mockResolvedValue(mockBalanceData);

      await eventDetailPage.loadParticipants();

      // Should have called ParticipantComponent.createDisplayCard
      expect(ParticipantComponent.createDisplayCard).toHaveBeenCalledTimes(1);

      // Should have set participants on the instance
      expect(eventDetailPage.participants).toHaveLength(1);
    });
  });
});