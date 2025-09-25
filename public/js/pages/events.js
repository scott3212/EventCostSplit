class EventsPage {
    constructor() {
        this.events = [];
        this.users = [];
        this.selectedParticipants = new Set();
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
            addButton: document.getElementById('add-event-btn'),
            emptyStateAddButton: document.getElementById('empty-state-add-event-btn'),
            container: document.querySelector('.events-container'),
            detailedViewToggle: document.getElementById('events-detailed-view'),
            compactViewToggle: document.getElementById('events-compact-view'),
            hideCompletedToggle: document.getElementById('hide-completed-events'),
            // Add Event Modal elements
            addModal: document.getElementById('add-event-modal'),
            addForm: document.getElementById('add-event-form'),
            addClose: document.getElementById('add-event-close'),
            addCancel: document.getElementById('add-event-cancel'),
            addSave: document.getElementById('add-event-save'),
            addSpinner: document.getElementById('add-event-spinner'),
            addSaveText: document.getElementById('add-event-save-text'),
            // Form inputs
            nameInput: document.getElementById('event-name'),
            dateInput: document.getElementById('event-date'),
            locationInput: document.getElementById('event-location'),
            descriptionInput: document.getElementById('event-description'),
            // Error elements
            nameError: document.getElementById('event-name-error'),
            dateError: document.getElementById('event-date-error'),
            locationError: document.getElementById('event-location-error'),
            // Participants selection
            participantsLoading: document.getElementById('participants-loading'),
            participantsList: document.getElementById('participants-list'),
            participantsError: document.getElementById('participants-error'),
            selectedParticipants: document.getElementById('selected-participants'),
            selectedParticipantsList: document.getElementById('selected-participants-list'),
            // Edit Event Modal elements
            editEventModal: document.getElementById('edit-event-modal'),
            editEventForm: document.getElementById('edit-event-form'),
            editEventClose: document.getElementById('edit-event-close'),
            // Edit event participants
            editCurrentParticipants: document.getElementById('edit-current-participants'),
            editAvailableParticipants: document.getElementById('edit-available-participants'),
            editParticipantsError: document.getElementById('edit-participants-error'),
            editParticipantsLoading: document.getElementById('edit-participants-loading'),
            editEventCancel: document.getElementById('edit-event-cancel'),
            editEventSave: document.getElementById('edit-event-save'),
            // Edit form inputs
            editEventName: document.getElementById('edit-event-name'),
            editEventDate: document.getElementById('edit-event-date'),
            editEventLocation: document.getElementById('edit-event-location'),
            editEventDescription: document.getElementById('edit-event-description'),
            // Edit error elements
            editEventNameError: document.getElementById('edit-event-name-error'),
            editEventDateError: document.getElementById('edit-event-date-error'),
            editEventLocationError: document.getElementById('edit-event-location-error')
        };
        
        this.bindEvents();
        this.loadViewPreference();
        this.loadHideCompletedPreference();
        this.isInitialized = true;
    }

    bindEvents() {
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => {
                this.showAddEventDialog();
            });
        }
        
        if (this.elements.emptyStateAddButton) {
            this.elements.emptyStateAddButton.addEventListener('click', () => {
                this.showAddEventDialog();
            });
        }

        // View toggle events
        if (this.elements.detailedViewToggle) {
            this.elements.detailedViewToggle.addEventListener('change', () => {
                this.toggleView('detailed');
            });
        }

        if (this.elements.compactViewToggle) {
            this.elements.compactViewToggle.addEventListener('change', () => {
                this.toggleView('compact');
            });
        }

        // Hide completed events toggle
        if (this.elements.hideCompletedToggle) {
            this.elements.hideCompletedToggle.addEventListener('change', () => {
                this.toggleCompletedEvents();
            });
        }

        // Modal close events
        if (this.elements.addClose) {
            this.elements.addClose.addEventListener('click', () => {
                this.hideAddEventDialog();
            });
        }

        if (this.elements.addCancel) {
            this.elements.addCancel.addEventListener('click', () => {
                this.hideAddEventDialog();
            });
        }

        // Modal backdrop click
        if (this.elements.addModal) {
            this.elements.addModal.addEventListener('click', (e) => {
                if (e.target === this.elements.addModal) {
                    this.hideAddEventDialog();
                }
            });
        }

        // Form submission
        if (this.elements.addSave) {
            this.elements.addSave.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddEvent();
            });
        }

        if (this.elements.addForm) {
            this.elements.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddEvent();
            });
        }

        // Real-time validation
        if (this.elements.nameInput) {
            this.elements.nameInput.addEventListener('blur', () => {
                this.validateName();
            });
            this.elements.nameInput.addEventListener('input', () => {
                this.clearError('event-name');
            });
        }

        if (this.elements.dateInput) {
            this.elements.dateInput.addEventListener('blur', () => {
                this.validateDate();
            });
            this.elements.dateInput.addEventListener('input', () => {
                this.clearError('event-date');
            });
        }

        if (this.elements.locationInput) {
            this.elements.locationInput.addEventListener('blur', () => {
                this.validateLocation();
            });
            this.elements.locationInput.addEventListener('input', () => {
                this.clearError('event-location');
            });
        }

        // Edit Event Modal events
        if (this.elements.editEventClose) {
            this.elements.editEventClose.addEventListener('click', () => {
                this.hideEditEventDialog();
            });
        }

        if (this.elements.editEventCancel) {
            this.elements.editEventCancel.addEventListener('click', () => {
                this.hideEditEventDialog();
            });
        }

        if (this.elements.editEventSave) {
            this.elements.editEventSave.addEventListener('click', (e) => {
                console.log('[EVENTS.JS] Save button clicked', {
                    eventsPageHidden: document.getElementById('events-page')?.hidden,
                    currentEditEvent: this.currentEditEvent?.id,
                    eventExists: !!this.currentEditEvent
                });
                e.preventDefault();
                // Only handle if we're on the events page and have a current edit event
                const eventsPage = document.getElementById('events-page');
                if (eventsPage && !eventsPage.hidden && this.currentEditEvent) {
                    console.log('[EVENTS.JS] Executing handleEditEvent from save button');
                    this.handleEditEvent();
                } else {
                    console.log('[EVENTS.JS] Save button ignored - not on events page or no current event');
                }
            });
        }

        if (this.elements.editEventForm) {
            this.elements.editEventForm.addEventListener('submit', (e) => {
                console.log('[EVENTS.JS] Form submit triggered', {
                    eventsPageHidden: document.getElementById('events-page')?.hidden,
                    currentEditEvent: this.currentEditEvent?.id,
                    eventExists: !!this.currentEditEvent,
                    submitterElement: e.submitter?.tagName + '#' + e.submitter?.id
                });
                e.preventDefault();
                // Only handle if we're on the events page and have a current edit event
                const eventsPage = document.getElementById('events-page');
                if (eventsPage && !eventsPage.hidden && this.currentEditEvent) {
                    console.log('[EVENTS.JS] Executing handleEditEvent from form submit');
                    this.handleEditEvent();
                } else {
                    console.log('[EVENTS.JS] Form submit ignored - not on events page or no current event');
                }
            });
        }

        // Edit modal backdrop click
        if (this.elements.editEventModal) {
            this.elements.editEventModal.addEventListener('click', (e) => {
                if (e.target === this.elements.editEventModal) {
                    this.hideEditEventDialog();
                }
            });
        }

        // Edit form validation events
        if (this.elements.editEventName) {
            this.elements.editEventName.addEventListener('input', () => this.clearEditEventError('name'));
        }
        if (this.elements.editEventDate) {
            this.elements.editEventDate.addEventListener('change', () => this.clearEditEventError('date'));
        }
        if (this.elements.editEventLocation) {
            this.elements.editEventLocation.addEventListener('input', () => this.clearEditEventError('location'));
        }

        // Delete confirmation modal events - Store references for cleanup
        this.deleteModalHandlers = {
            confirm: null,
            cancel: null,
            close: null,
            backdrop: null
        };
        
        // Don't bind modal events during construction - only during refresh
    }

    bindDeleteModalEvents() {
        const deleteModal = document.getElementById('confirm-delete-event-modal');
        if (!deleteModal) return;
        
        // Only bind if we're on events page AND event detail is not active
        const currentPage = document.querySelector('.page.active')?.id;
        const eventDetailPage = document.getElementById('event-detail-page');
        const isEventDetailActive = eventDetailPage && eventDetailPage.style.display !== 'none';
        
        if (currentPage !== 'events-page' || isEventDetailActive) {
            return;
        }
        
        const confirmButton = deleteModal.querySelector('#confirm-delete-event-ok');
        const cancelButton = deleteModal.querySelector('#confirm-delete-event-cancel');
        const closeButton = deleteModal.querySelector('#confirm-delete-event-close');

        // Add event listeners without cloning to preserve existing handlers from other pages
        if (confirmButton) {
            // Remove our previous handler if it exists
            if (this.deleteModalHandlers.confirm) {
                confirmButton.removeEventListener('click', this.deleteModalHandlers.confirm);
            }
            
            this.deleteModalHandlers.confirm = (e) => {
                e.preventDefault();
                this.confirmEventDeletion();
            };
            
            // Add our handler alongside existing ones
            confirmButton.addEventListener('click', this.deleteModalHandlers.confirm);
        }

        if (cancelButton) {
            if (this.deleteModalHandlers.cancel) {
                cancelButton.removeEventListener('click', this.deleteModalHandlers.cancel);
            }
            
            this.deleteModalHandlers.cancel = () => {
                this.hideDeleteEventDialog();
            };
            cancelButton.addEventListener('click', this.deleteModalHandlers.cancel);
        }

        if (closeButton) {
            if (this.deleteModalHandlers.close) {
                closeButton.removeEventListener('click', this.deleteModalHandlers.close);
            }
            
            this.deleteModalHandlers.close = () => {
                this.hideDeleteEventDialog();
            };
            closeButton.addEventListener('click', this.deleteModalHandlers.close);
        }

        // Modal backdrop click
        if (this.deleteModalHandlers.backdrop) {
            deleteModal.removeEventListener('click', this.deleteModalHandlers.backdrop);
        }
        
        this.deleteModalHandlers.backdrop = (e) => {
            if (e.target === deleteModal) {
                this.hideDeleteEventDialog();
            }
        };
        deleteModal.addEventListener('click', this.deleteModalHandlers.backdrop);
    }

    async loadPage() {
        await this.loadEvents();
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

        // Apply completed events filter if it's enabled
        if (this.elements.hideCompletedToggle?.checked) {
            this.applyCompletedEventsFilter();
        }
    }

    createEventCard(event) {
        const eventDate = this.parseDateSafely(event.date);
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

    parseDateSafely(dateString) {
        if (!dateString) return new Date();
        
        // Check if it's a date-only string (YYYY-MM-DD format)
        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateOnlyRegex.test(dateString)) {
            // For date-only strings, parse components manually to avoid timezone conversion
            const [year, month, day] = dateString.split('-').map(Number);
            return new Date(year, month - 1, day); // month is 0-indexed
        } else {
            // For full datetime strings, use regular Date parsing
            return new Date(dateString);
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
        if (this.elements.list) {
            this.elements.list.style.display = 'none';
            // CRITICAL FIX: Clear the list contents when showing empty state
            // This prevents old event cards from lingering in the DOM
            this.elements.list.innerHTML = '';
        }
        if (this.elements.empty) {
            this.elements.empty.style.display = 'block';
            // Reset empty state message to default
            this.resetEmptyStateMessage();
        }
    }

    resetEmptyStateMessage() {
        if (!this.elements.empty) return;

        const emptyMessage = this.elements.empty.querySelector('h2');
        if (emptyMessage) {
            emptyMessage.textContent = 'No Events Yet';
        }
        const emptyDescription = this.elements.empty.querySelector('p');
        if (emptyDescription) {
            emptyDescription.textContent = 'Create your first badminton event to get started with cost splitting.';
        }
    }

    updateStats() {
        if (this.elements.totalCount) {
            this.elements.totalCount.textContent = this.events.length;
        }
    }

    async refresh() {
        await this.loadEvents();
        // Ensure modal events are bound when we refresh on events page
        this.bindDeleteModalEvents();
    }

    toggleView(view) {
        if (!this.elements.container) return;
        
        if (view === 'compact') {
            this.elements.container.classList.add('compact-view');
        } else {
            this.elements.container.classList.remove('compact-view');
        }
        
        // Store preference in localStorage if available
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('eventsViewPreference', view);
        }
    }

    loadViewPreference() {
        if (typeof localStorage === 'undefined') return;

        const preference = localStorage.getItem('eventsViewPreference');
        if (preference === 'compact') {
            if (this.elements.compactViewToggle) {
                this.elements.compactViewToggle.checked = true;
                this.toggleView('compact');
            }
        }
    }

    loadHideCompletedPreference() {
        if (typeof localStorage === 'undefined') return;

        const hideCompleted = localStorage.getItem('hideCompletedEvents') === 'true';
        if (this.elements.hideCompletedToggle) {
            this.elements.hideCompletedToggle.checked = hideCompleted;
            if (hideCompleted) {
                this.applyCompletedEventsFilter();
            }
        }
    }

    toggleCompletedEvents() {
        const isHidden = this.elements.hideCompletedToggle?.checked || false;

        // Store preference in localStorage
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem('hideCompletedEvents', isHidden.toString());
        }

        if (isHidden) {
            this.applyCompletedEventsFilter();
        } else {
            this.removeCompletedEventsFilter();
        }
    }

    applyCompletedEventsFilter() {
        const eventCards = document.querySelectorAll('.event-card');
        let visibleCount = 0;

        eventCards.forEach(card => {
            const statusBadge = card.querySelector('.status-badge');
            if (statusBadge && statusBadge.classList.contains('status-completed')) {
                card.style.display = 'none';
            } else {
                card.style.display = '';
                visibleCount++;
            }
        });

        // Update the visible count or show empty state
        this.updateFilteredDisplay(visibleCount);
    }

    removeCompletedEventsFilter() {
        const eventCards = document.querySelectorAll('.event-card');
        eventCards.forEach(card => {
            card.style.display = '';
        });

        // Reset to normal display
        this.updateFilteredDisplay(this.events.length);
    }

    updateFilteredDisplay(visibleCount) {
        if (visibleCount === 0) {
            // Show a filtered empty state
            if (this.elements.list) this.elements.list.style.display = 'none';
            if (this.elements.empty) {
                this.elements.empty.style.display = 'block';
                // Temporarily update the empty message to indicate filtering
                const emptyMessage = this.elements.empty.querySelector('h2');
                if (emptyMessage) {
                    emptyMessage.textContent = 'No active events found';
                }
                const emptyDescription = this.elements.empty.querySelector('p');
                if (emptyDescription) {
                    emptyDescription.textContent = 'All events are completed. Uncheck "Hide Completed" to see them.';
                }
            }
        } else {
            if (this.elements.list) this.elements.list.style.display = 'block';
            if (this.elements.empty) this.elements.empty.style.display = 'none';
        }
    }

    async showAddEventDialog() {
        this.resetAddEventForm();
        await this.loadParticipants();
        
        if (this.elements.addModal) {
            this.elements.addModal.style.display = 'flex';
            this.elements.addModal.classList.add('fade-in');
            
            // Set default date to today
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            if (this.elements.dateInput) {
                this.elements.dateInput.value = todayStr;
            }
            
            // Focus on name input
            setTimeout(() => {
                if (this.elements.nameInput) {
                    this.elements.nameInput.focus();
                }
            }, 100);
        }
    }

    hideAddEventDialog() {
        if (this.elements.addModal) {
            this.elements.addModal.style.display = 'none';
            this.elements.addModal.classList.remove('fade-in');
        }
        this.resetAddEventForm();
    }

    resetAddEventForm() {
        if (this.elements.addForm) {
            this.elements.addForm.reset();
        }
        
        this.selectedParticipants.clear();
        this.updateSelectedParticipantsDisplay();
        this.clearAllErrors();
        this.setAddButtonState(false);
    }

    async loadParticipants() {
        console.log('[EVENTS.JS] loadParticipants() called');
        try {
            if (this.elements.participantsLoading) {
                this.elements.participantsLoading.style.display = 'block';
            }
            if (this.elements.participantsList) {
                this.elements.participantsList.style.display = 'none';
            }
            
            console.log('[EVENTS.JS] Fetching users from API...');
            const response = await api.getUsers();
            const users = response.data || response || [];
            this.users = users;
            console.log('[EVENTS.JS] Users loaded:', users.length, 'users');
            
            this.renderParticipants(users);
        } catch (error) {
            if (this.elements.participantsError) {
                this.elements.participantsError.textContent = 'Failed to load users. Please try again.';
                this.elements.participantsError.style.display = 'block';
            }
        } finally {
            if (this.elements.participantsLoading) {
                this.elements.participantsLoading.style.display = 'none';
            }
        }
    }

    renderParticipants(users) {
        console.log('[EVENTS.JS] renderParticipants() called with', users.length, 'users');
        console.log('[EVENTS.JS] participantsList element:', this.elements.participantsList ? 'exists' : 'missing');
        
        if (!this.elements.participantsList || users.length === 0) {
            console.log('[EVENTS.JS] No participants list or no users - showing error');
            if (this.elements.participantsError) {
                this.elements.participantsError.textContent = 'No users found. Please create users first.';
                this.elements.participantsError.style.display = 'block';
            }
            return;
        }
        
        console.log('[EVENTS.JS] Creating participant HTML for', users.length, 'users');
        const participantsHtml = users.map(user => {
            const isSelected = this.selectedParticipants.has(user.id);
            return ParticipantComponent.createSelectableItem(user, isSelected, user.id);
        }).join('');
        this.elements.participantsList.innerHTML = participantsHtml;
        this.elements.participantsList.style.display = 'block';

        console.log('[EVENTS.JS] Participant HTML rendered, binding events');
        this.bindParticipantEvents();
    }



    bindParticipantEvents() {
        // Use ParticipantComponent's centralized event binding
        ParticipantComponent.bindSelectionEvents('#participants-list', (userId, isSelected) => {
            if (isSelected) {
                this.selectedParticipants.add(userId);
            } else {
                this.selectedParticipants.delete(userId);
            }

            this.updateSelectedParticipantsDisplay();
            this.clearError('participants');
        });
    }

    updateSelectedParticipantsDisplay() {
        if (!this.elements.selectedParticipants || !this.elements.selectedParticipantsList) return;
        
        if (this.selectedParticipants.size === 0) {
            this.elements.selectedParticipants.style.display = 'none';
            return;
        }
        
        const selectedUsers = Array.from(this.selectedParticipants)
            .map(userId => this.users.find(user => user.id === userId))
            .filter(Boolean);
            
        const selectedHtml = selectedUsers.map(user => 
            `<div class="selected-participant" data-user-id="${user.id}">
                ${user.name}
                <button type="button" class="remove-btn" title="Remove participant">×</button>
            </div>`
        ).join('');
        
        this.elements.selectedParticipantsList.innerHTML = selectedHtml;
        this.elements.selectedParticipants.style.display = 'block';
        
        // Bind remove buttons
        const removeButtons = this.elements.selectedParticipantsList.querySelectorAll('.remove-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const userId = button.closest('.selected-participant').dataset.userId;
                this.selectedParticipants.delete(userId);
                this.updateSelectedParticipantsDisplay();
                
                // Update checkbox in participants list
                const participantItem = document.querySelector(`.participant-item[data-user-id="${userId}"]`);
                if (participantItem) {
                    participantItem.classList.remove('selected');
                    const checkbox = participantItem.querySelector('.participant-checkbox');
                    if (checkbox) checkbox.checked = false;
                }
            });
        });
    }

    viewEventDetails(eventId) {
        // Use router for navigation if available
        if (window.router) {
            const url = window.router.url('event-detail', { id: eventId });
            window.router.navigate(url);
        } else {
            // Fallback to direct navigation
            if (window.eventDetailPage) {
                window.eventDetailPage.showEvent(eventId);
            } else {
                console.error('Event detail page not initialized');
                showError('Event details page not available');
            }
        }
    }

    async editEvent(eventId) {
        console.log('Edit event:', eventId);
        
        try {
            // Find the event to edit
            const event = this.findEventById(eventId);
            if (!event) {
                showError('Event not found');
                return;
            }
            
            // Load full event details from API
            const response = await api.getEvent(eventId);
            if (!response.success) {
                showError(response.error || 'Failed to load event details');
                return;
            }
            
            this.currentEditEvent = response.data;
            this.showEditEventDialog();
        } catch (error) {
            console.error('Failed to load event for editing:', error);
            showError('Failed to load event details. Please try again.');
        }
    }

    async showEditEventDialog() {
        console.log('[EVENTS.JS] showEditEventDialog() called');
        if (!this.currentEditEvent) {
            console.log('[EVENTS.JS] No current edit event');
            showError('No event selected for editing');
            return;
        }

        console.log('[EVENTS.JS] Current edit event:', this.currentEditEvent);
        console.log('[EVENTS.JS] Users before loading participants:', this.users ? this.users.length : 'null');
        
        // Load participants for editing
        await this.loadParticipantManagement();
        
        console.log('[EVENTS.JS] Users after loading participants:', this.users ? this.users.length : 'null');
        
        this.populateEditEventForm();
        this.clearAllEditEventErrors();

        if (this.elements.editEventModal) {
            this.elements.editEventModal.style.display = 'flex';
            this.elements.editEventModal.classList.add('fade-in');
        }
    }

    hideEditEventDialog() {
        if (this.elements.editEventModal) {
            this.elements.editEventModal.style.display = 'none';
            this.elements.editEventModal.classList.remove('fade-in');
        }
        
        this.resetEditEventForm();
        this.currentEditEvent = null;
    }

    populateEditEventForm() {
        console.log('[EVENTS.JS] populateEditEventForm() called');
        if (!this.currentEditEvent) {
            console.log('[EVENTS.JS] No current edit event in populateEditEventForm');
            return;
        }

        if (this.elements.editEventName) {
            this.elements.editEventName.value = this.currentEditEvent.name || '';
        }

        if (this.elements.editEventDate) {
            // Convert date to YYYY-MM-DD format for date input
            let dateValue = '';
            if (this.currentEditEvent.date) {
                const date = new Date(this.currentEditEvent.date);
                dateValue = date.toISOString().split('T')[0];
            }
            this.elements.editEventDate.value = dateValue;
        }

        if (this.elements.editEventLocation) {
            this.elements.editEventLocation.value = this.currentEditEvent.location || '';
        }

        if (this.elements.editEventDescription) {
            this.elements.editEventDescription.value = this.currentEditEvent.description || '';
        }

        // Populate participants - clear current selection and select event participants
        this.selectedParticipants.clear();
        if (this.currentEditEvent.participants && Array.isArray(this.currentEditEvent.participants)) {
            console.log('[EVENTS.JS] Setting selected participants from event:', this.currentEditEvent.participants);
            this.currentEditEvent.participants.forEach(participantId => {
                this.selectedParticipants.add(participantId);
            });
        } else {
            console.log('[EVENTS.JS] No participants in current edit event or not an array');
        }
        
        console.log('[EVENTS.JS] Selected participants set:', Array.from(this.selectedParticipants));
        // Update participant UI to reflect current selections
        this.updateParticipantSelections();
        this.updateSelectedParticipantsDisplay();
    }

    updateParticipantSelections() {
        // Update visual state of participant items to match selectedParticipants set
        const participantItems = document.querySelectorAll('.participant-item');
        participantItems.forEach(item => {
            const userId = item.dataset.userId;
            if (this.selectedParticipants.has(userId)) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    }

    async handleEditEvent() {
        console.log('[EVENTS.JS] handleEditEvent called', {
            currentEditEvent: this.currentEditEvent?.id,
            eventExists: !!this.currentEditEvent
        });
        // Prevent execution if no event is currently being edited
        if (!this.currentEditEvent) {
            console.warn('[EVENTS.JS] handleEditEvent called but no event is currently being edited');
            return;
        }

        if (!this.validateEditEventForm()) {
            return;
        }

        this.setEditEventSaveButtonState(true);

        try {
            const formData = new FormData(this.elements.editEventForm);
            const eventData = {
                name: formData.get('name'),
                date: formData.get('date'),
                location: formData.get('location'),
                description: formData.get('description') || '',
                participants: Array.from(this.selectedParticipants)
            };

            const response = await api.updateEvent(this.currentEditEvent.id, eventData);
            
            if (response.success) {
                showSuccess(`Event "${response.data.name}" updated successfully!`);
                this.hideEditEventDialog();
                await this.refresh();
            } else {
                throw new Error(response.error || 'Failed to update event');
            }
            
        } catch (error) {
            console.error('Failed to update event:', error);
            
            if (error.message.includes('name already exists') || error.message.includes('name is not unique')) {
                this.showEditEventError('name', 'An event with this name already exists');
            } else if (error.message.includes('name')) {
                this.showEditEventError('name', 'Invalid event name');
            } else if (error.message.includes('date')) {
                this.showEditEventError('date', 'Invalid event date');
            } else if (error.message.includes('location')) {
                this.showEditEventError('location', 'Invalid event location');
            } else {
                showError(error.message || 'Failed to update event. Please try again.');
            }
        } finally {
            this.setEditEventSaveButtonState(false);
        }
    }

    validateEditEventForm() {
        let isValid = true;

        // Clear all errors first
        this.clearAllEditEventErrors();

        // Validate name
        if (!this.elements.editEventName.value.trim()) {
            this.showEditEventError('name', 'Event name is required');
            isValid = false;
        } else if (this.elements.editEventName.value.trim().length < 2) {
            this.showEditEventError('name', 'Event name must be at least 2 characters');
            isValid = false;
        }

        // Validate date
        if (!this.elements.editEventDate.value) {
            this.showEditEventError('date', 'Event date is required');
            isValid = false;
        }

        // Validate location
        if (!this.elements.editEventLocation.value.trim()) {
            this.showEditEventError('location', 'Location is required');
            isValid = false;
        } else if (this.elements.editEventLocation.value.trim().length < 2) {
            this.showEditEventError('location', 'Location must be at least 2 characters');
            isValid = false;
        }

        return isValid;
    }

    showEditEventError(field, message) {
        const errorElement = this.elements[`editEvent${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearEditEventError(field) {
        const errorElement = this.elements[`editEvent${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (errorElement) {
            errorElement.textContent = '';
            errorElement.style.display = 'none';
        }
    }

    clearAllEditEventErrors() {
        this.clearEditEventError('name');
        this.clearEditEventError('date');
        this.clearEditEventError('location');
    }

    resetEditEventForm() {
        if (this.elements.editEventForm) {
            this.elements.editEventForm.reset();
        }
        this.clearAllEditEventErrors();
    }

    setEditEventSaveButtonState(isLoading) {
        if (this.elements.editEventSave) {
            this.elements.editEventSave.disabled = isLoading;
            if (isLoading) {
                this.elements.editEventSave.innerHTML = '<span class="loading-spinner-sm"></span> Updating...';
            } else {
                this.elements.editEventSave.innerHTML = '<span class="btn-icon">✏️</span> Update Event';
            }
        }
    }

    async deleteEvent(eventId) {
        console.log('Delete event:', eventId);
        
        try {
            // Find the event details first
            const event = this.findEventById(eventId);
            if (!event) {
                showError('Event not found');
                return;
            }
            
            // Load event details to check for expenses
            const eventDetails = await api.getEvent(eventId);
            const costItems = await api.getEventCostItems(eventId);
            
            // Show confirmation modal with appropriate warnings
            this.showDeleteEventDialog(eventDetails, costItems);
            
        } catch (error) {
            console.error('Error preparing delete event:', error);
            showError('Failed to prepare event deletion. Please try again.');
        }
    }

    showDeleteEventDialog(event, costItems) {
        // Extract the actual event data from the API response wrapper
        const eventData = event.data || event;
        this.currentDeleteEvent = eventData;

        // Don't rebind modal events in showDeleteEventDialog - let refresh handle it
        // This prevents interference when called from event detail page
        
        const modal = document.getElementById('confirm-delete-event-modal');
        const eventNameSpan = modal.querySelector('#delete-event-name');
        const expenseWarning = modal.querySelector('#delete-event-warning');
        const participantWarning = modal.querySelector('#delete-event-participants-warning');
        const participantCountSpan = modal.querySelector('#delete-event-participant-count');
        const confirmButton = modal.querySelector('#confirm-delete-event-ok');
        
        // Set event name
        eventNameSpan.textContent = eventData.name;
        
        // Show appropriate warnings
        if (costItems && costItems.length > 0) {
            expenseWarning.style.display = 'block';
        } else {
            expenseWarning.style.display = 'none';
        }
        
        if (eventData.participants && eventData.participants.length > 0) {
            participantWarning.style.display = 'block';
            participantCountSpan.textContent = eventData.participants.length;
        } else {
            participantWarning.style.display = 'none';
        }
        
        // Reset button state
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Delete Event';
        
        // Show modal
        modal.style.display = 'block';
    }

    hideDeleteEventDialog() {
        const modal = document.getElementById('confirm-delete-event-modal');
        modal.style.display = 'none';
        this.currentDeleteEvent = null;
    }

    async confirmEventDeletion() {
        // IMMEDIATE Guard: Don't interfere if event detail page is active OR we don't have the right event
        const eventDetailPage = document.getElementById('event-detail-page');
        const isEventDetailActive = eventDetailPage && eventDetailPage.style.display !== 'none';
        
        // Also check if we're trying to delete from events list vs event detail context
        const currentPage = document.querySelector('.page.active')?.id;
        
        if (isEventDetailActive || currentPage !== 'events-page' || !this.currentDeleteEvent) {
            return; // Silently ignore - let event detail page handle it
        }
        const confirmButton = document.querySelector('#confirm-delete-event-ok');
        
        try {
            // Set loading state
            confirmButton.disabled = true;
            confirmButton.innerHTML = 'Deleting...';
            
            const eventName = this.currentDeleteEvent.name; // Store name before clearing
            await api.deleteEvent(this.currentDeleteEvent.id);
            
            this.hideDeleteEventDialog();
            await this.refresh();
            
            showSuccess(`Event "${eventName}" deleted successfully`);
            
        } catch (error) {
            console.error('Failed to delete event:', error);
            
            // Reset button state
            confirmButton.disabled = false;
            confirmButton.innerHTML = 'Delete Event';
            
            if (error.message.includes('existing expenses') || error.message.includes('has cost items') || error.message.includes('has expenses')) {
                // Use the specific error message from the backend
                showError(error.message);
            } else {
                showError('Failed to delete event. Please try again.');
            }
        }
    }

    findEventById(eventId) {
        return this.events.find(event => event.id === eventId);
    }

    // Add Event Form Methods
    async handleAddEvent() {
        if (!this.validateForm()) {
            return;
        }

        try {
            this.setAddButtonState(true);

            const eventData = {
                name: this.elements.nameInput.value.trim(),
                date: this.elements.dateInput.value,
                location: this.elements.locationInput.value.trim(),
                description: this.elements.descriptionInput.value.trim() || null,
                participants: Array.from(this.selectedParticipants)
            };

            const newEvent = await api.createEvent(eventData);
            
            this.hideAddEventDialog();
            await this.refresh();
            
            showSuccess(`Event "${newEvent.name}" created successfully!`);
            
        } catch (error) {
            if (error.message.includes('name already exists') || error.message.includes('name is not unique')) {
                this.showError('event-name', 'An event with this name already exists');
            } else {
                showError('Failed to create event. Please try again.');
            }
        } finally {
            this.setAddButtonState(false);
        }
    }

    validateForm() {
        let isValid = true;

        if (!this.validateName()) isValid = false;
        if (!this.validateDate()) isValid = false;
        if (!this.validateLocation()) isValid = false;
        if (!this.validateParticipants()) isValid = false;

        return isValid;
    }

    validateName() {
        const name = this.elements.nameInput?.value?.trim();
        
        if (!name) {
            this.showError('event-name', 'Event name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showError('event-name', 'Event name must be at least 2 characters long');
            return false;
        }
        
        if (name.length > 100) {
            this.showError('event-name', 'Event name cannot be longer than 100 characters');
            return false;
        }
        
        this.clearError('event-name');
        return true;
    }

    validateDate() {
        const date = this.elements.dateInput?.value;

        if (!date) {
            this.showError('event-date', 'Event date is required');
            return false;
        }

        const eventDate = this.parseDateSafely(date);
        if (!eventDate || isNaN(eventDate.getTime())) {
            this.showError('event-date', 'Invalid date format');
            return false;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Set event date to start of day for proper comparison
        eventDate.setHours(0, 0, 0, 0);

        if (eventDate < today) {
            this.showError('event-date', 'Event date cannot be in the past');
            return false;
        }

        this.clearError('event-date');
        return true;
    }

    validateLocation() {
        const location = this.elements.locationInput?.value?.trim();
        
        if (!location) {
            this.showError('event-location', 'Location is required');
            return false;
        }
        
        if (location.length < 2) {
            this.showError('event-location', 'Location must be at least 2 characters long');
            return false;
        }
        
        if (location.length > 200) {
            this.showError('event-location', 'Location cannot be longer than 200 characters');
            return false;
        }
        
        this.clearError('event-location');
        return true;
    }

    validateParticipants() {
        if (this.selectedParticipants.size === 0) {
            this.showError('participants', 'Please select at least one participant');
            return false;
        }
        
        this.clearError('participants');
        return true;
    }

    showError(field, message) {
        let errorElement;
        
        if (field === 'participants') {
            errorElement = this.elements.participantsError;
        } else {
            errorElement = this.elements[`${field.replace('event-', '')}Error`];
        }
        
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        // Highlight input field for form fields
        if (field !== 'participants') {
            const inputElement = this.elements[`${field.replace('event-', '')}Input`];
            if (inputElement) {
                inputElement.style.borderColor = '#ef4444';
            }
        }
    }

    clearError(field) {
        let errorElement;
        
        if (field === 'participants') {
            errorElement = this.elements.participantsError;
        } else {
            errorElement = this.elements[`${field.replace('event-', '')}Error`];
        }
        
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        
        // Reset input field border
        if (field !== 'participants') {
            const inputElement = this.elements[`${field.replace('event-', '')}Input`];
            if (inputElement) {
                inputElement.style.borderColor = '';
            }
        }
    }

    clearAllErrors() {
        this.clearError('event-name');
        this.clearError('event-date');
        this.clearError('event-location');
        this.clearError('participants');
    }

    setAddButtonState(loading) {
        if (this.elements.addSave) {
            this.elements.addSave.disabled = loading;
        }
        
        if (this.elements.addSpinner) {
            this.elements.addSpinner.style.display = loading ? 'inline-block' : 'none';
        }
        
        if (this.elements.addSaveText) {
            this.elements.addSaveText.textContent = loading ? 'Creating...' : 'Create Event';
        }
    }

    async loadPage() {
        // Preload users data for participant selection
        try {
            const response = await api.getUsers();
            this.users = response.data || response || [];
        } catch (error) {
            console.error('Failed to preload users:', error);
            // Don't block page loading if user fetch fails
        }
        
        // Refresh events data
        await this.refresh();
    }


    // Participant Management Methods (adapted from EventDetailPage)
    async loadParticipantManagement() {
        if (this.elements.editParticipantsLoading) {
            this.elements.editParticipantsLoading.style.display = 'block';
        }

        try {
            // Get all users and current event expenses
            const [allUsers, eventExpenses] = await Promise.all([
                api.getUsers(),
                api.getEventCostItems(this.currentEditEvent.id)
            ]);

            // Create a set of participant IDs who have expenses
            const participantsWithExpenses = new Set();
            if (eventExpenses && eventExpenses.length > 0) {
                eventExpenses.forEach(expense => {
                    if (expense.paidBy) {
                        participantsWithExpenses.add(expense.paidBy);
                    }
                    if (expense.splitPercentage) {
                        Object.keys(expense.splitPercentage).forEach(participantId => {
                            if (expense.splitPercentage[participantId] > 0) {
                                participantsWithExpenses.add(participantId);
                            }
                        });
                    }
                });
            }

            // Render current participants
            this.renderCurrentParticipants(allUsers, participantsWithExpenses);
            
            // Render available participants (not currently in event)
            this.renderAvailableParticipants(allUsers);

        } catch (error) {
            console.error('Failed to load participant management data:', error);
            this.showEditEventError('participants', 'Failed to load participants. Please try again.');
        } finally {
            if (this.elements.editParticipantsLoading) {
                this.elements.editParticipantsLoading.style.display = 'none';
            }
        }
    }

    renderCurrentParticipants(allUsers, participantsWithExpenses) {
        if (!this.elements.editCurrentParticipants) return;

        const currentParticipantIds = this.currentEditEvent.participants || [];
        const currentParticipants = allUsers.filter(user => 
            currentParticipantIds.includes(user.id)
        );

        if (currentParticipants.length === 0) {
            this.elements.editCurrentParticipants.innerHTML = `
                <div class="section-placeholder">
                    <p>No participants in this event.</p>
                </div>
            `;
            return;
        }

        const participantsHtml = currentParticipants.map(participant => {
            const hasExpenses = participantsWithExpenses.has(participant.id);
            const contact = [];
            if (participant.email) contact.push(participant.email);
            if (participant.phone) contact.push(participant.phone);

            return `
                <div class="participant-item current-participant ${hasExpenses ? 'has-expenses' : ''}">
                    <div class="participant-item-info">
                        <div class="participant-item-name">${participant.name}</div>
                        ${contact.length > 0 ? `<div class="participant-item-details">${contact.join(' • ')}</div>` : ''}
                        ${hasExpenses ? `<div class="expense-warning">Has expenses in this event</div>` : ''}
                    </div>
                    <div class="participant-item-actions">
                        <button type="button" class="participant-action-btn btn-remove" data-action="remove" data-participant-id="${participant.id}" data-participant-name="${participant.name}" data-has-expenses="${hasExpenses}">
                            Remove
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.editCurrentParticipants.innerHTML = participantsHtml;
        this.bindParticipantActionButtons();
    }

    renderAvailableParticipants(allUsers) {
        if (!this.elements.editAvailableParticipants) return;

        const currentParticipantIds = this.currentEditEvent.participants || [];
        const availableParticipants = allUsers.filter(user => 
            !currentParticipantIds.includes(user.id)
        );

        if (availableParticipants.length === 0) {
            this.elements.editAvailableParticipants.innerHTML = `
                <div class="section-placeholder">
                    <p>All users are already participants in this event.</p>
                </div>
            `;
            return;
        }

        const participantsHtml = availableParticipants.map(participant => {
            const contact = [];
            if (participant.email) contact.push(participant.email);
            if (participant.phone) contact.push(participant.phone);

            return `
                <div class="participant-item">
                    <div class="participant-item-info">
                        <div class="participant-item-name">${participant.name}</div>
                        ${contact.length > 0 ? `<div class="participant-item-details">${contact.join(' • ')}</div>` : ''}
                    </div>
                    <div class="participant-item-actions">
                        <button type="button" class="participant-action-btn btn-add" data-action="add" data-participant-id="${participant.id}">
                            Add
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        this.elements.editAvailableParticipants.innerHTML = participantsHtml;
        this.bindParticipantActionButtons();
    }

    bindParticipantActionButtons() {
        // Bind add participant buttons
        document.querySelectorAll('[data-action="add"]').forEach(button => {
            button.addEventListener('click', async (e) => {
                const participantId = e.target.dataset.participantId;
                await this.addParticipant(participantId);
            });
        });

        // Bind remove participant buttons
        document.querySelectorAll('[data-action="remove"]').forEach(button => {
            button.addEventListener('click', (e) => {
                const participantId = e.target.dataset.participantId;
                const participantName = e.target.dataset.participantName;
                const hasExpenses = e.target.dataset.hasExpenses === 'true';
                this.showRemoveParticipantDialog(participantId, participantName, hasExpenses);
            });
        });
    }

    async addParticipant(participantId) {
        try {
            // Add participant to current event data
            if (!this.currentEditEvent.participants) {
                this.currentEditEvent.participants = [];
            }
            
            if (!this.currentEditEvent.participants.includes(participantId)) {
                this.currentEditEvent.participants.push(participantId);
                
                // Reload participant management UI
                await this.loadParticipantManagement();
            }
        } catch (error) {
            console.error('Failed to add participant:', error);
            showError('Failed to add participant. Please try again.');
        }
    }

    showRemoveParticipantDialog(participantId, participantName, hasExpenses) {
        // For now, just remove directly - we can add confirmation dialog later if needed
        this.removeParticipant(participantId);
    }

    async removeParticipant(participantId) {
        try {
            // Remove participant from current event data
            if (this.currentEditEvent.participants) {
                const index = this.currentEditEvent.participants.indexOf(participantId);
                if (index > -1) {
                    this.currentEditEvent.participants.splice(index, 1);
                    
                    // Reload participant management UI
                    await this.loadParticipantManagement();
                }
            }
        } catch (error) {
            console.error('Failed to remove participant:', error);
            showError('Failed to remove participant. Please try again.');
        }
    }
}

// Initialize when DOM is ready (only in browser)
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.eventsPage = new EventsPage();
        
        // Hook into navigation system to refresh events when page is shown
        if (typeof navigation !== 'undefined') {
            const originalNavigateToPage = navigation.navigateToPage;
            navigation.navigateToPage = function(pageId) {
                originalNavigateToPage.call(this, pageId);
                
                if (pageId === 'events' && window.eventsPage) {
                    window.eventsPage.refresh();
                }
            };
        }
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventsPage;
}