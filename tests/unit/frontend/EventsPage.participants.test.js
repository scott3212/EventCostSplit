const EventsPage = require('../../../public/js/pages/events.js');

// Mock DOM and globals
const mockApiClient = {
    getEvents: jest.fn(),
    getUsers: jest.fn(),
    createEvent: jest.fn()
};

global.api = mockApiClient;
global.showError = jest.fn();
global.showSuccess = jest.fn();
global.formatCurrency = jest.fn((amount) => `$${amount.toFixed(2)}`);

// Mock DOM elements and create more sophisticated mocks for participant testing
const mockElements = {};
const createElement = (id, tag = 'div') => {
    const element = {
        id,
        tagName: tag.toUpperCase(),
        style: {},
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn(() => false)
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        click: jest.fn(),
        focus: jest.fn(),
        blur: jest.fn(),
        value: '',
        textContent: '',
        innerHTML: '',
        checked: false,
        disabled: false,
        dataset: {},
        querySelector: jest.fn((selector) => {
            if (selector === '.participant-checkbox') {
                return { checked: false };
            }
            if (selector === '.remove-btn') {
                return { addEventListener: jest.fn() };
            }
            return null;
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector === '.participant-item') {
                return mockParticipantItems;
            }
            if (selector === '.remove-btn') {
                return mockRemoveButtons;
            }
            return [];
        }),
        closest: jest.fn((selector) => {
            if (selector === '.selected-participant') {
                return { dataset: { userId: 'user1' } };
            }
            return null;
        }),
        reset: jest.fn()
    };
    mockElements[id] = element;
    return element;
};

// Mock participant items and remove buttons for testing
let mockParticipantItems = [];
let mockRemoveButtons = [];

global.document = {
    getElementById: jest.fn((id) => mockElements[id] || null),
    querySelector: jest.fn((selector) => {
        if (selector.includes('[data-user-id=')) {
            const userId = selector.match(/data-user-id="([^"]+)"/)?.[1];
            return mockParticipantItems.find(item => item.dataset.userId === userId) || null;
        }
        return null;
    }),
    querySelectorAll: jest.fn((selector) => {
        if (selector === '.participant-item') {
            return mockParticipantItems;
        }
        if (selector === '.remove-btn') {
            return mockRemoveButtons;
        }
        return [];
    }),
    addEventListener: jest.fn()
};

describe('EventsPage - Participant Selection', () => {
    let eventsPage;
    const mockUsers = [
        {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            totalBalance: 25.50
        },
        {
            id: 'user2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            phone: '+1234567890',
            totalBalance: -15.75
        },
        {
            id: 'user3',
            name: 'Bob Johnson',
            email: 'bob@example.com',
            totalBalance: 0
        }
    ];

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Reset mock arrays
        mockParticipantItems = [];
        mockRemoveButtons = [];
        
        // Create mock elements
        createElement('events-loading');
        createElement('events-list');
        createElement('events-empty');
        createElement('total-events-count');
        createElement('add-event-btn', 'button');
        createElement('add-event-modal');
        createElement('add-event-form', 'form');
        createElement('add-event-close', 'button');
        createElement('add-event-cancel', 'button');
        createElement('add-event-save', 'button');
        createElement('add-event-spinner');
        createElement('add-event-save-text');
        createElement('event-name', 'input');
        createElement('event-date', 'input');
        createElement('event-location', 'input');
        createElement('event-description', 'textarea');
        createElement('event-name-error');
        createElement('event-date-error');
        createElement('event-location-error');
        createElement('participants-loading');
        createElement('participants-list');
        createElement('participants-error');
        createElement('selected-participants');
        createElement('selected-participants-list');

        // Mock API responses
        mockApiClient.getEvents.mockResolvedValue({
            success: true,
            data: [],
            count: 0
        });

        mockApiClient.getUsers.mockResolvedValue({
            success: true,
            data: mockUsers
        });

        eventsPage = new EventsPage();
    });

    describe('Participant Rendering', () => {
        test('should render participants list correctly', () => {
            eventsPage.users = mockUsers;
            eventsPage.renderParticipants(mockUsers);

            expect(mockElements['participants-list'].innerHTML).toContain('John Doe');
            expect(mockElements['participants-list'].innerHTML).toContain('Jane Smith');
            expect(mockElements['participants-list'].innerHTML).toContain('Bob Johnson');
            expect(mockElements['participants-list'].style.display).toBe('block');
        });

        test('should show error when no users available', () => {
            eventsPage.renderParticipants([]);

            expect(mockElements['participants-error'].textContent).toBe('No users found. Please create users first.');
            expect(mockElements['participants-error'].style.display).toBe('block');
        });

        test('should create participant item with correct balance status', () => {
            const userWithCredit = mockUsers[0]; // John Doe with positive balance
            const html = eventsPage.createParticipantItem(userWithCredit);

            expect(html).toContain('John Doe');
            expect(html).toContain('john@example.com');
            expect(html).toContain('data-user-id="user1"');
            expect(html).toContain('balance-owed'); // positive balance = credit
            expect(html).toContain('$25.50');
        });

        test('should create participant item for user who owes money', () => {
            const userWithDebt = mockUsers[1]; // Jane Smith with negative balance
            const html = eventsPage.createParticipantItem(userWithDebt);

            expect(html).toContain('Jane Smith');
            expect(html).toContain('jane@example.com');
            expect(html).toContain('+1234567890');
            expect(html).toContain('balance-owes'); // negative balance = owes
            expect(html).toContain('$-15.75');
        });

        test('should create participant item for settled user', () => {
            const settledUser = mockUsers[2]; // Bob Johnson with zero balance
            const html = eventsPage.createParticipantItem(settledUser);

            expect(html).toContain('Bob Johnson');
            expect(html).toContain('balance-settled'); // zero balance = settled
            expect(html).toContain('$0.00');
        });

        test('should show selected state for pre-selected participants', () => {
            eventsPage.selectedParticipants.add('user1');
            const html = eventsPage.createParticipantItem(mockUsers[0]);

            expect(html).toContain('selected');
            expect(html).toContain('checked');
        });
    });

    describe('Participant Selection Logic', () => {
        test('should add participant to selection', () => {
            expect(eventsPage.selectedParticipants.size).toBe(0);
            
            // Simulate selecting a participant
            eventsPage.selectedParticipants.add('user1');
            
            expect(eventsPage.selectedParticipants.has('user1')).toBe(true);
            expect(eventsPage.selectedParticipants.size).toBe(1);
        });

        test('should remove participant from selection', () => {
            eventsPage.selectedParticipants.add('user1');
            eventsPage.selectedParticipants.add('user2');
            expect(eventsPage.selectedParticipants.size).toBe(2);
            
            eventsPage.selectedParticipants.delete('user1');
            
            expect(eventsPage.selectedParticipants.has('user1')).toBe(false);
            expect(eventsPage.selectedParticipants.has('user2')).toBe(true);
            expect(eventsPage.selectedParticipants.size).toBe(1);
        });

        test('should toggle participant selection', () => {
            // Initially not selected
            expect(eventsPage.selectedParticipants.has('user1')).toBe(false);
            
            // Select
            eventsPage.selectedParticipants.add('user1');
            expect(eventsPage.selectedParticipants.has('user1')).toBe(true);
            
            // Deselect
            eventsPage.selectedParticipants.delete('user1');
            expect(eventsPage.selectedParticipants.has('user1')).toBe(false);
        });
    });

    describe('Selected Participants Display', () => {
        beforeEach(() => {
            eventsPage.users = mockUsers;
        });

        test('should hide selected participants section when none selected', () => {
            eventsPage.selectedParticipants.clear();
            eventsPage.updateSelectedParticipantsDisplay();

            expect(mockElements['selected-participants'].style.display).toBe('none');
        });

        test('should show selected participants', () => {
            eventsPage.selectedParticipants.add('user1');
            eventsPage.selectedParticipants.add('user2');
            
            eventsPage.updateSelectedParticipantsDisplay();

            expect(mockElements['selected-participants'].style.display).toBe('block');
            expect(mockElements['selected-participants-list'].innerHTML).toContain('John Doe');
            expect(mockElements['selected-participants-list'].innerHTML).toContain('Jane Smith');
        });

        test('should create selected participant pills with remove buttons', () => {
            eventsPage.selectedParticipants.add('user1');
            
            eventsPage.updateSelectedParticipantsDisplay();

            const html = mockElements['selected-participants-list'].innerHTML;
            expect(html).toContain('selected-participant');
            expect(html).toContain('data-user-id="user1"');
            expect(html).toContain('John Doe');
            expect(html).toContain('remove-btn');
            expect(html).toContain('×');
        });

        test('should filter out invalid user IDs', () => {
            eventsPage.selectedParticipants.add('user1');
            eventsPage.selectedParticipants.add('invalid-user-id');
            
            eventsPage.updateSelectedParticipantsDisplay();

            // Should only show the valid user
            const html = mockElements['selected-participants-list'].innerHTML;
            expect(html).toContain('John Doe');
            expect(html).not.toContain('invalid-user-id');
        });
    });

    describe('Participant Selection Validation', () => {
        test('should require at least one participant', () => {
            eventsPage.selectedParticipants.clear();
            
            const isValid = eventsPage.validateParticipants();
            
            expect(isValid).toBe(false);
            expect(mockElements['participants-error'].textContent).toBe('Please select at least one participant');
            expect(mockElements['participants-error'].style.display).toBe('block');
        });

        test('should pass validation with participants selected', () => {
            eventsPage.selectedParticipants.add('user1');
            eventsPage.selectedParticipants.add('user2');
            
            const isValid = eventsPage.validateParticipants();
            
            expect(isValid).toBe(true);
            expect(mockElements['participants-error'].style.display).toBe('none');
        });
    });

    describe('User Balance Status Helper', () => {
        test('should return correct status for positive balance (credit)', () => {
            const status = eventsPage.getUserBalanceStatus(25.50);
            
            expect(status).toEqual({
                class: 'balance-owed',
                text: 'Credit'
            });
        });

        test('should return correct status for negative balance (owes)', () => {
            const status = eventsPage.getUserBalanceStatus(-15.75);
            
            expect(status).toEqual({
                class: 'balance-owes',
                text: 'Owes'
            });
        });

        test('should return correct status for zero balance (settled)', () => {
            const status = eventsPage.getUserBalanceStatus(0);
            
            expect(status).toEqual({
                class: 'balance-settled',
                text: 'Settled'
            });
        });

        test('should handle very small positive balances as credit', () => {
            const status = eventsPage.getUserBalanceStatus(0.01);
            
            expect(status).toEqual({
                class: 'balance-owed',
                text: 'Credit'
            });
        });

        test('should handle very small negative balances as owes', () => {
            const status = eventsPage.getUserBalanceStatus(-0.01);
            
            expect(status).toEqual({
                class: 'balance-owes',
                text: 'Owes'
            });
        });
    });

    describe('Participant Loading States', () => {
        test('should show loading state during participant load', async () => {
            // Make API call hang to test loading state
            let resolveUsers;
            const userPromise = new Promise(resolve => {
                resolveUsers = resolve;
            });
            mockApiClient.getUsers.mockReturnValue(userPromise);

            const loadPromise = eventsPage.loadParticipants();

            // Check loading state is shown
            expect(mockElements['participants-loading'].style.display).toBe('block');
            expect(mockElements['participants-list'].style.display).toBe('none');

            // Resolve the promise
            resolveUsers({ success: true, data: mockUsers });
            await loadPromise;

            // Check loading state is hidden
            expect(mockElements['participants-loading'].style.display).toBe('none');
        });

        test('should handle empty user list', () => {
            eventsPage.renderParticipants([]);

            expect(mockElements['participants-error'].textContent).toBe('No users found. Please create users first.');
            expect(mockElements['participants-error'].style.display).toBe('block');
        });
    });

    describe('Integration with Form State', () => {
        test('should clear participant validation errors when participants selected', () => {
            // Set up initial error state
            eventsPage.showError('participants', 'Please select at least one participant');
            expect(mockElements['participants-error'].style.display).toBe('block');

            // Select a participant (simulating the clearError call in bindParticipantEvents)
            eventsPage.selectedParticipants.add('user1');
            eventsPage.clearError('participants');

            expect(mockElements['participants-error'].style.display).toBe('none');
        });

        test('should reset participant selection on form reset', () => {
            eventsPage.selectedParticipants.add('user1');
            eventsPage.selectedParticipants.add('user2');
            expect(eventsPage.selectedParticipants.size).toBe(2);

            eventsPage.resetAddEventForm();

            expect(eventsPage.selectedParticipants.size).toBe(0);
        });
    });
});