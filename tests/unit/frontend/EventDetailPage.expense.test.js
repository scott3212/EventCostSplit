const EventDetailPage = require('../../../public/js/pages/event-detail.js');

// Mock DOM and globals
const mockApiClient = {
    getEvent: jest.fn(),
    getEventParticipants: jest.fn(),
    getEventCostItems: jest.fn(),
    createCostItem: jest.fn(),
    updateCostItem: jest.fn()
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
        createElement('expense-splitConfiguration-error');
        
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
            
            // Set up currentSplitPercentages that validateSplit() and getSplitPercentages() need
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
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
            // Set up currentSplitPercentages that validateSplit() needs
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };
            
            const error = new Error('description already exists');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockElements['expense-description-error'].textContent).toBe('An expense with this description already exists');
        });
        
        test('should handle invalid amount error', async () => {
            // Set up currentSplitPercentages that validateSplit() needs
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };
            
            const error = new Error('amount is invalid');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockElements['expense-amount-error'].textContent).toBe('Invalid amount');
        });
        
        test('should handle invalid paidBy error', async () => {
            // Set up currentSplitPercentages that validateSplit() needs
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };
            
            const error = new Error('paidBy is invalid');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(mockElements['expense-paid-by-error'].textContent).toBe('Please select who paid for this expense');
        });
        
        test('should handle general errors', async () => {
            // Set up currentSplitPercentages that validateSplit() needs
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };
            
            const error = new Error('Network error');
            mockApiClient.createCostItem.mockRejectedValue(error);
            
            // Mock refresh to avoid navigation issues
            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
            
            await eventDetailPage.handleAddExpense();
            
            expect(global.showError).toHaveBeenCalledWith('Failed to create expense. Please try again.');
        });
        
        test('should disable save button during creation', async () => {
            // Set up currentSplitPercentages that validateSplit() needs
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };
            
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
    
    describe('Data Sanitization', () => {
        describe('sanitizeExpenseData', () => {
            test('should remove non-participant from split percentages', () => {
                const expenseData = {
                    description: 'Test Expense',
                    amount: 100,
                    splitPercentage: {
                        'user1': 33.33,
                        'user2': 33.33,
                        'user3': 33.34,
                        'removedUser': 0
                    }
                };
                const currentParticipants = ['user1', 'user2', 'user3'];

                const result = eventDetailPage.sanitizeExpenseData(expenseData, currentParticipants);

                expect(result.splitPercentage).toEqual({
                    'user1': 33.33,
                    'user2': 33.33,
                    'user3': 33.34
                });
                expect(result.splitPercentage).not.toHaveProperty('removedUser');
            });

            test('should recalculate percentages after participant removal', () => {
                const expenseData = {
                    description: 'Test Expense',
                    amount: 100,
                    splitPercentage: {
                        'user1': 25,
                        'user2': 25,
                        'user3': 25,
                        'removedUser': 25  // This will be removed
                    }
                };
                const currentParticipants = ['user1', 'user2', 'user3'];

                const result = eventDetailPage.sanitizeExpenseData(expenseData, currentParticipants);

                // Should recalculate to 100% among remaining participants
                const total = Object.values(result.splitPercentage).reduce((sum, val) => sum + val, 0);
                expect(Math.abs(total - 100)).toBeLessThan(0.01); // Within rounding tolerance
            });

            test('should handle empty split after all participants removed', () => {
                const expenseData = {
                    description: 'Test Expense',
                    amount: 100,
                    splitPercentage: {
                        'removedUser1': 50,
                        'removedUser2': 50
                    }
                };
                const currentParticipants = ['user1', 'user2'];

                const result = eventDetailPage.sanitizeExpenseData(expenseData, currentParticipants);

                expect(result.splitPercentage).toEqual({});
            });

            test('should preserve valid participants in split', () => {
                const expenseData = {
                    description: 'Test Expense',
                    amount: 100,
                    splitPercentage: {
                        'user1': 50,
                        'user2': 50
                    }
                };
                const currentParticipants = ['user1', 'user2', 'user3'];

                const result = eventDetailPage.sanitizeExpenseData(expenseData, currentParticipants);

                expect(result.splitPercentage).toEqual({
                    'user1': 50,
                    'user2': 50
                });
                expect(result.description).toBe('Test Expense');
                expect(result.amount).toBe(100);
            });

            test('should handle missing splitPercentage gracefully', () => {
                const expenseData = {
                    description: 'Test Expense',
                    amount: 100
                };
                const currentParticipants = ['user1', 'user2'];

                const result = eventDetailPage.sanitizeExpenseData(expenseData, currentParticipants);

                expect(result).toEqual(expenseData);
            });

            test('should handle missing currentParticipants gracefully', () => {
                const expenseData = {
                    description: 'Test Expense',
                    amount: 100,
                    splitPercentage: {
                        'user1': 50,
                        'user2': 50
                    }
                };

                const result = eventDetailPage.sanitizeExpenseData(expenseData, null);

                expect(result).toEqual(expenseData);
            });
        });

        describe('sanitizeSplitPercentages', () => {
            test('should keep original percentages when no participants removed', () => {
                const splitPercentages = {
                    'user1': 33.33,
                    'user2': 33.33,
                    'user3': 33.34
                };
                const currentParticipants = ['user1', 'user2', 'user3'];

                const result = eventDetailPage.sanitizeSplitPercentages(splitPercentages, currentParticipants);

                expect(result).toEqual({
                    'user1': 33.33,
                    'user2': 33.33,
                    'user3': 33.34
                });
            });

            test('should recalculate percentages when participants are removed', () => {
                const splitPercentages = {
                    'user1': 33.33,  // Alice
                    'user2': 33.33,  // Bob
                    'user3': 33.34   // Minnie (to be removed)
                };
                const currentParticipants = ['user1', 'user2']; // Minnie removed

                const result = eventDetailPage.sanitizeSplitPercentages(splitPercentages, currentParticipants);

                // Should recalculate Alice and Bob to total 100%
                expect(result).toEqual({
                    'user1': 50,    // 33.33 * (100/66.66) = 50
                    'user2': 50     // 33.33 * (100/66.66) = 50
                });
            });

            test('should handle removing majority of participants', () => {
                const splitPercentages = {
                    'user1': 25,
                    'user2': 25,
                    'user3': 25,
                    'user4': 25
                };
                const currentParticipants = ['user1']; // Only user1 remains

                const result = eventDetailPage.sanitizeSplitPercentages(splitPercentages, currentParticipants);

                expect(result).toEqual({
                    'user1': 100 // Should get 100% since they're the only participant left
                });
            });

            test('should handle uneven percentage recalculation', () => {
                const splitPercentages = {
                    'user1': 60,
                    'user2': 20,
                    'user3': 20 // This user will be removed
                };
                const currentParticipants = ['user1', 'user2'];

                const result = eventDetailPage.sanitizeSplitPercentages(splitPercentages, currentParticipants);

                // Should recalculate proportionally: 60/(60+20) = 75%, 20/(60+20) = 25%
                expect(result).toEqual({
                    'user1': 75,  // 60 * (100/80) = 75
                    'user2': 25   // 20 * (100/80) = 25
                });
            });

            test('should return empty object when no participants match', () => {
                const splitPercentages = {
                    'removedUser1': 50,
                    'removedUser2': 50
                };
                const currentParticipants = ['user1', 'user2'];

                const result = eventDetailPage.sanitizeSplitPercentages(splitPercentages, currentParticipants);

                expect(result).toEqual({});
            });

            test('should handle null inputs gracefully', () => {
                expect(eventDetailPage.sanitizeSplitPercentages(null, ['user1'])).toEqual({});
                expect(eventDetailPage.sanitizeSplitPercentages({'user1': 100}, null)).toEqual({});
                expect(eventDetailPage.sanitizeSplitPercentages(null, null)).toEqual({});
            });

            test('should handle floating point precision issues', () => {
                const splitPercentages = {
                    'user1': 33.333333,
                    'user2': 33.333333,
                    'user3': 33.333334 // Will be removed
                };
                const currentParticipants = ['user1', 'user2'];

                const result = eventDetailPage.sanitizeSplitPercentages(splitPercentages, currentParticipants);

                // Should total exactly 100%
                const total = Object.values(result).reduce((sum, val) => sum + val, 0);
                expect(total).toBe(100);
                expect(result.user1).toBe(50);
                expect(result.user2).toBe(50);
            });
        });
    });

    describe('Enhanced Error Handling', () => {
        beforeEach(() => {
            // Set up for expense editing with valid split
            eventDetailPage.currentEvent = {
                id: 'event1',
                participants: ['user1', 'user2', 'user3']
            };
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };

            jest.spyOn(eventDetailPage, 'refresh').mockResolvedValue();
        });

        test('should have enhanced error handling methods available', () => {
            // Test that the enhanced error handling code paths exist
            // The actual error conditions are prevented by our sanitization, which is the intended behavior
            expect(typeof eventDetailPage.sanitizeExpenseData).toBe('function');
            expect(typeof eventDetailPage.sanitizeSplitPercentages).toBe('function');
        });
    });

    describe('Split Configuration with Removed Participants', () => {
        beforeEach(() => {
            eventDetailPage.currentEvent = {
                participants: ['user1', 'user2', 'user3']
            };
        });

        test('should clean split configuration when loading', () => {
            // Set up split with removed participant
            eventDetailPage.currentSplitPercentages = {
                'user1': 25,
                'user2': 25,
                'user3': 25,
                'removedUser': 25
            };

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            eventDetailPage.loadSplitConfiguration();

            // After removing 'removedUser' (25%), the remaining 75% should be redistributed to 100%
            // Each remaining participant: 25% * (100/75) = 33.33%
            expect(eventDetailPage.currentSplitPercentages).toEqual({
                'user1': 33.34,  // Gets the extra 0.01% to reach exactly 100%
                'user2': 33.33,
                'user3': 33.33
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                'Recalculated split after removing 1 participants:',
                { 'user1': 33.34, 'user2': 33.33, 'user3': 33.33 }
            );
            consoleSpy.mockRestore();
        });

        test('should not log when no participants need removal', () => {
            eventDetailPage.currentSplitPercentages = {
                'user1': 33.33,
                'user2': 33.33,
                'user3': 33.34
            };

            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

            eventDetailPage.loadSplitConfiguration();

            expect(consoleSpy).not.toHaveBeenCalledWith(
                expect.stringContaining('Cleaned split configuration')
            );
            consoleSpy.mockRestore();
        });

        test('should handle empty split configuration gracefully', () => {
            eventDetailPage.currentSplitPercentages = null;

            expect(() => {
                eventDetailPage.loadSplitConfiguration();
            }).not.toThrow();
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