class EventsPage {
    constructor() {
        this.events = [];
        this.isInitialized = false;
        this.currentEditEvent = null;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.elements = {
            loading: document.getElementById('events-loading'),
            list: document.getElementById('events-list'),
            empty: document.getElementById('events-empty'),
            totalCount: document.getElementById('total-events-count'),
            addButton: document.getElementById('add-event-btn')
        };
        
        this.bindEvents();
        this.isInitialized = true;
    }

    bindEvents() {
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => {
                this.showAddEventDialog();
            });
        }
    }

    async loadEvents() {
        try {
            this.showLoading();
            
            const response = await api.getEvents();
            // The API returns { success: true, data: [...], count: N }
            const events = response.data || response || [];
            this.events = events;
            
            if (events.length === 0) {
                this.showEmptyState();
            } else {
                this.renderEvents(events);
            }
            
            this.updateStats();
        } catch (error) {
            console.error('Failed to load events:', error);
            showError('Failed to load events. Please try again.');
            this.showEmptyState();
        }
    }

    renderEvents(events) {
        if (!this.elements.list) return;
        
        const eventsHtml = events.map(event => this.createEventCard(event)).join('');
        this.elements.list.innerHTML = eventsHtml;
        
        this.bindEventActions();
        this.showEventsList();
    }

    createEventCard(event) {
        const eventDate = new Date(event.date);
        const today = new Date();
        const isUpcoming = eventDate > today;
        const isToday = eventDate.toDateString() === today.toDateString();
        
        const status = this.getEventStatus(event, eventDate, today);
        
        return `
            <div class="event-card fade-in" data-event-id="${event.id}">
                <div class="event-card-header">
                    <div class="event-info">
                        <h3>${event.name}</h3>
                        <div class="event-meta">
                            <div class="event-date">📅 ${this.formatEventDate(eventDate)}</div>
                            <div class="event-location">📍 ${event.location || 'Location TBD'}</div>
                        </div>
                        ${event.description ? `<div class="event-description">${event.description}</div>` : ''}
                    </div>
                    <div class="event-actions">
                        <button class="btn btn-sm btn-outline view-event-btn" data-event-id="${event.id}" title="View event details">
                            👁️
                        </button>
                        <button class="btn btn-sm btn-outline edit-event-btn" data-event-id="${event.id}" title="Edit event">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger delete-event-btn" data-event-id="${event.id}" title="Delete event">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="event-stats">
                    <div class="event-stat">
                        <span class="stat-label">Participants</span>
                        <span class="stat-value">${event.participantCount || event.participants?.length || 0}</span>
                    </div>
                    <div class="event-stat">
                        <span class="stat-label">Status</span>
                        <span class="status-badge ${status.class}">${status.text}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getEventStatus(event, eventDate, today) {
        const isToday = eventDate.toDateString() === today.toDateString();
        const isUpcoming = eventDate > today;
        const isPast = eventDate < today;
        
        if (isToday) {
            return {
                class: 'status-active',
                text: 'Today'
            };
        } else if (isUpcoming) {
            const daysUntil = Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
            return {
                class: 'status-upcoming',
                text: daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`
            };
        } else {
            return {
                class: 'status-completed',
                text: 'Completed'
            };
        }
    }

    formatEventDate(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
            });
        }
    }

    bindEventActions() {
        // Bind view buttons
        const viewButtons = document.querySelectorAll('.view-event-btn');
        viewButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const eventId = button.dataset.eventId;
                this.viewEventDetails(eventId);
            });
        });

        // Bind edit buttons
        const editButtons = document.querySelectorAll('.edit-event-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const eventId = button.dataset.eventId;
                this.editEvent(eventId);
            });
        });

        // Bind delete buttons
        const deleteButtons = document.querySelectorAll('.delete-event-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const eventId = button.dataset.eventId;
                this.deleteEvent(eventId);
            });
        });

        // Bind card click for event details (excluding button areas)
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.event-actions')) {
                    const eventId = card.dataset.eventId;
                    this.viewEventDetails(eventId);
                }
            });
        });
    }

    showLoading() {
        if (this.elements.loading) this.elements.loading.style.display = 'block';
        if (this.elements.list) this.elements.list.style.display = 'none';
        if (this.elements.empty) this.elements.empty.style.display = 'none';
    }

    showEventsList() {
        if (this.elements.loading) this.elements.loading.style.display = 'none';
        if (this.elements.list) this.elements.list.style.display = 'block';
        if (this.elements.empty) this.elements.empty.style.display = 'none';
    }

    showEmptyState() {
        if (this.elements.loading) this.elements.loading.style.display = 'none';
        if (this.elements.list) this.elements.list.style.display = 'none';
        if (this.elements.empty) this.elements.empty.style.display = 'block';
    }

    updateStats() {
        if (this.elements.totalCount) {
            this.elements.totalCount.textContent = this.events.length;
        }
    }

    async refresh() {
        await this.loadEvents();
    }

    // Placeholder methods for future implementation
    showAddEventDialog() {
        console.log('Add event dialog - coming in Phase 4.2');
        showError('Create Event form coming soon!');
    }

    viewEventDetails(eventId) {
        console.log('View event details:', eventId);
        showError('Event details view coming in Phase 4.3!');
    }

    editEvent(eventId) {
        console.log('Edit event:', eventId);
        showError('Edit Event form coming in Phase 4.4!');
    }

    deleteEvent(eventId) {
        console.log('Delete event:', eventId);
        showError('Delete Event functionality coming in Phase 4.4!');
    }

    findEventById(eventId) {
        return this.events.find(event => event.id === eventId);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.eventsPage = new EventsPage();
    
    // Hook into navigation system to refresh events when page is shown
    const originalNavigateToPage = navigation.navigateToPage;
    navigation.navigateToPage = function(pageId) {
        originalNavigateToPage.call(this, pageId);
        
        if (pageId === 'events' && window.eventsPage) {
            window.eventsPage.refresh();
        }
    };
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventsPage;
}