class EventDetailPage {
    constructor() {
        this.currentEventId = null;
        this.currentEvent = null;
        this.participants = [];
        this.costItems = [];
        this.isInitialized = false;
        
        this.elements = {};
        this.bindElements();
        this.bindEventListeners();
        this.isInitialized = true;
    }

    bindElements() {
        this.elements = {
            // Navigation
            backButton: document.getElementById('event-detail-back'),
            
            // Event info
            eventName: document.getElementById('event-detail-name'),
            eventDate: document.getElementById('event-detail-date'),
            eventStatus: document.getElementById('event-detail-status'),
            eventLocation: document.getElementById('event-detail-location'),
            eventDescription: document.getElementById('event-detail-description'),
            eventDescriptionContainer: document.getElementById('event-description-container'),
            participantCount: document.getElementById('event-detail-participant-count'),
            
            // Stats
            totalExpensesCount: document.getElementById('total-expenses-count'),
            totalExpensesAmount: document.getElementById('total-expenses-amount'),
            avgPerPerson: document.getElementById('avg-per-person'),
            
            // Participants
            participantsLoading: document.getElementById('event-participants-loading'),
            participantsList: document.getElementById('event-participants-list'),
            
            // Expenses
            addExpenseBtn: document.getElementById('add-expense-btn'),
            expensesLoading: document.getElementById('expenses-loading'),
            expensesList: document.getElementById('expenses-list'),
            expensesEmpty: document.getElementById('expenses-empty')
        };
    }

    bindEventListeners() {
        if (this.elements.backButton) {
            this.elements.backButton.addEventListener('click', () => this.goBackToEvents());
        }

        if (this.elements.addExpenseBtn) {
            this.elements.addExpenseBtn.addEventListener('click', () => this.showAddExpenseDialog());
        }
    }

    async showEvent(eventId) {
        this.currentEventId = eventId;
        
        try {
            // Show the event detail page
            this.showPage();
            
            // Load event data
            await this.loadEventData();
            
            // Load participants and cost items in parallel
            await Promise.all([
                this.loadParticipants(),
                this.loadCostItems()
            ]);
            
            this.updateStats();
            
        } catch (error) {
            console.error('Failed to load event:', error);
            showError('Failed to load event details. Please try again.');
            this.goBackToEvents();
        }
    }

    showPage() {
        // Hide all other pages
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        // Show event detail page
        const eventDetailPage = document.getElementById('event-detail-page');
        if (eventDetailPage) {
            eventDetailPage.style.display = 'block';
        }
    }

    async loadEventData() {
        try {
            const event = await api.getEventById(this.currentEventId);
            this.currentEvent = event;
            this.renderEventInfo(event);
        } catch (error) {
            console.error('Failed to load event data:', error);
            throw error;
        }
    }

    renderEventInfo(event) {
        if (this.elements.eventName) {
            this.elements.eventName.textContent = event.name;
        }
        
        if (this.elements.eventLocation) {
            this.elements.eventLocation.textContent = event.location;
        }
        
        if (this.elements.participantCount) {
            this.elements.participantCount.textContent = event.participants?.length || 0;
        }
        
        // Format and display date
        if (this.elements.eventDate) {
            const eventDate = new Date(event.date);
            this.elements.eventDate.textContent = this.formatEventDate(eventDate);
        }
        
        // Display status
        if (this.elements.eventStatus) {
            const eventDate = new Date(event.date);
            const status = this.getEventStatus(event, eventDate);
            this.elements.eventStatus.textContent = status.text;
            this.elements.eventStatus.className = `status-badge ${status.class}`;
        }
        
        // Show description if present
        if (event.description && event.description.trim()) {
            this.elements.eventDescription.textContent = event.description;
            this.elements.eventDescriptionContainer.style.display = 'block';
        } else {
            this.elements.eventDescriptionContainer.style.display = 'none';
        }
    }

    async loadParticipants() {
        if (this.elements.participantsLoading) {
            this.elements.participantsLoading.style.display = 'block';
        }
        
        try {
            const participants = await api.getEventParticipants(this.currentEventId);
            this.participants = participants;
            this.renderParticipants(participants);
        } catch (error) {
            console.error('Failed to load participants:', error);
            // Don't throw - participants failure shouldn't break the whole page
        } finally {
            if (this.elements.participantsLoading) {
                this.elements.participantsLoading.style.display = 'none';
            }
        }
    }

    renderParticipants(participants) {
        if (!this.elements.participantsList) return;
        
        if (!participants || participants.length === 0) {
            this.elements.participantsList.innerHTML = `
                <div class="section-placeholder">
                    <p>No participants found for this event.</p>
                </div>
            `;
            return;
        }
        
        const participantsHtml = participants.map(participant => this.createParticipantCard(participant)).join('');
        this.elements.participantsList.innerHTML = participantsHtml;
    }

    createParticipantCard(participant) {
        const contact = [];
        if (participant.email) contact.push(participant.email);
        if (participant.phone) contact.push(participant.phone);
        
        const balanceStatus = this.getUserBalanceStatus(participant.totalBalance || 0);
        
        return `
            <div class="participant-card">
                <div class="participant-name">${participant.name}</div>
                ${contact.length > 0 ? `<div class="participant-contact">${contact.join(' • ')}</div>` : ''}
                <div class="participant-balance ${balanceStatus.class}">
                    <span>${balanceStatus.text}</span>
                    <span>${formatCurrency(Math.abs(participant.totalBalance || 0))}</span>
                </div>
            </div>
        `;
    }

    async loadCostItems() {
        if (this.elements.expensesLoading) {
            this.elements.expensesLoading.style.display = 'block';
        }
        
        try {
            const costItems = await api.getEventCostItems(this.currentEventId);
            this.costItems = costItems;
            this.renderCostItems(costItems);
        } catch (error) {
            console.error('Failed to load cost items:', error);
            // Don't throw - cost items failure shouldn't break the whole page
        } finally {
            if (this.elements.expensesLoading) {
                this.elements.expensesLoading.style.display = 'none';
            }
        }
    }

    renderCostItems(costItems) {
        if (!this.elements.expensesList || !this.elements.expensesEmpty) return;
        
        if (!costItems || costItems.length === 0) {
            this.elements.expensesList.style.display = 'none';
            this.elements.expensesEmpty.style.display = 'block';
            return;
        }
        
        this.elements.expensesEmpty.style.display = 'none';
        this.elements.expensesList.style.display = 'block';
        
        const expensesHtml = costItems.map(item => this.createExpenseCard(item)).join('');
        this.elements.expensesList.innerHTML = expensesHtml;
    }

    createExpenseCard(costItem) {
        const date = new Date(costItem.date);
        const paidByUser = this.participants.find(p => p.id === costItem.paidBy);
        
        // Count participants with non-zero split
        const participantCount = Object.values(costItem.splitPercentages || {}).filter(p => p > 0).length;
        
        return `
            <div class="expense-card" data-expense-id="${costItem.id}">
                <div class="expense-header">
                    <h4 class="expense-name">${costItem.description}</h4>
                    <div class="expense-amount">${formatCurrency(costItem.amount)}</div>
                </div>
                <div class="expense-meta">
                    <span>📅 ${date.toLocaleDateString()}</span>
                    <span>💳 Paid by ${paidByUser ? paidByUser.name : 'Unknown'}</span>
                </div>
                <div class="expense-split-info">
                    Split among ${participantCount} participant${participantCount !== 1 ? 's' : ''}
                </div>
            </div>
        `;
    }

    updateStats() {
        const totalExpenses = this.costItems.length;
        const totalAmount = this.costItems.reduce((sum, item) => sum + item.amount, 0);
        const avgPerPerson = this.participants.length > 0 ? totalAmount / this.participants.length : 0;
        
        if (this.elements.totalExpensesCount) {
            this.elements.totalExpensesCount.textContent = totalExpenses;
        }
        
        if (this.elements.totalExpensesAmount) {
            this.elements.totalExpensesAmount.textContent = formatCurrency(totalAmount);
        }
        
        if (this.elements.avgPerPerson) {
            this.elements.avgPerPerson.textContent = formatCurrency(avgPerPerson);
        }
    }

    formatEventDate(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Reset time parts for comparison
        const eventDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        
        if (eventDateOnly.getTime() === todayOnly.getTime()) {
            return 'Today';
        } else if (eventDateOnly.getTime() === tomorrowOnly.getTime()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    }

    getEventStatus(event, eventDate, currentDate = new Date()) {
        const today = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
        
        const timeDiff = eventDateOnly.getTime() - today.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 0) {
            return { text: 'Completed', class: 'status-completed' };
        } else if (daysDiff === 0) {
            return { text: 'Today', class: 'status-active' };
        } else if (daysDiff === 1) {
            return { text: 'Tomorrow', class: 'status-upcoming' };
        } else {
            return { text: `${daysDiff} days`, class: 'status-upcoming' };
        }
    }

    getUserBalanceStatus(balance) {
        if (balance > 0) {
            return { class: 'balance-owed', text: 'Credit' };
        } else if (balance < 0) {
            return { class: 'balance-owes', text: 'Owes' };
        } else {
            return { class: 'balance-settled', text: 'Settled' };
        }
    }

    goBackToEvents() {
        // Show events page
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });
        
        const eventsPage = document.getElementById('events-page');
        if (eventsPage) {
            eventsPage.style.display = 'block';
        }
        
        // Update navigation
        if (window.navigation) {
            window.navigation.showPage('events');
        }
    }

    showAddExpenseDialog() {
        // TODO: Implement add expense dialog
        showError('Add Expense functionality coming soon!');
    }

    async refresh() {
        if (this.currentEventId) {
            await this.showEvent(this.currentEventId);
        }
    }
}

// Initialize the event detail page when DOM is loaded
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.eventDetailPage = new EventDetailPage();
    });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EventDetailPage;
}