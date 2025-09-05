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
        closest: jest.fn()
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

describe('EventsPage', () => {
    let eventsPage;

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
            data: [
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
            ]
        });

        eventsPage = new EventsPage();
    });

    describe('Initialization', () => {
        test('should initialize with correct default values', () => {
            expect(eventsPage.events).toEqual([]);
            expect(eventsPage.users).toEqual([]);
            expect(eventsPage.selectedParticipants).toBeInstanceOf(Set);
            expect(eventsPage.selectedParticipants.size).toBe(0);
            expect(eventsPage.isInitialized).toBe(true);
        });

        test('should bind event listeners on initialization', () => {
            expect(mockElements['add-event-btn'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-event-close'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
            expect(mockElements['add-event-cancel'].addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
        });
    });

    describe('Event List Loading', () => {
        test('should load and display events successfully', async () => {
            const mockEvents = [
                {
                    id: 'event1',
                    name: 'Test Event',
                    date: '2025-09-10',
                    location: 'Test Location',
                    participants: ['user1', 'user2'],
                    participantCount: 2
                }
            ];

            mockApiClient.getEvents.mockResolvedValue({
                success: true,
                data: mockEvents,
                count: 1
            });

            await eventsPage.loadEvents();

            expect(mockApiClient.getEvents).toHaveBeenCalled();
            expect(eventsPage.events).toEqual(mockEvents);
            expect(mockElements['events-list'].style.display).toBe('block');
            expect(mockElements['events-loading'].style.display).toBe('none');
            expect(mockElements['total-events-count'].textContent).toBe(1);
        });

        test('should show empty state when no events', async () => {
            mockApiClient.getEvents.mockResolvedValue({
                success: true,
                data: [],
                count: 0
            });

            await eventsPage.loadEvents();

            expect(mockElements['events-empty'].style.display).toBe('block');
            expect(mockElements['events-list'].style.display).toBe('none');
            expect(mockElements['total-events-count'].textContent).toBe(0);
        });

        test('should handle API errors gracefully', async () => {
            const error = new Error('API Error');
            mockApiClient.getEvents.mockRejectedValue(error);

            await eventsPage.loadEvents();

            expect(global.showError).toHaveBeenCalledWith('Failed to load events. Please try again.');
            expect(mockElements['events-empty'].style.display).toBe('block');
        });
    });

    describe('Event Status Logic', () => {
        test('should return "Today" status for current date', () => {
            const today = new Date();
            const status = eventsPage.getEventStatus({}, today, today);
            
            expect(status.text).toBe('Today');
            expect(status.class).toBe('status-active');
        });

        test('should return "Tomorrow" status for next day', () => {
            const today = new Date();
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            const status = eventsPage.getEventStatus({}, tomorrow, today);
            
            expect(status.text).toBe('Tomorrow');
            expect(status.class).toBe('status-upcoming');
        });

        test('should return "Completed" status for past dates', () => {
            const today = new Date();
            const pastDate = new Date(today);
            pastDate.setDate(pastDate.getDate() - 1);
            
            const status = eventsPage.getEventStatus({}, pastDate, today);
            
            expect(status.class).toBe('status-completed');
            expect(status.text).toBe('Completed');
        });

        test('should return days count for future dates', () => {
            const today = new Date();
            const futureDate = new Date(today);
            futureDate.setDate(futureDate.getDate() + 5);
            
            const status = eventsPage.getEventStatus({}, futureDate, today);
            
            expect(status.class).toBe('status-upcoming');
            expect(status.text).toBe('5 days');
        });
    });

    describe('Date Formatting', () => {
        test('should format today as "Today"', () => {
            const today = new Date();
            const formatted = eventsPage.formatEventDate(today);
            expect(formatted).toBe('Today');
        });

        test('should format tomorrow as "Tomorrow"', () => {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            const formatted = eventsPage.formatEventDate(tomorrow);
            expect(formatted).toBe('Tomorrow');
        });

        test('should format future dates correctly', () => {
            const futureDate = new Date('2025-12-25');
            const formatted = eventsPage.formatEventDate(futureDate);
            expect(formatted).toContain('Dec'); // Just check month
        });
    });

    describe('Event Card Creation', () => {
        test('should create event card with correct structure', () => {
            const mockEvent = {
                id: 'event1',
                name: 'Test Event',
                date: '2025-09-10',
                location: 'Test Location',
                description: 'Test description',
                participantCount: 2
            };

            const cardHtml = eventsPage.createEventCard(mockEvent);

            expect(cardHtml).toContain('Test Event');
            expect(cardHtml).toContain('Test Location');
            expect(cardHtml).toContain('Test description');
            expect(cardHtml).toContain('data-event-id="event1"');
            expect(cardHtml).toContain('2'); // participant count
        });

        test('should handle event without description', () => {
            const mockEvent = {
                id: 'event1',
                name: 'Test Event',
                date: '2025-09-10',
                location: 'Test Location',
                participantCount: 1
            };

            const cardHtml = eventsPage.createEventCard(mockEvent);

            expect(cardHtml).toContain('Test Event');
            expect(cardHtml).not.toContain('event-description');
        });
    });

    describe('Utility Methods', () => {
        test('should find event by ID', () => {
            eventsPage.events = [
                { id: 'event1', name: 'Event 1' },
                { id: 'event2', name: 'Event 2' }
            ];

            const found = eventsPage.findEventById('event1');
            expect(found).toEqual({ id: 'event1', name: 'Event 1' });

            const notFound = eventsPage.findEventById('event3');
            expect(notFound).toBeUndefined();
        });

        test('should update stats correctly', () => {
            eventsPage.events = [
                { id: 'event1', name: 'Event 1' },
                { id: 'event2', name: 'Event 2' }
            ];

            eventsPage.updateStats();

            expect(mockElements['total-events-count'].textContent).toBe(2);
        });

        test('should refresh by calling loadEvents', async () => {
            const loadEventsSpy = jest.spyOn(eventsPage, 'loadEvents').mockResolvedValue();

            await eventsPage.refresh();

            expect(loadEventsSpy).toHaveBeenCalled();
            loadEventsSpy.mockRestore();
        });
    });

    describe('Display State Management', () => {
        test('should show loading state', () => {
            eventsPage.showLoading();

            expect(mockElements['events-loading'].style.display).toBe('block');
            expect(mockElements['events-list'].style.display).toBe('none');
            expect(mockElements['events-empty'].style.display).toBe('none');
        });

        test('should show events list', () => {
            eventsPage.showEventsList();

            expect(mockElements['events-loading'].style.display).toBe('none');
            expect(mockElements['events-list'].style.display).toBe('block');
            expect(mockElements['events-empty'].style.display).toBe('none');
        });

        test('should show empty state', () => {
            eventsPage.showEmptyState();

            expect(mockElements['events-loading'].style.display).toBe('none');
            expect(mockElements['events-list'].style.display).toBe('none');
            expect(mockElements['events-empty'].style.display).toBe('block');
        });
    });
});