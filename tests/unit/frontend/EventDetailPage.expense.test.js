const EventDetailPage = require('../../../public/js/pages/event-detail.js');

// Mock DOM and globals
const mockApiClient = {
    getEvent: jest.fn(),
    getEventParticipants: jest.fn(),
    getEventCostItems: jest.fn(),
    createCostItem: jest.fn()
};

global.api = mockApiClient;
global.showError = jest.fn();
global.showSuccess = jest.fn();
global.formatCurrency = jest.fn((amount) => `$${amount.toFixed(2)}`);
global.formatDateOnly = jest.fn((date) => date);
global.navigateToPage = jest.fn();

// Mock DOM elements
const mockElements = {};
const createElement = (id, tag = 'div', type = null) => {
    const element = {
        id,
        tagName: tag.toUpperCase(),
        type: type,
        style: {},
        classList: {
            add: jest.fn(),
            remove: jest.fn(),
            contains: jest.fn()
        },
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        click: jest.fn(),
        focus: jest.fn(),
        blur: jest.fn(),
        reset: jest.fn(),
        appendChild: jest.fn(),
        value: '',
        textContent: '',
        innerHTML: '',
        checked: false,
        disabled: false,
        dataset: {},
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        closest: jest.fn()
    };
    
    // Special handling for form elements
    if (tag === 'form') {
        element.elements = {};
    }
    
    mockElements[id] = element;
    return element;
};

global.document = {
    getElementById: jest.fn((id) => mockElements[id] || null),
    createElement: jest.fn((tag) => createElement(`mock-${Date.now()}`, tag)),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn()
};

global.FormData = class FormData {
    constructor(form) {
        this.data = {};
    }
    
    get(key) {
        return this.data[key];
    }
    
    set(key, value) {
        this.data[key] = value;
    }
};

// Mock window object
global.window = {
    location: {
        hash: ''
    }
};

describe('EventDetailPage - Expense Management', () => {
    let eventDetailPage;
    
    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
        // Create mock elements for expense functionality
        createElement('event-detail-back', 'button');
        createElement('event-detail-name');
        createElement('event-detail-date');
        createElement('event-detail-status');
        createElement('event-detail-location');
        createElement('event-detail-description');
        createElement('event-description-container');
        createElement('event-detail-participant-count');
        createElement('total-expenses-count');
        createElement('total-expenses-amount');
        createElement('avg-per-person');
        createElement('event-participants-loading');
        createElement('event-participants-list');
        
        // Expense elements
        createElement('add-expense-btn', 'button');
        createElement('add-first-expense-btn', 'button');
        createElement('expenses-loading');
        createElement('expenses-list');
        createElement('expenses-empty');
        
        // Expense modal elements
        createElement('add-expense-modal');
        createElement('add-expense-form', 'form');
        createElement('add-expense-close', 'button');
        createElement('add-expense-cancel', 'button');
        createElement('add-expense-save', 'button');
        
        // Expense form fields
        createElement('expense-description', 'input', 'text');
        createElement('expense-amount', 'input', 'number');
        createElement('expense-date', 'input', 'date');
        createElement('expense-paid-by', 'select');
        
        // Error elements
        createElement('expense-description-error');
        createElement('expense-amount-error');
        createElement('expense-date-error');
        createElement('expense-paid-by-error');
        
        // Mock form data behavior
        global.FormData = class FormData {
            constructor(form) {
                this.data = {
                    description: mockElements['expense-description'].value,
                    amount: mockElements['expense-amount'].value,
                    date: mockElements['expense-date'].value,
                    paidBy: mockElements['expense-paid-by'].value
                };
            }
            
            get(key) {
                return this.data[key];
            }
        };
        
        // Mock API responses
        mockApiClient.getEvent.mockResolvedValue({
            id: 'event1',
            name: 'Test Event',
            date: '2025-09-10',
            location: 'Test Location',
            participants: ['user1', 'user2', 'user3']
        });
        
        mockApiClient.getEventParticipants.mockResolvedValue([
            { id: 'user1', name: 'John Doe', email: 'john@example.com', totalBalance: 0 },
            { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', totalBalance: -10 },
            { id: 'user3', name: 'Bob Wilson', phone: '123-456-7890', totalBalance: 15 }
        ]);
        
        mockApiClient.getEventCostItems.mockResolvedValue([]);
        
        eventDetailPage = new EventDetailPage();
        
        // Set up event data
        eventDetailPage.currentEventId = 'event1';
        eventDetailPage.currentEvent = {
            id: 'event1',
            name: 'Test Event',
            date: '2025-09-10',
            location: 'Test Location',
            participants: ['user1', 'user2', 'user3']
        };
        eventDetailPage.participants = [
            { id: 'user1', name: 'John Doe', email: 'john@example.com', totalBalance: 0 },
            { id: 'user2', name: 'Jane Smith', email: 'jane@example.com', totalBalance: -10 },
            { id: 'user3', name: 'Bob Wilson', phone: '123-456-7890', totalBalance: 15 }
        ];
    });
    
    describe('Expense Dialog Display', () => {
        test('should show expense dialog when showAddExpenseDialog is called', async () => {
            await eventDetailPage.showAddExpenseDialog();
            
            expect(mockElements['add-expense-modal'].style.display).toBe('flex');
            expect(mockElements['add-expense-modal'].classList.add).toHaveBeenCalledWith('fade-in');
        });
        
        test('should set default date to today when showing dialog', async () => {
            // Mock Date to return consistent value
            const mockDate = new Date('2025-09-06T10:00:00.000Z');
            const originalDate = global.Date;
            global.Date = jest.fn(() => mockDate);
            global.Date.now = originalDate.now;
            
            await eventDetailPage.showAddExpenseDialog();
            
            expect(mockElements['expense-date'].value).toBe('2025-09-06');
            
            global.Date = originalDate;
        });
        
        test('should load participants in paid by dropdown', async () => {
            await eventDetailPage.showAddExpenseDialog();
            
            expect(mockElements['expense-paid-by'].innerHTML).toBe('<option value="">Select who paid for this expense</option>');
            expect(mockElements['expense-paid-by'].appendChild).toHaveBeenCalledTimes(3);
        });
        
        test('should show error if no event selected', async () => {
            eventDetailPage.currentEvent = null;
            
            await eventDetailPage.showAddExpenseDialog();
            
            expect(global.showError).toHaveBeenCalledWith('No event selected');
            expect(mockElements['add-expense-modal'].style.display).not.toBe('flex');
        });
        
        test('should hide expense dialog when hideAddExpenseDialog is called', () => {
            eventDetailPage.hideAddExpenseDialog();
            
            expect(mockElements['add-expense-modal'].style.display).toBe('none');
            expect(mockElements['add-expense-modal'].classList.remove).toHaveBeenCalledWith('fade-in');
            expect(mockElements['add-expense-form'].reset).toHaveBeenCalled();
        });
    });
    
    describe('Form Validation', () => {
        test('should validate required description field', () => {
            mockElements['expense-description'].value = '';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-description-error'].textContent).toBe('Description is required');
            expect(mockElements['expense-description-error'].style.display).toBe('block');
        });
        
        test('should validate minimum description length', () => {
            mockElements['expense-description'].value = 'a';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-description-error'].textContent).toBe('Description must be at least 2 characters');
        });
        
        test('should validate required amount field', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = '';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-amount-error'].textContent).toBe('Amount is required');
        });
        
        test('should validate positive amount', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = '0';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-amount-error'].textContent).toBe('Amount must be greater than 0');
        });
        
        test('should validate numeric amount', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = 'invalid';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-amount-error'].textContent).toBe('Amount is required');
        });
        
        test('should validate required date field', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = '50.00';
            mockElements['expense-date'].value = '';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-date-error'].textContent).toBe('Date is required');
        });
        
        test('should validate required paid by field', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = '50.00';
            mockElements['expense-date'].value = '2025-09-06';
            mockElements['expense-paid-by'].value = '';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(false);
            expect(mockElements['expense-paid-by-error'].textContent).toBe('Please select who paid for this expense');
        });
        
        test('should return true for valid form', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = '50.00';
            mockElements['expense-date'].value = '2025-09-06';
            mockElements['expense-paid-by'].value = 'user1';
            
            const isValid = eventDetailPage.validateExpenseForm();
            
            expect(isValid).toBe(true);
        });
    });
    
    describe('Error Handling', () => {
        test('should clear all errors when form is validated', () => {
            mockElements['expense-description'].value = 'Valid description';
            mockElements['expense-amount'].value = '50.00';
            mockElements['expense-date'].value = '2025-09-06';
            mockElements['expense-paid-by'].value = 'user1';
            
            eventDetailPage.validateExpenseForm();
            
            expect(mockElements['expense-description-error'].style.display).toBe('none');
            expect(mockElements['expense-amount-error'].style.display).toBe('none');
            expect(mockElements['expense-date-error'].style.display).toBe('none');
            expect(mockElements['expense-paid-by-error'].style.display).toBe('none');
        });
        
        test('should show specific error for field', () => {
            eventDetailPage.showExpenseError('description', 'Test error message');
            
            expect(mockElements['expense-description-error'].textContent).toBe('Test error message');
            expect(mockElements['expense-description-error'].style.display).toBe('block');
        });
        
        test('should clear specific error for field', () => {
            eventDetailPage.clearExpenseError('description');
            
            expect(mockElements['expense-description-error'].textContent).toBe('');
            expect(mockElements['expense-description-error'].style.display).toBe('none');
        });
    });
    
    describe('Expense Creation', () => {
        beforeEach(() => {
            // Set up valid form values
            mockElements['expense-description'].value = 'Test Expense';
            mockElements['expense-amount'].value = '75.50';
            mockElements['expense-date'].value = '2025-09-06';
            mockElements['expense-paid-by'].value = 'user1';
        });
        
        test('should create expense with valid data', async () => {
            const mockExpenseResponse = {
                id: 'expense1',
                description: 'Test Expense',
                amount: 75.5,
                paidBy: 'user1',
                date: '2025-09-06',
                eventId: 'event1'
            };
            
            // Mock the refresh method to avoid complex navigation flow
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            jest.spyOn(eventDetailPage, 'hideAddExpenseDialog').mockImplementation(() => {});
            
            mockApiClient.createCostItem.mockResolvedValue(mockExpenseResponse);
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockApiClient.createCostItem).toHaveBeenCalledWith({
                eventId: 'event1',
                description: 'Test Expense',
                amount: 75.5,
                paidBy: 'user1',
                date: '2025-09-06',
                splitPercentage: {
                    'user1': 33.33,
                    'user2': 33.33,
                    'user3': 33.34
                }
            });
            
            expect(eventDetailPage.hideAddExpenseDialog).toHaveBeenCalled();
            expect(eventDetailPage.refresh).toHaveBeenCalled();
            expect(global.showSuccess).toHaveBeenCalledWith('Expense "Test Expense" added successfully!');
        });
        
        test('should handle duplicate description error', async () => {
            const error = new Error('description already exists');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockElements['expense-description-error'].textContent).toBe('An expense with this description already exists');
        });
        
        test('should handle invalid amount error', async () => {
            const error = new Error('amount is invalid');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockElements['expense-amount-error'].textContent).toBe('Invalid amount');
        });
        
        test('should handle invalid paidBy error', async () => {
            const error = new Error('paidBy is invalid');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockElements['expense-paid-by-error'].textContent).toBe('Please select who paid for this expense');
        });
        
        test('should handle general errors', async () => {
            const error = new Error('Network error');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(global.showError).toHaveBeenCalledWith('Failed to create expense. Please try again.');
        });
        
        test('should disable save button during creation', async () => {
            let resolvePromise;
            const promise = new Promise(resolve => { resolvePromise = resolve; });
            mockApiClient.createCostItem.mockReturnValue(promise);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            jest.spyOn(eventDetailPage, 'hideAddExpenseDialog').mockImplementation(() => {});
            
            const handlePromise = eventDetailPage.handleAddExpense();
            
            expect(mockElements['add-expense-save'].disabled).toBe(true);
            expect(mockElements['add-expense-save'].innerHTML).toBe('<span class="loading-spinner-sm"></span> Adding...');
            
            resolvePromise({ description: 'Test Expense' });
            await handlePromise;
            
            expect(mockElements['add-expense-save'].disabled).toBe(false);
            expect(mockElements['add-expense-save'].innerHTML).toBe('<span class="btn-icon">💰</span> Add Expense');
        });
        
        test('should not create expense if validation fails', async () => {
            mockElements['expense-description'].value = ''; // Invalid
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockApiClient.createCostItem).not.toHaveBeenCalled();
            expect(mockElements['expense-description-error'].textContent).toBe('Description is required');
        });
    });
    
    describe('Equal Split Generation', () => {
        test('should generate equal split for 3 participants', () => {
            const splitPercentage = eventDetailPage.generateEqualSplit();
            
            expect(splitPercentage).toEqual({
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            });
        });
        
        test('should generate equal split for 2 participants', () => {
            eventDetailPage.currentEvent.participants = ['user1', 'user2'];
            
            const splitPercentage = eventDetailPage.generateEqualSplit();
            
            expect(splitPercentage).toEqual({
                'user1': 50.0,
                'user2': 50.0
            });
        });
        
        test('should handle single participant', () => {
            eventDetailPage.currentEvent.participants = ['user1'];
            
            const splitPercentage = eventDetailPage.generateEqualSplit();
            
            expect(splitPercentage).toEqual({
                'user1': 100.0
            });
        });
        
        test('should return empty object if no participants', () => {
            eventDetailPage.currentEvent.participants = [];
            
            const splitPercentage = eventDetailPage.generateEqualSplit();
            
            expect(splitPercentage).toEqual({});
        });
        
        test('should return empty object if no event', () => {
            eventDetailPage.currentEvent = null;
            
            const splitPercentage = eventDetailPage.generateEqualSplit();
            
            expect(splitPercentage).toEqual({});
        });
        
        test('should ensure total equals 100%', () => {
            // Test with 7 participants (should cause rounding issues)
            eventDetailPage.currentEvent.participants = ['user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7'];
            
            const splitPercentage = eventDetailPage.generateEqualSplit();
            const total = Object.values(splitPercentage).reduce((sum, percentage) => sum + percentage, 0);
            
            expect(Math.round(total * 100) / 100).toBe(100.0);
        });
    });
    
    describe('UI State Management', () => {
        test('should reset form when dialog is shown', async () => {
            await eventDetailPage.showAddExpenseDialog();
            
            expect(mockElements['add-expense-form'].reset).toHaveBeenCalled();
        });
        
        test('should reset form when dialog is hidden', () => {
            eventDetailPage.hideAddExpenseDialog();
            
            expect(mockElements['add-expense-form'].reset).toHaveBeenCalled();
        });
        
        test('should update save button state correctly', () => {
            eventDetailPage.setExpenseSaveButtonState(true);
            
            expect(mockElements['add-expense-save'].disabled).toBe(true);
            expect(mockElements['add-expense-save'].innerHTML).toBe('<span class="loading-spinner-sm"></span> Adding...');
            
            eventDetailPage.setExpenseSaveButtonState(false);
            
            expect(mockElements['add-expense-save'].disabled).toBe(false);
            expect(mockElements['add-expense-save'].innerHTML).toBe('<span class="btn-icon">💰</span> Add Expense');
        });
    });
    
    describe('Event Listeners', () => {
        test('should bind event listeners on initialization', () => {
            expect(mockElements['add-expense-btn'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-first-expense-btn'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-expense-close'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-expense-cancel'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-expense-save'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-expense-form'].addEventListener).toHaveBeenCalledWith('submit', expect.any(Function));
        });
    });
});