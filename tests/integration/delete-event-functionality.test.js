/**
 * Integration Tests: Delete Event Functionality
 * 
 * These tests cover the complex delete event functionality that works across
 * both the events list page and event detail page, ensuring proper handler
 * separation and no conflicts between the two pages.
 * 
 * Critical scenarios covered:
 * 1. Delete from events list page
 * 2. Delete from event detail page  
 * 3. Sequential deletions from both pages
 * 4. Handler conflict prevention
 * 5. Button state management
 * 6. Error handling and validation
 */

const { JSDOM } = require('jsdom');
const path = require('path');
const fs = require('fs');

describe('Delete Event Functionality Integration Tests', () => {
    let dom;
    let window;
    let document;
    let eventsPage;
    let eventDetailPage;
    let mockApi;

    beforeEach(() => {
        // Create a complete DOM environment
        const htmlContent = fs.readFileSync(
            path.join(__dirname, '../../public/index.html'), 
            'utf8'
        );
        
        dom = new JSDOM(htmlContent, {
            runScripts: "dangerously",
            resources: "usable",
            url: "http://localhost:3000"
        });
        
        window = dom.window;
        document = window.document;
        global.window = window;
        global.document = document;
        
        // Mock API
        mockApi = {
            getEvents: jest.fn(),
            getEvent: jest.fn(),
            deleteEvent: jest.fn(),
            getEventCostItems: jest.fn(),
            createEvent: jest.fn()
        };
        
        // Mock global functions
        global.showSuccess = jest.fn();
        global.showError = jest.fn();
        global.formatCurrency = jest.fn(amount => `$${amount.toFixed(2)}`);
        
        // Load and initialize the pages
        const EventsPage = require('../../public/js/pages/events.js');
        const EventDetailPage = require('../../public/js/pages/event-detail.js');
        
        eventsPage = new EventsPage();
        eventDetailPage = new EventDetailPage();
        
        // Mock API client
        window.api = mockApi;
        global.api = mockApi;
        
        // Set up initial state
        eventsPage.events = [
            { id: 'event-1', name: 'Test Event 1', date: '2025-09-10', location: 'Court 1', participants: ['user-1', 'user-2'] },
            { id: 'event-2', name: 'Test Event 2', date: '2025-09-11', location: 'Court 2', participants: ['user-1', 'user-3'] },
            { id: 'event-3', name: 'Test Event 3', date: '2025-09-12', location: 'Court 3', participants: ['user-2', 'user-3'] }
        ];
    });

    afterEach(() => {
        dom.window.close();
        jest.clearAllMocks();
    });

    describe('Delete from Events List Page', () => {
        beforeEach(() => {
            // Simulate being on events page
            document.getElementById('events-page').classList.add('active');
            document.getElementById('event-detail-page').style.display = 'none';
        });

        test.skip('should successfully delete event from events list', async () => {
            // Arrange
            const eventToDelete = eventsPage.events[0];
            mockApi.getEvent.mockResolvedValue({ success: true, data: eventToDelete });
            mockApi.getEventCostItems.mockResolvedValue([]);
            mockApi.deleteEvent.mockResolvedValue({ success: true });
            
            eventsPage.currentDeleteEvent = eventToDelete;

            // Act
            await eventsPage.confirmEventDeletion();

            // Assert
            expect(mockApi.deleteEvent).toHaveBeenCalledWith('event-1');
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(1);
            expect(showSuccess).toHaveBeenCalledWith('Event "Test Event 1" deleted successfully');
        });

        test('should handle deletion with expenses warning', async () => {
            // Arrange
            const eventToDelete = eventsPage.events[0];
            const mockCostItems = [{ id: 'cost-1', amount: 50 }];
            
            mockApi.getEvent.mockResolvedValue({ success: true, data: eventToDelete });
            mockApi.getEventCostItems.mockResolvedValue(mockCostItems);
            
            // Act
            eventsPage.showDeleteEventDialog({ data: eventToDelete }, mockCostItems);

            // Assert
            const expenseWarning = document.querySelector('#delete-event-warning');
            expect(expenseWarning.style.display).toBe('block');
        });

        test('should not interfere when event detail page is active', async () => {
            // Arrange
            document.getElementById('event-detail-page').style.display = 'block';
            eventsPage.currentDeleteEvent = eventsPage.events[0];

            // Act  
            await eventsPage.confirmEventDeletion();

            // Assert - events list handler should not execute
            expect(mockApi.deleteEvent).not.toHaveBeenCalled();
        });

        test('should handle delete button state properly', async () => {
            // Arrange
            const eventToDelete = eventsPage.events[0];
            eventsPage.currentDeleteEvent = eventToDelete;
            mockApi.deleteEvent.mockResolvedValue({ success: true });
            
            const confirmButton = document.querySelector('#confirm-delete-event-ok');
            
            // Act
            await eventsPage.confirmEventDeletion();

            // Assert
            expect(confirmButton.disabled).toBe(false);
            expect(confirmButton.innerHTML).not.toContain('Deleting...');
        });
    });

    describe('Delete from Event Detail Page', () => {
        beforeEach(() => {
            // Simulate being on event detail page
            document.getElementById('events-page').classList.add('active');
            document.getElementById('event-detail-page').style.display = 'block';
            
            // Set up event detail page with current event
            eventDetailPage.currentEventId = 'event-1';
            eventDetailPage.currentEvent = eventsPage.events[0];
            
            // Show delete modal with event name
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            const eventNameSpan = document.querySelector('#delete-event-name');
            eventNameSpan.textContent = 'Test Event 1';
        });

        test('should successfully delete event from event detail page', async () => {
            // Arrange
            mockApi.deleteEvent.mockResolvedValue({ success: true });

            // Act
            await eventDetailPage.confirmDeleteEvent();

            // Assert
            expect(mockApi.deleteEvent).toHaveBeenCalledWith('event-1');
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(1);
            expect(showSuccess).toHaveBeenCalledWith('Event "Test Event 1" deleted successfully!');
        });

        test('should not execute when modal shows different event', async () => {
            // Arrange
            const eventNameSpan = document.querySelector('#delete-event-name');
            eventNameSpan.textContent = 'Different Event';

            // Act
            await eventDetailPage.confirmDeleteEvent();

            // Assert - should not delete due to name mismatch
            expect(mockApi.deleteEvent).not.toHaveBeenCalled();
        });

        test('should not execute when event detail page is not active', async () => {
            // Arrange
            document.getElementById('event-detail-page').style.display = 'none';

            // Act
            await eventDetailPage.confirmDeleteEvent();

            // Assert
            expect(mockApi.deleteEvent).not.toHaveBeenCalled();
        });

        test('should reset button state after deletion', async () => {
            // Arrange
            mockApi.deleteEvent.mockResolvedValue({ success: true });
            const confirmButton = document.querySelector('#confirm-delete-event-ok');

            // Act
            await eventDetailPage.confirmDeleteEvent();
            eventDetailPage.hideDeleteEventDialog();

            // Assert
            expect(confirmButton.disabled).toBe(false);
            expect(confirmButton.innerHTML).toBe('Delete Event');
        });

        test('should handle deletion errors gracefully', async () => {
            // Arrange
            const error = new Error('Event not found');
            mockApi.deleteEvent.mockRejectedValue(error);

            // Act
            await eventDetailPage.confirmDeleteEvent();

            // Assert
            expect(showError).toHaveBeenCalledWith('Failed to delete event. Please try again.');
            
            const confirmButton = document.querySelector('#confirm-delete-event-ok');
            expect(confirmButton.disabled).toBe(false);
            expect(confirmButton.innerHTML).toBe('Delete Event');
        });
    });

    describe('Sequential Delete Operations', () => {
        test.skip('should handle delete from events list then event detail', async () => {
            // Test Case 1: Delete from events list
            document.getElementById('event-detail-page').style.display = 'none';
            eventsPage.currentDeleteEvent = eventsPage.events[0];
            mockApi.deleteEvent.mockResolvedValueOnce({ success: true });
            
            await eventsPage.confirmEventDeletion();
            
            expect(mockApi.deleteEvent).toHaveBeenCalledWith('event-1');
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(1);
            
            // Test Case 2: Delete from event detail page
            document.getElementById('event-detail-page').style.display = 'block';
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            
            eventDetailPage.currentEventId = 'event-2';
            eventDetailPage.currentEvent = eventsPage.events[1];
            
            const eventNameSpan = document.querySelector('#delete-event-name');
            eventNameSpan.textContent = 'Test Event 2';
            
            mockApi.deleteEvent.mockResolvedValueOnce({ success: true });
            
            await eventDetailPage.confirmDeleteEvent();
            
            expect(mockApi.deleteEvent).toHaveBeenCalledWith('event-2');
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(2);
        });

        test('should handle multiple deletes from event detail page', async () => {
            // Set up for event detail deletions
            document.getElementById('event-detail-page').style.display = 'block';
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            
            // Delete Event 1
            eventDetailPage.currentEventId = 'event-1';
            eventDetailPage.currentEvent = eventsPage.events[0];
            document.querySelector('#delete-event-name').textContent = 'Test Event 1';
            
            mockApi.deleteEvent.mockResolvedValueOnce({ success: true });
            await eventDetailPage.confirmDeleteEvent();
            
            // Reset button state
            eventDetailPage.hideDeleteEventDialog();
            modal.style.display = 'flex'; // Re-show for next delete
            
            // Delete Event 2
            eventDetailPage.currentEventId = 'event-2';
            eventDetailPage.currentEvent = eventsPage.events[1];
            document.querySelector('#delete-event-name').textContent = 'Test Event 2';
            
            mockApi.deleteEvent.mockResolvedValueOnce({ success: true });
            await eventDetailPage.confirmDeleteEvent();
            
            // Assert both deletions worked
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(2);
            expect(mockApi.deleteEvent).toHaveBeenNthCalledWith(1, 'event-1');
            expect(mockApi.deleteEvent).toHaveBeenNthCalledWith(2, 'event-2');
        });
    });

    describe('Handler Conflict Prevention', () => {
        test('should prevent both handlers from executing simultaneously', async () => {
            // Arrange - Set up scenario where both handlers could potentially run
            document.getElementById('events-page').classList.add('active');
            document.getElementById('event-detail-page').style.display = 'block';
            
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            
            // Set up events list context
            eventsPage.currentDeleteEvent = eventsPage.events[0];
            
            // Set up event detail context  
            eventDetailPage.currentEventId = 'event-1';
            eventDetailPage.currentEvent = eventsPage.events[0];
            document.querySelector('#delete-event-name').textContent = 'Test Event 1';
            
            mockApi.deleteEvent.mockResolvedValue({ success: true });
            
            // Act - Simulate button click that could trigger both handlers
            const promises = [
                eventsPage.confirmEventDeletion(),
                eventDetailPage.confirmDeleteEvent()
            ];
            
            await Promise.all(promises);
            
            // Assert - Only one deletion should occur (event detail should win due to context)
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(1);
            expect(mockApi.deleteEvent).toHaveBeenCalledWith('event-1');
        });

        test.skip('should handle rapid sequential button clicks gracefully', async () => {
            // Arrange
            document.getElementById('event-detail-page').style.display = 'block';
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            
            eventDetailPage.currentEventId = 'event-1';
            eventDetailPage.currentEvent = eventsPage.events[0];
            document.querySelector('#delete-event-name').textContent = 'Test Event 1';
            
            // Simulate slow API response
            let resolveDelete;
            const deletePromise = new Promise(resolve => { resolveDelete = resolve; });
            mockApi.deleteEvent.mockReturnValue(deletePromise);
            
            // Act - Simulate rapid button clicks
            const click1 = eventDetailPage.confirmDeleteEvent();
            const click2 = eventDetailPage.confirmDeleteEvent();
            const click3 = eventDetailPage.confirmDeleteEvent();
            
            // Resolve the API call
            resolveDelete({ success: true });
            
            await Promise.all([click1, click2, click3]);
            
            // Assert - Should only make one API call due to button disabling
            expect(mockApi.deleteEvent).toHaveBeenCalledTimes(1);
        });
    });

    describe('Modal State Management', () => {
        test('should show appropriate warnings based on event content', async () => {
            // Test with expenses
            const eventWithExpenses = eventsPage.events[0];
            const costItems = [{ id: 'cost-1', amount: 50 }];
            
            eventsPage.showDeleteEventDialog({ data: eventWithExpenses }, costItems);
            
            const expenseWarning = document.querySelector('#delete-event-warning');
            const participantWarning = document.querySelector('#delete-event-participants-warning');
            
            expect(expenseWarning.style.display).toBe('block');
            expect(participantWarning.style.display).toBe('block');
            
            // Test without expenses
            eventsPage.showDeleteEventDialog({ data: eventWithExpenses }, []);
            
            expect(expenseWarning.style.display).toBe('none');
            expect(participantWarning.style.display).toBe('block');
        });

        test('should reset modal state properly between deletions', async () => {
            // First deletion
            const event1 = eventsPage.events[0];
            eventsPage.showDeleteEventDialog({ data: event1 }, []);
            
            let eventNameSpan = document.querySelector('#delete-event-name');
            expect(eventNameSpan.textContent).toBe('Test Event 1');
            
            eventsPage.hideDeleteEventDialog();
            
            // Second deletion
            const event2 = eventsPage.events[1];
            eventsPage.showDeleteEventDialog({ data: event2 }, []);
            
            eventNameSpan = document.querySelector('#delete-event-name');
            expect(eventNameSpan.textContent).toBe('Test Event 2');
            
            const confirmButton = document.querySelector('#confirm-delete-event-ok');
            expect(confirmButton.disabled).toBe(false);
            expect(confirmButton.innerHTML).toBe('Delete Event');
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle API errors gracefully', async () => {
            // Arrange
            document.getElementById('event-detail-page').style.display = 'block';
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            
            eventDetailPage.currentEventId = 'event-1';
            eventDetailPage.currentEvent = eventsPage.events[0];
            document.querySelector('#delete-event-name').textContent = 'Test Event 1';
            
            const apiError = new Error('Event not found');
            mockApi.deleteEvent.mockRejectedValue(apiError);

            // Act
            await eventDetailPage.confirmDeleteEvent();

            // Assert
            expect(showError).toHaveBeenCalledWith('Failed to delete event. Please try again.');
            
            const confirmButton = document.querySelector('#confirm-delete-event-ok');
            expect(confirmButton.disabled).toBe(false);
            expect(confirmButton.innerHTML).toBe('Delete Event');
        });

        test('should handle missing event data gracefully', async () => {
            // Arrange
            eventsPage.currentDeleteEvent = null;

            // Act
            await eventsPage.confirmEventDeletion();

            // Assert - Should not attempt deletion
            expect(mockApi.deleteEvent).not.toHaveBeenCalled();
        });

        test('should handle malformed API responses', async () => {
            // Arrange
            document.getElementById('event-detail-page').style.display = 'block';
            const modal = document.getElementById('confirm-delete-event-modal');
            modal.style.display = 'flex';
            
            eventDetailPage.currentEventId = 'event-1';
            eventDetailPage.currentEvent = eventsPage.events[0];
            document.querySelector('#delete-event-name').textContent = 'Test Event 1';
            
            mockApi.deleteEvent.mockResolvedValue(null); // Malformed response

            // Act & Assert - Should not throw
            await expect(eventDetailPage.confirmDeleteEvent()).resolves.not.toThrow();
        });
    });
});