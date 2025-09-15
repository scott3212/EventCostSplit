const EventsPage = require('../../../public/js/pages/events.js');
const ParticipantComponent = require('../../../public/js/components/ParticipantComponent.js');

// Make ParticipantComponent available globally
global.ParticipantComponent = ParticipantComponent;

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

// Mock DOM elements
const mockElements = {};
const createElement = (id, tag = 'div') => {
    const element = {
        id,
        tagName: tag.toUpperCase(),
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
        value: '',
        textContent: '',
        innerHTML: '',
        checked: false,
        disabled: false,
        dataset: {},
        querySelector: jest.fn(),
        querySelectorAll: jest.fn(() => []),
        closest: jest.fn(),
        reset: jest.fn()
    };
    mockElements[id] = element;
    return element;
};

global.document = {
    getElementById: jest.fn((id) => mockElements[id] || null),
    querySelector: jest.fn(),
    querySelectorAll: jest.fn(() => []),
    addEventListener: jest.fn()
};

describe('EventsPage - Create Event Form', () => {
    let eventsPage;
    const mockUsers = [
        {
            id: 'user1',
            name: 'John Doe',
            email: 'john@example.com',
            totalBalance: 0
        },
        {
            id: 'user2',
            name: 'Jane Smith',
            email: 'jane@example.com',
            totalBalance: -10.50
        }
    ];

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        
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

    describe('Form Validation', () => {
        test('should validate required name field', () => {
            mockElements['event-name'].value = '';
            const result = eventsPage.validateName();
            expect(result).toBe(false);
            expect(mockElements['event-name-error'].textContent).toBe('Event name is required');
            expect(mockElements['event-name-error'].style.display).toBe('block');
        });

        test('should validate name length - too short', () => {
            mockElements['event-name'].value = 'A';
            const result = eventsPage.validateName();
            expect(result).toBe(false);
            expect(mockElements['event-name-error'].textContent).toBe('Event name must be at least 2 characters long');
        });

        test('should validate name length - too long', () => {
            mockElements['event-name'].value = 'A'.repeat(101);
            const result = eventsPage.validateName();
            expect(result).toBe(false);
            expect(mockElements['event-name-error'].textContent).toBe('Event name cannot be longer than 100 characters');
        });

        test('should pass valid name validation', () => {
            mockElements['event-name'].value = 'Valid Event Name';
            const result = eventsPage.validateName();
            expect(result).toBe(true);
            expect(mockElements['event-name-error'].style.display).toBe('none');
        });

        test('should validate required date field', () => {
            mockElements['event-date'].value = '';
            const result = eventsPage.validateDate();
            expect(result).toBe(false);
            expect(mockElements['event-date-error'].textContent).toBe('Event date is required');
        });

        test('should reject past dates', () => {
            // Create yesterday's date in local timezone to avoid UTC conversion issues
            const today = new Date();
            const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

            // Format as YYYY-MM-DD
            const year = yesterday.getFullYear();
            const month = String(yesterday.getMonth() + 1).padStart(2, '0');
            const day = String(yesterday.getDate()).padStart(2, '0');
            mockElements['event-date'].value = `${year}-${month}-${day}`;

            const result = eventsPage.validateDate();
            expect(result).toBe(false);
            expect(mockElements['event-date-error'].textContent).toBe('Event date cannot be in the past');
        });

        test('should accept today and future dates', () => {
            const future = new Date();
            future.setDate(future.getDate() + 1); // Tomorrow
            mockElements['event-date'].value = future.toISOString().split('T')[0];
            
            const result = eventsPage.validateDate();
            expect(result).toBe(true);
            expect(mockElements['event-date-error'].style.display).toBe('none');
        });

        test('should validate required location field', () => {
            mockElements['event-location'].value = '';
            const result = eventsPage.validateLocation();
            expect(result).toBe(false);
            expect(mockElements['event-location-error'].textContent).toBe('Location is required');
        });

        test('should validate location length - too short', () => {
            mockElements['event-location'].value = 'A';
            const result = eventsPage.validateLocation();
            expect(result).toBe(false);
            expect(mockElements['event-location-error'].textContent).toBe('Location must be at least 2 characters long');
        });

        test('should validate location length - too long', () => {
            mockElements['event-location'].value = 'A'.repeat(201);
            const result = eventsPage.validateLocation();
            expect(result).toBe(false);
            expect(mockElements['event-location-error'].textContent).toBe('Location cannot be longer than 200 characters');
        });

        test('should validate participants are selected', () => {
            eventsPage.selectedParticipants.clear();
            const result = eventsPage.validateParticipants();
            expect(result).toBe(false);
            expect(mockElements['participants-error'].textContent).toBe('Please select at least one participant');
        });

        test('should pass participants validation when selected', () => {
            eventsPage.selectedParticipants.add('user1');
            const result = eventsPage.validateParticipants();
            expect(result).toBe(true);
            expect(mockElements['participants-error'].style.display).toBe('none');
        });

        test('should validate entire form', () => {
            // Set valid values
            mockElements['event-name'].value = 'Valid Event';
            mockElements['event-date'].value = '2025-12-31';
            mockElements['event-location'].value = 'Valid Location';
            eventsPage.selectedParticipants.add('user1');

            const result = eventsPage.validateForm();
            expect(result).toBe(true);
        });

        test('should fail form validation with invalid data', () => {
            // Set invalid values
            mockElements['event-name'].value = '';
            mockElements['event-date'].value = '';
            mockElements['event-location'].value = '';
            eventsPage.selectedParticipants.clear();

            const result = eventsPage.validateForm();
            expect(result).toBe(false);
        });
    });

    describe('Error Handling', () => {
        test('should show field-specific errors', () => {
            eventsPage.showError('event-name', 'Test error message');
            
            expect(mockElements['event-name-error'].textContent).toBe('Test error message');
            expect(mockElements['event-name-error'].style.display).toBe('block');
            expect(mockElements['event-name'].style.borderColor).toBe('#ef4444');
        });

        test('should clear field-specific errors', () => {
            eventsPage.clearError('event-name');
            
            expect(mockElements['event-name-error'].style.display).toBe('none');
            expect(mockElements['event-name-error'].textContent).toBe('');
            expect(mockElements['event-name'].style.borderColor).toBe('');
        });

        test('should clear all errors', () => {
            eventsPage.clearAllErrors();
            
            expect(mockElements['event-name-error'].style.display).toBe('none');
            expect(mockElements['event-date-error'].style.display).toBe('none');
            expect(mockElements['event-location-error'].style.display).toBe('none');
            expect(mockElements['participants-error'].style.display).toBe('none');
        });
    });

    describe('Participants Loading and Display', () => {
        test('should load participants successfully', async () => {
            await eventsPage.loadParticipants();
            
            expect(mockApiClient.getUsers).toHaveBeenCalled();
            expect(eventsPage.users).toEqual(mockUsers);
            expect(mockElements['participants-list'].style.display).toBe('block');
            expect(mockElements['participants-loading'].style.display).toBe('none');
        });

        test('should handle participants loading error', async () => {
            const error = new Error('Failed to load users');
            mockApiClient.getUsers.mockRejectedValue(error);
            
            await eventsPage.loadParticipants();
            
            expect(mockElements['participants-error'].textContent).toBe('Failed to load users. Please try again.');
            expect(mockElements['participants-error'].style.display).toBe('block');
            expect(mockElements['participants-loading'].style.display).toBe('none');
        });

        test('should create participant item HTML correctly', () => {
            const user = {
                id: 'user1',
                name: 'John Doe',
                email: 'john@example.com',
                phone: '+1234567890',
                totalBalance: -10.50
            };

            const html = ParticipantComponent.createSelectableItem(user, false, user.id);

            expect(html).toContain('John Doe');
            expect(html).toContain('john@example.com');
            expect(html).toContain('+1234567890');
            expect(html).toContain('data-user-id="user1"');
            expect(html).toContain('$-10.50');
            expect(html).toContain('balance-owes');
        });

        test('should handle user balance status correctly', () => {
            expect(ParticipantComponent.getBalanceStatus(10)).toEqual({
                class: 'balance-owed',
                text: 'Credit'
            });

            expect(ParticipantComponent.getBalanceStatus(-10)).toEqual({
                class: 'balance-owes',
                text: 'Owes'
            });

            expect(ParticipantComponent.getBalanceStatus(0)).toEqual({
                class: 'balance-settled',
                text: 'Settled'
            });
        });
    });

    describe('Form Submission', () => {
        test('should create event successfully', async () => {
            // Set up valid form data
            mockElements['event-name'].value = 'Test Event';
            mockElements['event-date'].value = '2025-12-31';
            mockElements['event-location'].value = 'Test Location';
            mockElements['event-description'].value = 'Test Description';
            eventsPage.selectedParticipants.add('user1');
            eventsPage.selectedParticipants.add('user2');

            const mockNewEvent = {
                id: 'new-event-id',
                name: 'Test Event',
                date: '2025-12-31',
                location: 'Test Location',
                description: 'Test Description',
                participants: ['user1', 'user2']
            };

            mockApiClient.createEvent.mockResolvedValue(mockNewEvent);
            
            // Mock refresh method
            const refreshSpy = jest.spyOn(eventsPage, 'refresh').mockResolvedValue();
            const hideDialogSpy = jest.spyOn(eventsPage, 'hideAddEventDialog').mockImplementation(() => {});

            await eventsPage.handleAddEvent();

            expect(mockApiClient.createEvent).toHaveBeenCalledWith({
                name: 'Test Event',
                date: '2025-12-31',
                location: 'Test Location',
                description: 'Test Description',
                participants: ['user1', 'user2']
            });
            
            expect(hideDialogSpy).toHaveBeenCalled();
            expect(refreshSpy).toHaveBeenCalled();
            expect(global.showSuccess).toHaveBeenCalledWith('Event "Test Event" created successfully!');

            refreshSpy.mockRestore();
            hideDialogSpy.mockRestore();
        });

        test('should handle duplicate name error', async () => {
            mockElements['event-name'].value = 'Duplicate Event';
            mockElements['event-date'].value = '2025-12-31';
            mockElements['event-location'].value = 'Test Location';
            eventsPage.selectedParticipants.add('user1');

            const error = new Error('A user with this name already exists');
            mockApiClient.createEvent.mockRejectedValue(error);
            
            const showErrorSpy = jest.spyOn(eventsPage, 'showError').mockImplementation(() => {});

            await eventsPage.handleAddEvent();

            expect(showErrorSpy).toHaveBeenCalledWith('event-name', 'An event with this name already exists');
            
            showErrorSpy.mockRestore();
        });

        test('should handle general API errors', async () => {
            mockElements['event-name'].value = 'Test Event';
            mockElements['event-date'].value = '2025-12-31';
            mockElements['event-location'].value = 'Test Location';
            eventsPage.selectedParticipants.add('user1');

            const error = new Error('Server error');
            mockApiClient.createEvent.mockRejectedValue(error);

            await eventsPage.handleAddEvent();

            expect(global.showError).toHaveBeenCalledWith('Failed to create event. Please try again.');
        });

        test('should not submit form if validation fails', async () => {
            // Set invalid form data
            mockElements['event-name'].value = '';
            mockElements['event-date'].value = '';
            mockElements['event-location'].value = '';
            eventsPage.selectedParticipants.clear();

            await eventsPage.handleAddEvent();

            expect(mockApiClient.createEvent).not.toHaveBeenCalled();
        });
    });

    describe('Button State Management', () => {
        test('should set loading state correctly', () => {
            eventsPage.setAddButtonState(true);
            
            expect(mockElements['add-event-save'].disabled).toBe(true);
            expect(mockElements['add-event-spinner'].style.display).toBe('inline-block');
            expect(mockElements['add-event-save-text'].textContent).toBe('Creating...');
        });

        test('should clear loading state correctly', () => {
            eventsPage.setAddButtonState(false);
            
            expect(mockElements['add-event-save'].disabled).toBe(false);
            expect(mockElements['add-event-spinner'].style.display).toBe('none');
            expect(mockElements['add-event-save-text'].textContent).toBe('Create Event');
        });
    });

    describe('Modal Management', () => {
        test('should show add event dialog', async () => {
            const loadParticipantsSpy = jest.spyOn(eventsPage, 'loadParticipants').mockResolvedValue();
            
            await eventsPage.showAddEventDialog();
            
            expect(mockElements['add-event-modal'].style.display).toBe('flex');
            expect(mockElements['add-event-modal'].classList.add).toHaveBeenCalledWith('fade-in');
            expect(loadParticipantsSpy).toHaveBeenCalled();
            
            loadParticipantsSpy.mockRestore();
        });

        test('should hide add event dialog', () => {
            eventsPage.hideAddEventDialog();
            
            expect(mockElements['add-event-modal'].style.display).toBe('none');
            expect(mockElements['add-event-modal'].classList.remove).toHaveBeenCalledWith('fade-in');
        });

        test('should reset form on hide dialog', () => {
            eventsPage.selectedParticipants.add('user1');
            
            eventsPage.resetAddEventForm();
            
            expect(mockElements['add-event-form'].reset).toHaveBeenCalled();
            expect(eventsPage.selectedParticipants.size).toBe(0);
        });
    });
});