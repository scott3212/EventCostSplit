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
            container: document.querySelector('.events-container'),
            detailedViewToggle: document.getElementById('events-detailed-view'),
            compactViewToggle: document.getElementById('events-compact-view'),
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
            selectedParticipantsList: document.getElementById('selected-participants-list')
        };
        
        this.bindEvents();
        this.loadViewPreference();
        this.isInitialized = true;
    }

    bindEvents() {
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => {
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

        // Delete confirmation modal events - Store references for cleanup
        this.deleteModalHandlers = {
            confirm: null,
            cancel: null,
            close: null,
            backdrop: null
        };
        
        this.bindDeleteModalEvents();
    }

    bindDeleteModalEvents() {
        const deleteModal = document.getElementById('confirm-delete-event-modal');
        if (!deleteModal) return;
        
        const confirmButton = deleteModal.querySelector('#confirm-delete-event-ok');
        const cancelButton = deleteModal.querySelector('#confirm-delete-event-cancel');
        const closeButton = deleteModal.querySelector('#confirm-delete-event-close');

        // Remove existing event listeners first (to prevent conflicts)
        if (confirmButton) {
            // Clone the button to remove all existing listeners
            const newConfirmButton = confirmButton.cloneNode(true);
            confirmButton.parentNode.replaceChild(newConfirmButton, confirmButton);
            
            this.deleteModalHandlers.confirm = (e) => {
                e.preventDefault();
                this.confirmEventDeletion();
            };
            newConfirmButton.addEventListener('click', this.deleteModalHandlers.confirm);
        }

        if (cancelButton) {
            const newCancelButton = cancelButton.cloneNode(true);
            cancelButton.parentNode.replaceChild(newCancelButton, cancelButton);
            
            this.deleteModalHandlers.cancel = () => {
                this.hideDeleteEventDialog();
            };
            newCancelButton.addEventListener('click', this.deleteModalHandlers.cancel);
        }

        if (closeButton) {
            const newCloseButton = closeButton.cloneNode(true);
            closeButton.parentNode.replaceChild(newCloseButton, closeButton);
            
            this.deleteModalHandlers.close = () => {
                this.hideDeleteEventDialog();
            };
            newCloseButton.addEventListener('click', this.deleteModalHandlers.close);
        }

        // Modal backdrop click
        this.deleteModalHandlers.backdrop = (e) => {
            if (e.target === deleteModal) {
                this.hideDeleteEventDialog();
            }
        };
        deleteModal.addEventListener('click', this.deleteModalHandlers.backdrop);
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
        try {
            if (this.elements.participantsLoading) {
                this.elements.participantsLoading.style.display = 'block';
            }
            if (this.elements.participantsList) {
                this.elements.participantsList.style.display = 'none';
            }
            
            const response = await api.getUsers();
            const users = response.data || response || [];
            this.users = users;
            
            this.renderParticipants(users);
        } catch (error) {
            console.error('Failed to load participants:', error);
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
        if (!this.elements.participantsList || users.length === 0) {
            if (this.elements.participantsError) {
                this.elements.participantsError.textContent = 'No users found. Please create users first.';
                this.elements.participantsError.style.display = 'block';
            }
            return;
        }
        
        const participantsHtml = users.map(user => this.createParticipantItem(user)).join('');
        this.elements.participantsList.innerHTML = participantsHtml;
        this.elements.participantsList.style.display = 'block';
        
        this.bindParticipantEvents();
    }

    createParticipantItem(user) {
        const balance = user.totalBalance || 0;
        const balanceStatus = this.getUserBalanceStatus(balance);
        const isSelected = this.selectedParticipants.has(user.id);
        
        return `
            <div class="participant-item ${isSelected ? 'selected' : ''}" data-user-id="${user.id}">
                <input type="checkbox" class="participant-checkbox" ${isSelected ? 'checked' : ''}>
                <div class="participant-info">
                    <div class="participant-name">${user.name}</div>
                    <div class="participant-details">
                        ${user.email ? user.email : 'No email'}
                        ${user.phone ? ` • ${user.phone}` : ''}
                    </div>
                </div>
                <div class="participant-balance ${balanceStatus.class}">
                    ${formatCurrency(balance)}
                </div>
            </div>
        `;
    }

    bindParticipantEvents() {
        const participantItems = document.querySelectorAll('.participant-item');
        participantItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const userId = item.dataset.userId;
                const checkbox = item.querySelector('.participant-checkbox');
                
                if (this.selectedParticipants.has(userId)) {
                    this.selectedParticipants.delete(userId);
                    item.classList.remove('selected');
                    checkbox.checked = false;
                } else {
                    this.selectedParticipants.add(userId);
                    item.classList.add('selected');
                    checkbox.checked = true;
                }
                
                this.updateSelectedParticipantsDisplay();
                this.clearError('participants');
            });
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
        if (window.eventDetailPage) {
            window.eventDetailPage.showEvent(eventId);
        } else {
            console.error('Event detail page not initialized');
            showError('Event details page not available');
        }
    }

    editEvent(eventId) {
        console.log('Edit event:', eventId);
        showError('Edit Event form coming in Phase 4.4!');
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
        console.log('showDeleteEventDialog called with event:', event, 'costItems:', costItems);
        // Extract the actual event data from the API response wrapper
        const eventData = event.data || event;
        this.currentDeleteEvent = eventData;
        console.log('Set this.currentDeleteEvent to:', this.currentDeleteEvent);

        // Ensure we have exclusive control over modal events
        this.bindDeleteModalEvents();
        
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
        console.log('confirmEventDeletion called, currentDeleteEvent:', this.currentDeleteEvent);
        
        // Guard: Only handle deletion if we're currently on the events page and have an event selected
        const currentPage = document.querySelector('.page.active')?.id;
        console.log('Current active page:', currentPage, 'currentDeleteEvent exists:', !!this.currentDeleteEvent);
        
        if (currentPage !== 'events-page' || !this.currentDeleteEvent) {
            console.log('Ignoring delete request - currentPage:', currentPage, 'currentDeleteEvent:', !!this.currentDeleteEvent);
            return;
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
            
            if (error.message.includes('has cost items') || error.message.includes('has expenses')) {
                showError('Cannot delete event with existing expenses. Remove all expenses first.');
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
            console.error('Failed to create event:', error);
            
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
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
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

    getUserBalanceStatus(balance) {
        if (balance > 0) {
            return {
                class: 'balance-owed',
                text: 'Credit'
            };
        } else if (balance < 0) {
            return {
                class: 'balance-owes',
                text: 'Owes'
            };
        } else {
            return {
                class: 'balance-settled',
                text: 'Settled'
            };
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