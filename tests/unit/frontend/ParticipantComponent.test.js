// Mock formatCurrency function
global.formatCurrency = jest.fn((amount) => `$${amount.toFixed(2)}`);

// Mock DOM environment (following existing test pattern)
const mockElements = {};

// Simple DOM element mock
const createElement = (tag = 'div', attributes = {}) => {
    const element = {
        tagName: tag.toUpperCase(),
        style: {},
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn((className) => {
                return element.className && element.className.includes(className);
            }),
            toggle: jest.fn()
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
        click: jest.fn(),
        focus: jest.fn(),
        blur: jest.fn(),
        value: '',
        textContent: '',
        innerHTML: '',
        checked: false,
        disabled: false,
        dataset: {},
        className: '',
        children: [],
        querySelector: jest.fn((selector) => {
            if (selector === '.participant-checkbox') {
                return { checked: false, dispatchEvent: jest.fn() };
            }
            return null;
        }),
        querySelectorAll: jest.fn((selector) => {
            if (selector.includes('[data-user-id=')) {
                const userId = selector.match(/data-user-id="([^"]+)"/)?.[1];
                return element.children.filter(child => child.dataset.userId === userId);
            }
            if (selector === '.participant-item') {
                return element.children.filter(child => child.className.includes('participant-item'));
            }
            return [];
        }),
        appendChild: jest.fn((child) => {
            element.children.push(child);
        }),
        ...attributes
    };
    return element;
};

global.document = {
    createElement: jest.fn((tag) => createElement(tag)),
    getElementById: jest.fn((id) => mockElements[id] || null),
    querySelector: jest.fn((selector) => {
        if (selector.startsWith('#')) {
            const id = selector.slice(1);
            return mockElements[id] || null;
        }
        return null;
    }),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn(),
    body: createElement('body')
};

// Import the ParticipantComponent after setting up mocks
const ParticipantComponent = require('../../../public/js/components/ParticipantComponent.js');

describe('ParticipantComponent', () => {
    const mockUsers = [
        {
            id: 'user1',
            name: 'Alice Johnson',
            email: 'alice@example.com',
            phone: '+1234567890',
            totalBalance: 25.50
        },
        {
            id: 'user2',
            name: 'Bob Smith',
            email: 'bob@example.com',
            totalBalance: -15.75
        },
        {
            id: 'user3',
            name: 'Charlie Brown',
            email: 'charlie@example.com',
            totalBalance: 0
        },
        {
            id: 'user4',
            name: 'Diana Wilson',
            // No email/phone to test missing contact info
            totalBalance: 100.25
        }
    ];

    beforeEach(() => {
        // Clear all mocks
        jest.clearAllMocks();

        // Reset DOM
        document.body.innerHTML = '';
    });

    describe('Balance Status Calculation', () => {
        test('should return correct status for positive balance (credit)', () => {
            const status = ParticipantComponent.getBalanceStatus(25.50);

            expect(status).toEqual({
                class: 'balance-owed',
                text: 'Credit'
            });
        });

        test('should return correct status for negative balance (owes)', () => {
            const status = ParticipantComponent.getBalanceStatus(-15.75);

            expect(status).toEqual({
                class: 'balance-owes',
                text: 'Owes'
            });
        });

        test('should return correct status for zero balance (settled)', () => {
            const status = ParticipantComponent.getBalanceStatus(0);

            expect(status).toEqual({
                class: 'balance-settled',
                text: 'Settled'
            });
        });

        test('should handle very small positive balances as credit', () => {
            const status = ParticipantComponent.getBalanceStatus(0.02);

            expect(status).toEqual({
                class: 'balance-owed',
                text: 'Credit'
            });
        });

        test('should handle very small negative balances as owes', () => {
            const status = ParticipantComponent.getBalanceStatus(-0.02);

            expect(status).toEqual({
                class: 'balance-owes',
                text: 'Owes'
            });
        });

        test('should treat very small balances as settled (within 0.01 threshold)', () => {
            expect(ParticipantComponent.getBalanceStatus(0.005)).toEqual({
                class: 'balance-settled',
                text: 'Settled'
            });

            expect(ParticipantComponent.getBalanceStatus(-0.005)).toEqual({
                class: 'balance-settled',
                text: 'Settled'
            });
        });
    });

    describe('Contact Information Building', () => {
        test('should build contact info with email and phone', () => {
            const user = mockUsers[0]; // Alice with both email and phone
            const contact = ParticipantComponent.buildContactInfo(user, true);

            expect(contact).toContain('participant-contact');
            expect(contact).toContain('alice@example.com');
            expect(contact).toContain('+1234567890');
            expect(contact).toContain(' • '); // separator
        });

        test('should build contact info with email only', () => {
            const user = mockUsers[1]; // Bob with email only
            const contact = ParticipantComponent.buildContactInfo(user, true);

            expect(contact).toContain('participant-contact');
            expect(contact).toContain('bob@example.com');
            expect(contact).not.toContain(' • ');
        });

        test('should show "No email" for missing contact in EventsPage style', () => {
            const user = mockUsers[3]; // Diana with no email/phone
            const contact = ParticipantComponent.buildContactInfo(user, true);

            expect(contact).toContain('participant-details');
            expect(contact).toContain('No email');
        });

        test('should return empty string when showContact is false', () => {
            const user = mockUsers[0];
            const contact = ParticipantComponent.buildContactInfo(user, false);

            expect(contact).toBe('');
        });
    });

    describe('Balance Display Building', () => {
        test('should build signed balance display (EventsPage style)', () => {
            const balance = 25.50;
            const balanceStatus = { class: 'balance-owed', text: 'Credit' };
            const display = ParticipantComponent.buildBalanceDisplay(balance, balanceStatus, 'signed');

            expect(display).toContain('participant-balance balance-owed');
            expect(display).toContain('$25.50');
            expect(display).not.toContain('<span>'); // No separate spans for signed format
        });

        test('should build absolute balance display (EventDetailPage style)', () => {
            const balance = -15.75;
            const balanceStatus = { class: 'balance-owes', text: 'Owes' };
            const display = ParticipantComponent.buildBalanceDisplay(balance, balanceStatus, 'absolute');

            expect(display).toContain('participant-balance balance-owes');
            expect(display).toContain('<span>Owes</span>');
            expect(display).toContain('<span>$15.75</span>'); // Absolute value
        });
    });

    describe('Selectable Item Creation (EventsPage style)', () => {
        test('should create selectable participant item with checkbox', () => {
            const user = mockUsers[0];
            const html = ParticipantComponent.createSelectableItem(user, false, user.id);

            expect(html).toContain('participant-item');
            expect(html).toContain('data-user-id="user1"');
            expect(html).toContain('participant-checkbox');
            expect(html).toContain('Alice Johnson');
            expect(html).toContain('alice@example.com');
            expect(html).toContain('+1234567890');
            expect(html).toContain('$25.50');
            expect(html).not.toContain('selected'); // Not selected
            expect(html).not.toContain('checked'); // Checkbox not checked
        });

        test('should create selected participant item', () => {
            const user = mockUsers[1];
            const html = ParticipantComponent.createSelectableItem(user, true, user.id);

            expect(html).toContain('participant-item selected');
            expect(html).toContain('checked');
            expect(html).toContain('Bob Smith');
            expect(html).toContain('balance-owes'); // Negative balance
        });

        test('should handle user with no contact info', () => {
            const user = mockUsers[3];
            const html = ParticipantComponent.createSelectableItem(user, false, user.id);

            expect(html).toContain('Diana Wilson');
            expect(html).toContain('No email');
            expect(html).toContain('balance-owed'); // Positive balance
        });
    });

    describe('Display Card Creation (EventDetailPage style)', () => {
        test('should create display card without checkbox', () => {
            const user = mockUsers[0];
            const html = ParticipantComponent.createDisplayCard(user);

            expect(html).toContain('participant-card');
            expect(html).toContain('Alice Johnson');
            expect(html).toContain('participant-contact');
            expect(html).toContain('alice@example.com • +1234567890');
            expect(html).not.toContain('participant-checkbox');
            expect(html).not.toContain('data-user-id'); // No user ID needed for display only

            // Should show absolute balance format
            expect(html).toContain('<span>Credit</span>');
            expect(html).toContain('<span>$25.50</span>');
        });

        test('should create display card for user with debt', () => {
            const user = mockUsers[1];
            const html = ParticipantComponent.createDisplayCard(user);

            expect(html).toContain('participant-card');
            expect(html).toContain('Bob Smith');
            expect(html).toContain('balance-owes');
            expect(html).toContain('<span>Owes</span>');
            expect(html).toContain('<span>$15.75</span>'); // Absolute value
        });

        test('should create display card for settled user', () => {
            const user = mockUsers[2];
            const html = ParticipantComponent.createDisplayCard(user);

            expect(html).toContain('Charlie Brown');
            expect(html).toContain('balance-settled');
            expect(html).toContain('<span>Settled</span>');
            expect(html).toContain('<span>$0.00</span>');
        });
    });

    describe('Generic Component Creation', () => {
        test('should create component with custom options', () => {
            const user = mockUsers[0];
            const html = ParticipantComponent.create(user, {
                selectable: true,
                selected: true,
                showBalance: true,
                showContact: true,
                variant: 'item',
                balanceFormat: 'signed',
                className: 'custom-class',
                userId: 'custom-id'
            });

            expect(html).toContain('participant-item selected custom-class');
            expect(html).toContain('data-user-id="custom-id"');
            expect(html).toContain('participant-checkbox');
            expect(html).toContain('checked');
            expect(html).toContain('Alice Johnson');
        });

        test('should create component without balance', () => {
            const user = mockUsers[0];
            const html = ParticipantComponent.create(user, {
                showBalance: false
            });

            expect(html).toContain('Alice Johnson');
            expect(html).not.toContain('participant-balance');
            expect(html).not.toContain('$25.50');
        });

        test('should create component without contact info', () => {
            const user = mockUsers[0];
            const html = ParticipantComponent.create(user, {
                showContact: false
            });

            expect(html).toContain('Alice Johnson');
            expect(html).not.toContain('alice@example.com');
            expect(html).not.toContain('participant-contact');
            expect(html).not.toContain('participant-details');
        });
    });

    describe('Event Binding and Selection Management', () => {
        test('should provide selection management methods', () => {
            // Test that the methods exist and can be called without errors
            expect(typeof ParticipantComponent.bindSelectionEvents).toBe('function');
            expect(typeof ParticipantComponent.updateSelection).toBe('function');
            expect(typeof ParticipantComponent.getSelectedIds).toBe('function');
            expect(typeof ParticipantComponent.clearSelections).toBe('function');
        });

        test('should handle event binding on non-existent container gracefully', () => {
            const mockCallback = jest.fn();

            // Should not throw error when container doesn't exist
            expect(() => {
                ParticipantComponent.bindSelectionEvents('#non-existent', mockCallback);
            }).not.toThrow();

            expect(mockCallback).not.toHaveBeenCalled();
        });

        test('should handle selection update on non-existent item gracefully', () => {
            // Create a container in mockElements
            const container = createElement('div');
            container.id = 'test-container';
            mockElements['test-container'] = container;

            // Should not throw error when item doesn't exist
            expect(() => {
                ParticipantComponent.updateSelection('#test-container', 'non-existent', true);
            }).not.toThrow();
        });

        test('should handle getSelectedIds on empty container', () => {
            // Create a container in mockElements
            const container = createElement('div');
            container.id = 'empty-container';
            mockElements['empty-container'] = container;

            const selectedIds = ParticipantComponent.getSelectedIds('#empty-container');

            expect(selectedIds).toEqual([]);
        });
    });

    describe('Edge Cases and Error Handling', () => {
        test('should handle missing balance property', () => {
            const userWithoutBalance = {
                id: 'user5',
                name: 'Test User',
                email: 'test@example.com'
            };

            const html = ParticipantComponent.createSelectableItem(userWithoutBalance, false, userWithoutBalance.id);

            expect(html).toContain('Test User');
            expect(html).toContain('balance-settled'); // Should default to 0 balance
            expect(html).toContain('$0.00');
        });

        test('should handle missing participant properties', () => {
            const minimalUser = {
                id: 'user6',
                name: 'Minimal User'
            };

            const html = ParticipantComponent.createDisplayCard(minimalUser);

            expect(html).toContain('Minimal User');
            expect(html).toContain('participant-card');
            expect(html).not.toContain('participant-contact'); // No contact info to show
        });

    });

    describe('Backward Compatibility', () => {
        test('should support both totalBalance and balance properties', () => {
            const userWithTotalBalance = { ...mockUsers[0] };
            const userWithBalance = { ...mockUsers[0], balance: 50.00 };
            delete userWithBalance.totalBalance;

            const html1 = ParticipantComponent.createSelectableItem(userWithTotalBalance, false, userWithTotalBalance.id);
            const html2 = ParticipantComponent.createSelectableItem(userWithBalance, false, userWithBalance.id);

            expect(html1).toContain('$25.50'); // From totalBalance
            expect(html2).toContain('$50.00'); // From balance
        });

        test('should maintain CSS class compatibility', () => {
            const user = mockUsers[0];

            const selectableHtml = ParticipantComponent.createSelectableItem(user, false, user.id);
            const displayHtml = ParticipantComponent.createDisplayCard(user);

            // Should use the expected CSS classes for existing tests
            expect(selectableHtml).toContain('participant-item');
            expect(displayHtml).toContain('participant-card');
            expect(selectableHtml).toContain('participant-name');
            expect(selectableHtml).toContain('participant-balance');
        });
    });
});