class EventDetailPage {
    constructor() {
        this.currentEventId = null;
        this.currentEvent = null;
        this.participants = [];
        this.costItems = [];
        this.isInitialized = false;
        this.isReadOnly = false; // Read-only mode flag

        // Split configuration state
        this.splitMode = 'equal';
        this.currentSplitPercentages = {};
        this.currentSplitShares = {};

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
            addFirstExpenseBtn: document.getElementById('add-first-expense-btn'),
            expensesLoading: document.getElementById('expenses-loading'),
            expensesList: document.getElementById('expenses-list'),
            expensesEmpty: document.getElementById('expenses-empty'),
            
            // Add Expense Modal
            expenseModal: document.getElementById('add-expense-modal'),
            expenseForm: document.getElementById('add-expense-form'),
            expenseClose: document.getElementById('add-expense-close'),
            expenseCancel: document.getElementById('add-expense-cancel'),
            expenseSave: document.getElementById('add-expense-save'),
            
            // Expense Form Fields
            expenseDescription: document.getElementById('expense-description'),
            expenseAmount: document.getElementById('expense-amount'),
            expenseDate: document.getElementById('expense-date'),
            expensePaidBy: document.getElementById('expense-paid-by'),
            
            // Expense Form Errors
            expenseDescriptionError: document.getElementById('expense-description-error'),
            expenseAmountError: document.getElementById('expense-amount-error'),
            expenseDateError: document.getElementById('expense-date-error'),
            expensePaidByError: document.getElementById('expense-paid-by-error'),
            
            // Split Configuration Elements
            splitConfigurationSection: document.getElementById('split-configuration-section'),
            splitEqualRadio: document.getElementById('split-equal'),
            splitSharesRadio: document.getElementById('split-shares'),
            splitCustomRadio: document.getElementById('split-custom'),
            splitParticipantsContainer: document.getElementById('split-participants-container'),
            splitTotalAmount: document.getElementById('split-total-amount'),
            splitRemaining: document.getElementById('split-remaining'),
            splitSharesTotal: document.getElementById('split-shares-total'),
            splitTotalShares: document.getElementById('split-total-shares'),
            splitConfigurationError: document.getElementById('split-configuration-error'),
            sharesMakeEqualBtn: document.getElementById('shares-make-equal-btn'),
            
            // Event Action Buttons
            shareEventBtn: document.getElementById('share-event-btn'),
            editEventBtn: document.getElementById('edit-event-btn'),
            deleteEventBtn: document.getElementById('delete-event-btn'),
            
            // Edit Event Modal
            editEventModal: document.getElementById('edit-event-modal'),
            editEventForm: document.getElementById('edit-event-form'),
            editEventClose: document.getElementById('edit-event-close'),
            editEventCancel: document.getElementById('edit-event-cancel'),
            editEventSave: document.getElementById('edit-event-save'),
            
            // Edit Event Form Fields
            editEventName: document.getElementById('edit-event-name'),
            editEventDate: document.getElementById('edit-event-date'),
            editEventLocation: document.getElementById('edit-event-location'),
            editEventDescription: document.getElementById('edit-event-description'),
            
            // Edit Event Form Errors
            editEventNameError: document.getElementById('edit-event-name-error'),
            editEventDateError: document.getElementById('edit-event-date-error'),
            editEventLocationError: document.getElementById('edit-event-location-error'),
            
            // Participant Management
            editParticipantsLoading: document.getElementById('edit-participants-loading'),
            editCurrentParticipants: document.getElementById('edit-current-participants'),
            editAvailableParticipants: document.getElementById('edit-available-participants'),
            editParticipantsError: document.getElementById('edit-participants-error'),
            
            // Remove Participant Confirmation Modal
            confirmRemoveParticipantModal: document.getElementById('confirm-remove-participant-modal'),
            confirmRemoveParticipantClose: document.getElementById('confirm-remove-participant-close'),
            confirmRemoveParticipantCancel: document.getElementById('confirm-remove-participant-cancel'),
            confirmRemoveParticipantOk: document.getElementById('confirm-remove-participant-ok'),
            removeParticipantName: document.getElementById('remove-participant-name'),
            removeParticipantWarning: document.getElementById('remove-participant-warning'),
            
            // Delete Event Confirmation Modal
            confirmDeleteEventModal: document.getElementById('confirm-delete-event-modal'),
            confirmDeleteEventClose: document.getElementById('confirm-delete-event-close'),
            confirmDeleteEventCancel: document.getElementById('confirm-delete-event-cancel'),
            confirmDeleteEventOk: document.getElementById('confirm-delete-event-ok'),
            deleteEventName: document.getElementById('delete-event-name'),
            deleteEventWarning: document.getElementById('delete-event-warning'),
            deleteEventParticipantsWarning: document.getElementById('delete-event-participants-warning'),
            deleteEventParticipantCount: document.getElementById('delete-event-participant-count')
        };
    }

    bindEventListeners() {
        if (this.elements.backButton) {
            this.elements.backButton.addEventListener('click', () => this.goBackToEvents());
        }

        if (this.elements.addExpenseBtn) {
            this.elements.addExpenseBtn.addEventListener('click', () => this.showAddExpenseDialog());
        }

        if (this.elements.addFirstExpenseBtn) {
            this.elements.addFirstExpenseBtn.addEventListener('click', () => this.showAddExpenseDialog());
        }

        // Expense Modal Events
        if (this.elements.expenseClose) {
            this.elements.expenseClose.addEventListener('click', () => this.hideAddExpenseDialog());
        }

        if (this.elements.expenseCancel) {
            this.elements.expenseCancel.addEventListener('click', () => this.hideAddExpenseDialog());
        }

        if (this.elements.expenseSave) {
            this.elements.expenseSave.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddExpense();
            });
        }

        if (this.elements.expenseForm) {
            this.elements.expenseForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddExpense();
            });
        }

        // Expense modal backdrop click
        if (this.elements.expenseModal) {
            this.elements.expenseModal.addEventListener('click', (e) => {
                if (e.target === this.elements.expenseModal) {
                    this.hideAddExpenseDialog();
                }
            });
        }

        // Real-time validation
        if (this.elements.expenseDescription) {
            this.elements.expenseDescription.addEventListener('input', () => this.clearExpenseError('description'));
        }
        if (this.elements.expenseAmount) {
            this.elements.expenseAmount.addEventListener('input', () => this.clearExpenseError('amount'));
        }
        if (this.elements.expenseDate) {
            this.elements.expenseDate.addEventListener('change', () => this.clearExpenseError('date'));
        }
        if (this.elements.expensePaidBy) {
            this.elements.expensePaidBy.addEventListener('change', () => {
                this.clearExpenseError('paidBy');
                this.loadSplitConfiguration();
            });
        }
        
        // Split Configuration Events
        if (this.elements.splitEqualRadio) {
            this.elements.splitEqualRadio.addEventListener('change', () => this.handleSplitMethodChange());
        }

        if (this.elements.splitSharesRadio) {
            this.elements.splitSharesRadio.addEventListener('change', () => this.handleSplitMethodChange());
        }

        if (this.elements.splitCustomRadio) {
            this.elements.splitCustomRadio.addEventListener('change', () => this.handleSplitMethodChange());
        }

        if (this.elements.sharesMakeEqualBtn) {
            this.elements.sharesMakeEqualBtn.addEventListener('click', () => this.makeEqualSharesSplit());
        }
        
        if (this.elements.expenseAmount) {
            this.elements.expenseAmount.addEventListener('input', () => this.updateSplitAmounts());
        }

        // Share Event Button
        if (this.elements.shareEventBtn) {
            this.elements.shareEventBtn.addEventListener('click', () => this.shareEvent());
        }

        // Edit Event Button
        if (this.elements.editEventBtn) {
            this.elements.editEventBtn.addEventListener('click', () => this.showEditEventDialog());
        }

        // Delete Event Button
        if (this.elements.deleteEventBtn) {
            this.elements.deleteEventBtn.addEventListener('click', () => this.showDeleteEventDialog());
        }

        // Edit Event Modal Events
        if (this.elements.editEventClose) {
            this.elements.editEventClose.addEventListener('click', () => this.hideEditEventDialog());
        }

        if (this.elements.editEventCancel) {
            this.elements.editEventCancel.addEventListener('click', () => this.hideEditEventDialog());
        }

        if (this.elements.editEventSave) {
            this.elements.editEventSave.addEventListener('click', (e) => {
                e.preventDefault();
                // Only handle if we're on the event-detail page
                const eventDetailPage = document.getElementById('event-detail-page');
                const isEventDetailPageActive = eventDetailPage && !eventDetailPage.classList.contains('hidden');
                if (isEventDetailPageActive) {
                    this.handleEditEvent();
                }
            });
        }

        if (this.elements.editEventForm) {
            this.elements.editEventForm.addEventListener('submit', (e) => {
                console.log('[EVENT-DETAIL.JS] Form submit triggered', {
                    currentEvent: this.currentEvent?.id,
                    submitterElement: e.submitter?.tagName + '#' + e.submitter?.id
                });
                e.preventDefault();
                // Only handle if we're on the event-detail page
                const eventDetailPage = document.getElementById('event-detail-page');
                const isEventDetailPageActive = eventDetailPage && !eventDetailPage.classList.contains('hidden');
                if (isEventDetailPageActive) {
                    this.handleEditEvent();
                }
            });
        }

        // Edit Event modal backdrop click
        if (this.elements.editEventModal) {
            this.elements.editEventModal.addEventListener('click', (e) => {
                if (e.target === this.elements.editEventModal) {
                    this.hideEditEventDialog();
                }
            });
        }

        // Remove Participant Confirmation Modal Events
        if (this.elements.confirmRemoveParticipantClose) {
            this.elements.confirmRemoveParticipantClose.addEventListener('click', () => this.hideRemoveParticipantDialog());
        }

        if (this.elements.confirmRemoveParticipantCancel) {
            this.elements.confirmRemoveParticipantCancel.addEventListener('click', () => this.hideRemoveParticipantDialog());
        }

        if (this.elements.confirmRemoveParticipantOk) {
            this.elements.confirmRemoveParticipantOk.addEventListener('click', () => this.confirmRemoveParticipant());
        }

        // Delete Event Confirmation Modal Events
        if (this.elements.confirmDeleteEventClose) {
            this.elements.confirmDeleteEventClose.addEventListener('click', () => this.hideDeleteEventDialog());
        }

        if (this.elements.confirmDeleteEventCancel) {
            this.elements.confirmDeleteEventCancel.addEventListener('click', () => this.hideDeleteEventDialog());
        }

        if (this.elements.confirmDeleteEventOk) {
            this.elements.confirmDeleteEventOk.addEventListener('click', () => this.confirmDeleteEvent());
        }

        // Edit Event Real-time validation
        if (this.elements.editEventName) {
            this.elements.editEventName.addEventListener('input', () => this.clearEditEventError('name'));
        }
        if (this.elements.editEventDate) {
            this.elements.editEventDate.addEventListener('change', () => this.clearEditEventError('date'));
        }
        if (this.elements.editEventLocation) {
            this.elements.editEventLocation.addEventListener('input', () => this.clearEditEventError('location'));
        }

        // Event delegation for participant management buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.participant-action-btn[data-action="add"]')) {
                const participantId = e.target.getAttribute('data-participant-id');
                console.log('[EVENT-DETAIL.JS] Add participant clicked', { participantId });
                this.addParticipant(participantId);
            } else if (e.target.matches('.participant-action-btn[data-action="remove"]')) {
                const participantId = e.target.getAttribute('data-participant-id');
                const participantName = e.target.getAttribute('data-participant-name');
                const hasExpenses = e.target.getAttribute('data-has-expenses') === 'true';
                console.log('[EVENT-DETAIL.JS] Remove participant clicked', { participantId, participantName, hasExpenses });
                this.showRemoveParticipantDialog(participantId, participantName, hasExpenses);
            }
        });
    }

    async showEvent(eventId, queryParams = {}) {
        this.currentEventId = eventId;

        // Set read-only mode based on query parameter
        this.isReadOnly = queryParams.readonly === 'true';
        console.log('EventDetailPage: Read-only mode:', this.isReadOnly);

        try {
            // Show the event detail page
            this.showPage();

            // Load event data
            await this.loadEventData();

            // Load participants first, then cost items (participants needed for expense rendering)
            await this.loadParticipants();
            await this.loadCostItems();

            this.updateStats();

            // Apply read-only mode after content is loaded
            if (this.isReadOnly) {
                this.applyReadOnlyMode();
            }

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
        
        // Update navigation to indicate we're showing event detail
        if (window.navigation) {
            window.navigation.currentPage = 'events';
            window.navigation.isShowingEventDetail = true;
            window.navigation.updateActiveNavItem('events');
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
            const eventDate = this.parseDateSafely(event.date);
            this.elements.eventDate.textContent = this.formatEventDate(eventDate);
        }
        
        // Display status
        if (this.elements.eventStatus) {
            const eventDate = this.parseDateSafely(event.date);
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
            // Load both participant data and balance data in parallel
            const [participants, balanceData] = await Promise.all([
                api.getEventParticipants(this.currentEventId),
                api.getEventBalance(this.currentEventId)
            ]);
            
            // Merge balance data with participant data
            // Note: balanceData contains event-specific balances, not global balances
            const participantsWithBalance = participants.map(participant => {
                const balance = balanceData.userBalances[participant.id];
                return {
                    ...participant,
                    // Event-specific balance data (from calculateEventBalance)
                    eventBalance: balance ? balance.net : 0,     // Net balance for this event only
                    eventOwes: balance ? balance.owes : 0,       // Amount owes for this event only
                    eventPaid: balance ? balance.paid : 0,       // Amount paid for this event only
                    // Keep original structure for backward compatibility
                    balance: balance ? balance.net : 0,          // Will be treated as event balance
                    owes: balance ? balance.owes : 0,
                    paid: balance ? balance.paid : 0
                };
            });
            
            this.participants = participantsWithBalance;
            this.renderParticipants(participantsWithBalance);
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
        
        const participantsHtml = participants.map(participant =>
            ParticipantComponent.createDisplayCard(participant)
        ).join('');
        this.elements.participantsList.innerHTML = participantsHtml;
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
        
        // Add event listeners for expense actions
        this.bindExpenseActionListeners();
    }

    createExpenseCard(costItem) {
        // Use formatDateOnly to avoid timezone issues with date-only strings
        const formattedDate = formatDateOnly(costItem.date);
        // Ensure participants are loaded before finding the user
        const paidByUser = this.participants?.find(p => p.id === costItem.paidBy);
        
        // Count participants with non-zero split (handle both shares and percentage modes)
        let splitData, participantCount, splitMode;
        if (costItem.splitShares) {
            splitData = costItem.splitShares;
            participantCount = Object.values(splitData).filter(shares => shares > 0).length;
            splitMode = 'shares';
        } else {
            splitData = costItem.splitPercentages || costItem.splitPercentage || {};
            participantCount = Object.values(splitData).filter(p => p > 0).length;
            splitMode = 'percentage';
        }
        
        // Generate split details for detailed view
        const splitDetails = this.generateSplitDetails(costItem);
        
        return `
            <div class="expense-card" data-expense-id="${costItem.id}">
                <div class="expense-header">
                    <div class="expense-title">
                        <h4 class="expense-name">${costItem.description}</h4>
                        <div class="expense-actions">
                            <button class="btn-icon edit-expense-btn" data-expense-id="${costItem.id}" title="Edit expense">
                                ✏️
                            </button>
                            <button class="btn-icon delete-expense-btn" data-expense-id="${costItem.id}" title="Delete expense">
                                🗑️
                            </button>
                        </div>
                    </div>
                    <div class="expense-amount">${formatCurrency(costItem.amount)}</div>
                </div>
                <div class="expense-meta">
                    <span>📅 ${formattedDate}</span>
                    <span>💳 Paid by ${paidByUser ? paidByUser.name : 'Unknown'}</span>
                </div>
                <div class="expense-split-info">
                    <div class="split-summary">
                        <span class="split-mode-indicator">${splitMode === 'shares' ? '🔢' : '%'}</span>
                        Split among ${participantCount} participant${participantCount !== 1 ? 's' : ''}
                        ${splitMode === 'shares' ? '(Shares)' : '(Percentage)'}
                        <button class="toggle-split-details btn-link" data-expense-id="${costItem.id}">
                            Show details
                        </button>
                    </div>
                    <div class="split-details" id="split-details-${costItem.id}" style="display: none;">
                        ${splitDetails}
                    </div>
                </div>
            </div>
        `;
    }

    generateSplitDetails(costItem) {
        const splitHtml = [];

        if (costItem.splitShares) {
            // Shares mode
            const totalShares = Object.values(costItem.splitShares).reduce((sum, shares) => sum + (shares || 0), 0);

            for (const [participantId, shares] of Object.entries(costItem.splitShares)) {
                if (shares > 0) {
                    const participant = this.participants?.find(p => p.id === participantId);
                    const amount = totalShares > 0 ? (costItem.amount * shares) / totalShares : 0;
                    splitHtml.push(`
                        <div class="split-participant-detail shares-detail">
                            <span class="participant-name">${participant ? participant.name : 'Unknown'}</span>
                            <span class="split-shares">${shares} share${shares !== 1 ? 's' : ''}</span>
                            <span class="split-amount">${formatCurrency(amount)}</span>
                        </div>
                    `);
                }
            }

            if (totalShares > 0) {
                splitHtml.unshift(`<div class="split-summary-info">Total shares: ${totalShares}</div>`);
            }
        } else {
            // Percentage mode (existing logic)
            const splitPercentages = costItem.splitPercentages || costItem.splitPercentage || {};

            for (const [participantId, percentage] of Object.entries(splitPercentages)) {
                if (percentage > 0) {
                    const participant = this.participants?.find(p => p.id === participantId);
                    const amount = (costItem.amount * percentage) / 100;
                    splitHtml.push(`
                        <div class="split-participant-detail percentage-detail">
                            <span class="participant-name">${participant ? participant.name : 'Unknown'}</span>
                            <span class="split-percentage">${percentage.toFixed(1)}%</span>
                            <span class="split-amount">${formatCurrency(amount)}</span>
                        </div>
                    `);
                }
            }
        }

        return splitHtml.length > 0 ? splitHtml.join('') : '<p class="text-muted">No split details available</p>';
    }

    bindExpenseActionListeners() {
        // Edit expense buttons
        const editButtons = this.elements.expensesList.querySelectorAll('.edit-expense-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.getAttribute('data-expense-id');
                this.handleEditExpense(expenseId);
            });
        });

        // Delete expense buttons
        const deleteButtons = this.elements.expensesList.querySelectorAll('.delete-expense-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.getAttribute('data-expense-id');
                this.handleDeleteExpense(expenseId);
            });
        });

        // Toggle split details buttons
        const toggleButtons = this.elements.expensesList.querySelectorAll('.toggle-split-details');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const expenseId = btn.getAttribute('data-expense-id');
                this.toggleSplitDetails(expenseId, btn);
            });
        });
    }

    toggleSplitDetails(expenseId, toggleBtn) {
        const detailsElement = document.getElementById(`split-details-${expenseId}`);
        if (detailsElement) {
            const isHidden = detailsElement.style.display === 'none';
            detailsElement.style.display = isHidden ? 'block' : 'none';
            toggleBtn.textContent = isHidden ? 'Hide details' : 'Show details';
        }
    }

    handleEditExpense(expenseId) {
        // Find the expense
        const expense = this.costItems.find(item => item.id === expenseId);
        if (!expense) {
            showError('Expense not found');
            return;
        }
        
        // Populate the edit form (we'll use the same modal as add expense)
        this.populateExpenseFormForEdit(expense);
        this.showAddExpenseDialog();
    }

    populateExpenseFormForEdit(expense) {
        this.editingExpenseId = expense.id;
        
        // Update modal title and button text
        const modalTitle = this.elements.expenseModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Edit Expense';
        }
        
        if (this.elements.expenseSave) {
            this.elements.expenseSave.innerHTML = '<span class="btn-icon">✏️</span> Update Expense';
        }

        // Fill form fields
        if (this.elements.expenseDescription) {
            this.elements.expenseDescription.value = expense.description;
        }
        if (this.elements.expenseAmount) {
            this.elements.expenseAmount.value = expense.amount;
        }
        if (this.elements.expenseDate) {
            this.elements.expenseDate.value = expense.date;
        }
        // Store the paidBy value to be set after the dialog is shown
        this.tempPaidByValue = expense.paidBy;

        // Set up split configuration for editing (handle both API response formats)
        const splitData = expense.splitPercentages || expense.splitPercentage || {};
        this.currentSplitPercentages = { ...splitData };
        this.loadSplitConfiguration();
    }

    async handleDeleteExpense(expenseId) {
        // Find the expense
        const expense = this.costItems.find(item => item.id === expenseId);
        if (!expense) {
            showError('Expense not found');
            return;
        }

        // Show confirmation dialog
        const confirmed = confirm(
            `Are you sure you want to delete the expense "${expense.description}" (${formatCurrency(expense.amount)})?\n\nThis action cannot be undone.`
        );

        if (!confirmed) return;

        try {
            // Delete the expense via API
            await api.deleteCostItem(expenseId);
            
            // Refresh all data (participants, expenses, balances)
            await this.refresh();
            
            showSuccess(`Expense "${expense.description}" deleted successfully!`);
        } catch (error) {
            console.error('Failed to delete expense:', error);
            showError('Failed to delete expense. Please try again.');
        }
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


    goBackToEvents() {
        // Use router for navigation if available
        if (window.router) {
            window.router.navigate('/events');
        } else {
            // Fallback to direct navigation
            if (window.navigation) {
                window.navigation.navigateToPage('events');
            }
        }
    }

    async showAddExpenseDialog() {
        if (!this.currentEvent) {
            showError('No event selected');
            return;
        }

        // Only reset form if we're not editing an existing expense
        if (!this.editingExpenseId) {
            this.resetAddExpenseForm();
        }
        
        // Load participants (but preserve selection if editing)
        this.loadExpenseFormParticipants();
        
        // Restore the paid by value if editing
        if (this.editingExpenseId && this.tempPaidByValue && this.elements.expensePaidBy) {
            this.elements.expensePaidBy.value = this.tempPaidByValue;
            this.tempPaidByValue = null; // Clear temporary value
        }
        
        if (this.elements.expenseModal) {
            this.elements.expenseModal.style.display = 'flex';
            this.elements.expenseModal.classList.add('fade-in');
        }

        // Set default date to today only if not editing
        if (!this.editingExpenseId && this.elements.expenseDate) {
            const today = new Date();
            this.elements.expenseDate.value = today.toISOString().split('T')[0];
        }
        
        // Initialize split configuration
        this.initializeSplitConfiguration();
    }

    hideAddExpenseDialog() {
        if (this.elements.expenseModal) {
            this.elements.expenseModal.style.display = 'none';
            this.elements.expenseModal.classList.remove('fade-in');
        }
        this.resetAddExpenseForm();
    }

    resetAddExpenseForm() {
        if (this.elements.expenseForm) {
            this.elements.expenseForm.reset();
        }
        this.clearAllExpenseErrors();
        
        // Reset editing state
        this.editingExpenseId = null;
        
        // Reset modal title and button text to default
        const modalTitle = this.elements.expenseModal.querySelector('.modal-title');
        if (modalTitle) {
            modalTitle.textContent = 'Add Expense';
        }
        
        if (this.elements.expenseSave) {
            this.elements.expenseSave.innerHTML = '<span class="btn-icon">💰</span> Add Expense';
        }
    }

    loadExpenseFormParticipants() {
        if (!this.elements.expensePaidBy) return;

        // Clear existing options
        this.elements.expensePaidBy.innerHTML = '<option value="">Select who paid for this expense</option>';

        // Add participants as options - use this.participants which contains full user objects
        if (this.participants && this.participants.length > 0) {
            this.participants.forEach(participant => {
                const option = document.createElement('option');
                option.value = participant.id;
                option.textContent = participant.name;
                this.elements.expensePaidBy.appendChild(option);
            });
        }
    }

    async handleAddExpense() {
        if (!this.validateExpenseForm()) {
            return;
        }

        this.setExpenseSaveButtonState(true);

        try {
            const formData = new FormData(this.elements.expenseForm);
            const rawExpenseData = {
                eventId: this.currentEventId,
                description: formData.get('description'),
                amount: parseFloat(formData.get('amount')),
                paidBy: formData.get('paidBy'),
                date: formData.get('date')
            };

            // Add split configuration based on mode
            if (this.splitMode === 'shares') {
                rawExpenseData.splitShares = this.getSplitShares();
            } else {
                rawExpenseData.splitPercentage = this.getSplitPercentages();
            }

            console.log('[EXPENSE-EDIT] Raw expense data before sanitization:', rawExpenseData);
            console.log('[EXPENSE-EDIT] Current event participants:', this.currentEvent?.participants);

            // Sanitize expense data to ensure split only contains current event participants
            const currentParticipants = this.currentEvent?.participants || [];
            const expenseData = this.sanitizeExpenseData(rawExpenseData, currentParticipants);

            // Validate split configuration after sanitization
            if (expenseData.splitPercentage) {
                // Percentage mode validation
                const sanitizedSplitTotal = Object.values(expenseData.splitPercentage).reduce((sum, p) => sum + p, 0);
                console.log('[EXPENSE-EDIT] Sanitized split total:', sanitizedSplitTotal, 'Split data:', expenseData.splitPercentage);
                if (Math.abs(sanitizedSplitTotal - 100) > 0.01) {
                    console.log('[EXPENSE-EDIT] Validation failed - split total is:', sanitizedSplitTotal, 'difference from 100:', Math.abs(sanitizedSplitTotal - 100));
                    this.showExpenseError('splitConfiguration', `Split percentages must add up to exactly 100% (currently ${sanitizedSplitTotal.toFixed(2)}%)`);
                    this.setExpenseSaveButtonState(false);
                    return;
                }
            } else if (expenseData.splitShares) {
                // Shares mode validation
                const totalShares = Object.values(expenseData.splitShares).reduce((sum, shares) => sum + (shares || 0), 0);
                console.log('[EXPENSE-EDIT] Shares split - total shares:', totalShares, 'Split data:', expenseData.splitShares);
                if (totalShares === 0) {
                    console.log('[EXPENSE-EDIT] Validation failed - no shares assigned');
                    this.showExpenseError('splitConfiguration', 'At least one person must have shares greater than 0');
                    this.setExpenseSaveButtonState(false);
                    return;
                }
            } else {
                console.log('[EXPENSE-EDIT] Validation failed - no split configuration');
                this.showExpenseError('splitConfiguration', 'Split configuration is required');
                this.setExpenseSaveButtonState(false);
                return;
            }

            let result;
            const isEditing = !!this.editingExpenseId;

            if (isEditing) {
                // Update existing expense
                result = await api.updateCostItem(this.editingExpenseId, expenseData);
                const description = result?.description || expenseData.description || 'expense';
                showSuccess(`Expense "${description}" updated successfully!`);
            } else {
                // Create new expense
                result = await api.createCostItem(expenseData);
                const description = result?.description || expenseData.description || 'expense';
                showSuccess(`Expense "${description}" added successfully!`);
            }
            
            this.hideAddExpenseDialog();
            await this.refresh();
            
        } catch (error) {
            console.log('[EXPENSE-EDIT] Error details:', error.message);

            if (error.message.includes('description already exists')) {
                this.showExpenseError('description', 'An expense with this description already exists');
            } else if (error.message.includes('amount')) {
                this.showExpenseError('amount', 'Invalid amount');
            } else if (error.message.includes('paidBy')) {
                this.showExpenseError('paidBy', 'Please select who paid for this expense');
            } else if (error.message.includes('not a participant in the event')) {
                // This should rarely happen now due to our sanitization, but provide helpful feedback if it does
                this.showExpenseError('splitConfiguration',
                    'Some participants in the split are no longer in this event. Please refresh the page and try again.');
                console.warn('[EXPENSE-EDIT] Participant validation error despite sanitization:', error.message);
            } else if (error.message.includes('split') || error.message.includes('participant')) {
                this.showExpenseError('splitConfiguration',
                    'There was an issue with the participant split configuration. Please review and try again.');
            } else {
                const action = this.editingExpenseId ? 'update' : 'create';
                showError(`Failed to ${action} expense. Please try again.`);
            }
        } finally {
            this.setExpenseSaveButtonState(false);
        }
    }

    validateExpenseForm() {
        let isValid = true;
        this.clearAllExpenseErrors();

        // Validate description
        if (!this.elements.expenseDescription.value.trim()) {
            this.showExpenseError('description', 'Description is required');
            isValid = false;
        } else if (this.elements.expenseDescription.value.trim().length < 2) {
            this.showExpenseError('description', 'Description must be at least 2 characters');
            isValid = false;
        }

        // Validate amount
        const amount = parseFloat(this.elements.expenseAmount.value);
        if (!this.elements.expenseAmount.value || isNaN(amount)) {
            this.showExpenseError('amount', 'Amount is required');
            isValid = false;
        } else if (amount <= 0) {
            this.showExpenseError('amount', 'Amount must be greater than 0');
            isValid = false;
        }

        // Validate date
        if (!this.elements.expenseDate.value) {
            this.showExpenseError('date', 'Date is required');
            isValid = false;
        }

        // Validate paidBy
        if (!this.elements.expensePaidBy.value) {
            this.showExpenseError('paidBy', 'Please select who paid for this expense');
            isValid = false;
        }

        return isValid;
    }

    showExpenseError(field, message) {
        const errorElement = this.elements[`expense${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearExpenseError(field) {
        const errorElement = this.elements[`expense${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }

    clearAllExpenseErrors() {
        ['description', 'amount', 'date', 'paidBy', 'splitConfiguration'].forEach(field => {
            this.clearExpenseError(field);
        });
    }

    setExpenseSaveButtonState(isLoading) {
        if (this.elements.expenseSave) {
            this.elements.expenseSave.disabled = isLoading;
            if (isLoading) {
                this.elements.expenseSave.innerHTML = '<span class="loading-spinner-sm"></span> Adding...';
            } else {
                this.elements.expenseSave.innerHTML = '<span class="btn-icon">💰</span> Add Expense';
            }
        }
    }

    generateEqualSplit() {
        if (!this.currentEvent || !this.currentEvent.participants) {
            return {};
        }

        // Use the participant IDs directly (currentEvent.participants is an array of ID strings)
        const participantIds = this.currentEvent.participants;
        const participantCount = participantIds.length;

        if (participantCount === 0) {
            return {};
        }

        // For truly equal splits, calculate exact percentages that ensure equal dollar amounts
        // This avoids rounding issues in the final amount calculation
        const exactPercentage = 100 / participantCount;
        const roundedPercentage = Math.round(exactPercentage * 10000) / 10000; // 4 decimal precision

        const splitPercentage = {};
        let totalAssigned = 0;

        // Assign the same rounded percentage to all but last participant
        for (let i = 0; i < participantCount - 1; i++) {
            splitPercentage[participantIds[i]] = Math.round(roundedPercentage * 100) / 100; // 2 decimal for UI
            totalAssigned += splitPercentage[participantIds[i]];
        }

        // Give exact remaining to last participant (ensures total = 100.00)
        const remaining = Math.round((100 - totalAssigned) * 100) / 100;
        splitPercentage[participantIds[participantCount - 1]] = remaining;

        return splitPercentage;
    }
    
    // Split Configuration Methods
    isCurrentSplitEqual() {
        if (!this.currentSplitPercentages || Object.keys(this.currentSplitPercentages).length === 0) {
            return true; // Default to equal if no data
        }
        
        // Get the percentage values and check if they're all equal
        const percentages = Object.values(this.currentSplitPercentages).filter(p => p > 0);
        if (percentages.length === 0) return true;
        
        // Check if all non-zero percentages are the same (within a small tolerance for floating point)
        const firstPercentage = percentages[0];
        const tolerance = 0.01;
        return percentages.every(p => Math.abs(p - firstPercentage) < tolerance);
    }
    
    initializeSplitConfiguration() {
        // When editing an expense, preserve the existing split configuration
        if (this.editingExpenseId && this.currentSplitPercentages && Object.keys(this.currentSplitPercentages).length > 0) {
            // Detect if current split is equal or custom
            const isEqualSplit = this.isCurrentSplitEqual();
            
            if (isEqualSplit) {
                if (this.elements.splitEqualRadio) {
                    this.elements.splitEqualRadio.checked = true;
                }
                this.splitMode = 'equal';
            } else {
                if (this.elements.splitCustomRadio) {
                    this.elements.splitCustomRadio.checked = true;
                }
                this.splitMode = 'custom';
            }
        } else {
            // Set equal split as default for new expenses
            if (this.elements.splitEqualRadio) {
                this.elements.splitEqualRadio.checked = true;
            }
            
            // Initialize current split data
            this.currentSplitPercentages = {};
            this.splitMode = 'equal';
        }
        
        // Load initial split configuration
        this.loadSplitConfiguration();
    }
    
    loadSplitConfiguration() {
        if (!this.currentEvent || !this.currentEvent.participants) {
            return;
        }

        // Clean existing split data to remove participants who are no longer in the event
        if (this.currentSplitPercentages) {
            const originalSize = Object.keys(this.currentSplitPercentages).length;
            this.currentSplitPercentages = this.sanitizeSplitPercentages(
                this.currentSplitPercentages,
                this.currentEvent.participants
            );
            const newSize = Object.keys(this.currentSplitPercentages).length;

            if (originalSize !== newSize) {
                console.log('[EXPENSE-EDIT] Cleaned split configuration: removed', (originalSize - newSize), 'invalid participants');
            }
        }

        // Generate participant list for split configuration
        this.renderSplitParticipants();

        // Update split calculations
        this.updateSplitAmounts();
    }
    
    renderSplitParticipants() {
        if (!this.elements.splitParticipantsContainer || !this.participants) {
            return;
        }

        const participantIds = this.currentEvent.participants || [];
        const eventParticipants = this.participants.filter(p => participantIds.includes(p.id));

        if (eventParticipants.length === 0) {
            this.elements.splitParticipantsContainer.innerHTML = '<p class="text-muted">No participants selected</p>';
            return;
        }

        // Initialize split data if not already set
        if (this.splitMode === 'shares') {
            if (!this.currentSplitShares || Object.keys(this.currentSplitShares).length === 0) {
                this.currentSplitShares = this.generateEqualShares();
            }
        } else {
            if (!this.currentSplitPercentages || Object.keys(this.currentSplitPercentages).length === 0) {
                this.currentSplitPercentages = this.generateEqualSplit();
            }
        }

        const participantHtml = eventParticipants.map(participant => {
            const initials = participant.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
            const isPaidBy = this.elements.expensePaidBy && this.elements.expensePaidBy.value === participant.id;

            if (this.splitMode === 'shares') {
                const shares = this.currentSplitShares[participant.id] || 1;
                const isExcluded = shares === 0;

                return `
                    <div class="split-participant ${isExcluded ? 'excluded' : ''}" data-participant-id="${participant.id}">
                        <div class="participant-info">
                            <div class="participant-avatar">${initials}</div>
                            <div class="participant-details">
                                <h4>${participant.name}</h4>
                                <p class="participant-role">${isPaidBy ? 'Paid for expense' : 'Participant'}</p>
                            </div>
                        </div>
                        <div class="split-controls shares-controls">
                            <div class="shares-input-container">
                                <div class="shares-buttons">
                                    <button type="button" class="shares-btn shares-decrease" data-participant-id="${participant.id}" ${shares <= 0 ? 'disabled' : ''}>−</button>
                                    <input type="number" class="shares-input" id="shares-input-${participant.id}"
                                           value="${shares}" min="0" step="1">
                                    <button type="button" class="shares-btn shares-increase" data-participant-id="${participant.id}">+</button>
                                </div>
                                <div class="shares-amount-preview ${isExcluded ? 'excluded' : ''}" id="shares-amount-${participant.id}">$0.00</div>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                // Percentage mode (existing logic)
                const percentage = this.currentSplitPercentages[participant.id] || 0;

                return `
                    <div class="split-participant" data-participant-id="${participant.id}">
                        <div class="participant-info">
                            <div class="participant-avatar">${initials}</div>
                            <div class="participant-details">
                                <h4>${participant.name}</h4>
                                <p class="participant-role">${isPaidBy ? 'Paid for expense' : 'Participant'}</p>
                            </div>
                        </div>
                        <div class="split-controls percentage-controls">
                            <div class="split-toggle">
                                <input type="checkbox" class="split-checkbox" id="split-include-${participant.id}" ${percentage > 0 ? 'checked' : ''}>
                                <label for="split-include-${participant.id}">Include</label>
                            </div>
                            <div class="split-amount">
                                <input type="number" class="split-percentage-input" id="split-percentage-${participant.id}"
                                       value="${percentage.toFixed(2)}" min="0" max="100" step="0.01">
                                <span>%</span>
                                <div class="split-amount-display" id="split-amount-${participant.id}">$0.00</div>
                            </div>
                        </div>
                    </div>
                `;
            }
        }).join('');

        this.elements.splitParticipantsContainer.innerHTML = participantHtml;

        // Set the appropriate mode CSS class
        this.elements.splitParticipantsContainer.className = `split-participants-container ${this.splitMode}-mode`;

        // Bind events for split controls
        this.bindSplitControlEvents();
    }
    
    bindSplitControlEvents() {
        if (this.splitMode === 'shares') {
            // Bind shares input events
            this.elements.splitParticipantsContainer.querySelectorAll('.shares-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const participantId = e.target.id.replace('shares-input-', '');
                    const shares = parseInt(e.target.value) || 0;
                    this.handleSharesChange(participantId, shares);
                });
            });

            // Bind shares increase/decrease buttons
            this.elements.splitParticipantsContainer.querySelectorAll('.shares-increase').forEach(button => {
                button.addEventListener('click', (e) => {
                    const participantId = e.target.dataset.participantId;
                    const currentShares = this.currentSplitShares[participantId] || 0;
                    this.handleSharesChange(participantId, currentShares + 1);
                    this.renderSplitParticipants();
                });
            });

            this.elements.splitParticipantsContainer.querySelectorAll('.shares-decrease').forEach(button => {
                button.addEventListener('click', (e) => {
                    const participantId = e.target.dataset.participantId;
                    const currentShares = this.currentSplitShares[participantId] || 0;
                    if (currentShares > 0) {
                        this.handleSharesChange(participantId, currentShares - 1);
                        this.renderSplitParticipants();
                    }
                });
            });
        } else {
            // Bind checkbox events (percentage mode)
            this.elements.splitParticipantsContainer.querySelectorAll('.split-checkbox').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const participantId = e.target.id.replace('split-include-', '');
                    this.handleParticipantToggle(participantId, e.target.checked);
                });
            });

            // Bind percentage input events
            this.elements.splitParticipantsContainer.querySelectorAll('.split-percentage-input').forEach(input => {
                input.addEventListener('input', (e) => {
                    const participantId = e.target.id.replace('split-percentage-', '');
                    this.handlePercentageChange(participantId, parseFloat(e.target.value) || 0);
                });
            });
        }
    }
    
    handleSplitMethodChange() {
        const isEqual = this.elements.splitEqualRadio && this.elements.splitEqualRadio.checked;
        const isShares = this.elements.splitSharesRadio && this.elements.splitSharesRadio.checked;

        if (isEqual) {
            this.splitMode = 'equal';
        } else if (isShares) {
            this.splitMode = 'shares';
        } else {
            this.splitMode = 'custom';
        }

        if (this.elements.splitParticipantsContainer) {
            this.elements.splitParticipantsContainer.className = `split-participants-container ${this.splitMode}-mode`;
        }

        // Update split summary visibility
        this.updateSplitSummaryVisibility();

        if (isEqual) {
            // Reset to equal split
            this.currentSplitPercentages = this.generateEqualSplit();
            this.updateSplitInputs();
        } else if (isShares) {
            // Initialize shares mode
            this.currentSplitShares = this.generateEqualShares();
            this.renderSplitParticipants();
        }

        this.updateSplitAmounts();
        this.validateSplit();
    }
    
    handleParticipantToggle(participantId, isIncluded) {
        if (this.splitMode === 'equal') {
            // In equal mode, recalculate equal splits for included participants
            const includedParticipants = [];
            this.elements.splitParticipantsContainer.querySelectorAll('.split-checkbox').forEach(checkbox => {
                if (checkbox.checked) {
                    const id = checkbox.id.replace('split-include-', '');
                    includedParticipants.push(id);
                }
            });
            
            // Reset all to 0
            Object.keys(this.currentSplitPercentages).forEach(id => {
                this.currentSplitPercentages[id] = 0;
            });
            
            // Calculate equal split for included participants
            if (includedParticipants.length > 0) {
                const basePercentage = Math.floor((100 / includedParticipants.length) * 100) / 100;
                let totalAssigned = 0;
                
                for (let i = 0; i < includedParticipants.length - 1; i++) {
                    this.currentSplitPercentages[includedParticipants[i]] = basePercentage;
                    totalAssigned += basePercentage;
                }
                
                if (includedParticipants.length > 0) {
                    const remaining = Math.round((100 - totalAssigned) * 100) / 100;
                    this.currentSplitPercentages[includedParticipants[includedParticipants.length - 1]] = remaining;
                }
            }
        } else {
            // In custom mode, just set to 0 if excluded
            if (!isIncluded) {
                this.currentSplitPercentages[participantId] = 0;
            }
        }
        
        this.updateSplitInputs();
        this.updateSplitAmounts();
        this.validateSplit();
    }
    
    handlePercentageChange(participantId, percentage) {
        this.currentSplitPercentages[participantId] = percentage;
        this.updateSplitAmounts();
        this.validateSplit();
    }
    
    updateSplitInputs() {
        Object.keys(this.currentSplitPercentages).forEach(participantId => {
            const input = document.getElementById(`split-percentage-${participantId}`);
            const checkbox = document.getElementById(`split-include-${participantId}`);
            
            if (input) {
                input.value = this.currentSplitPercentages[participantId].toFixed(2);
            }
            
            if (checkbox) {
                checkbox.checked = this.currentSplitPercentages[participantId] > 0;
            }
        });
    }
    
    updateSplitAmounts() {
        const totalAmount = parseFloat(this.elements.expenseAmount?.value) || 0;

        if (this.elements.splitTotalAmount) {
            this.elements.splitTotalAmount.textContent = `$${totalAmount.toFixed(2)}`;
        }

        if (this.splitMode === 'shares') {
            // Update shares total
            const totalShares = Object.values(this.currentSplitShares || {}).reduce((sum, shares) => sum + (shares || 0), 0);
            if (this.elements.splitTotalShares) {
                this.elements.splitTotalShares.textContent = totalShares.toString();
            }

            // Update individual share amounts
            if (this.currentSplitShares && totalShares > 0) {
                Object.keys(this.currentSplitShares).forEach(participantId => {
                    const amount = this.calculateSharesAmount(participantId, totalAmount);
                    const amountDisplay = document.getElementById(`shares-amount-${participantId}`);

                    if (amountDisplay) {
                        if (this.currentSplitShares[participantId] === 0) {
                            amountDisplay.textContent = 'Excluded';
                            amountDisplay.classList.add('excluded');
                        } else {
                            amountDisplay.textContent = `$${amount.toFixed(2)}`;
                            amountDisplay.classList.remove('excluded');
                        }
                    }
                });
            }
        } else {
            // Update individual percentage amounts (existing logic)
            if (this.currentSplitPercentages) {
                Object.keys(this.currentSplitPercentages).forEach(participantId => {
                    const percentage = this.currentSplitPercentages[participantId];
                    const amount = (totalAmount * percentage) / 100;
                    const amountDisplay = document.getElementById(`split-amount-${participantId}`);

                    if (amountDisplay) {
                        amountDisplay.textContent = `$${amount.toFixed(2)}`;
                    }
                });
            }
        }

        this.validateSplit();
    }
    
    validateSplit() {
        if (this.splitMode === 'shares') {
            // Shares mode validation - always valid as long as at least one person has shares
            if (!this.currentSplitShares) {
                return false;
            }

            const totalShares = Object.values(this.currentSplitShares).reduce((sum, shares) => sum + (shares || 0), 0);
            return totalShares > 0; // Valid if anyone has shares
        } else {
            // Percentage mode validation (existing logic)
            if (!this.currentSplitPercentages) {
                return false;
            }

            const totalPercentage = Object.values(this.currentSplitPercentages).reduce((sum, p) => sum + p, 0);
            const remaining = Math.round((100 - totalPercentage) * 100) / 100;

            let isValid = Math.abs(remaining) < 0.01; // Allow for small rounding errors
            let message = '';

            if (remaining > 0.01) {
                message = `${remaining.toFixed(2)}% remaining`;
                this.elements.splitRemaining?.classList.remove('success', 'error');
            } else if (remaining < -0.01) {
                message = `${Math.abs(remaining).toFixed(2)}% over 100%`;
                isValid = false;
                this.elements.splitRemaining?.classList.add('error');
                this.elements.splitRemaining?.classList.remove('success');
            } else {
                message = '✓ Split adds up to 100%';
                this.elements.splitRemaining?.classList.add('success');
                this.elements.splitRemaining?.classList.remove('error');
            }

            if (this.elements.splitRemaining) {
                this.elements.splitRemaining.textContent = message;
            }

            return isValid;
        }
    }
    
    getSplitPercentages() {
        return { ...this.currentSplitPercentages };
    }

    // Shares-based methods
    generateEqualShares() {
        const participantIds = this.currentEvent.participants || [];
        const eventParticipants = this.participants.filter(p => participantIds.includes(p.id));
        const shares = {};

        eventParticipants.forEach(participant => {
            shares[participant.id] = 1;
        });

        return shares;
    }

    getSplitShares() {
        return { ...this.currentSplitShares };
    }

    handleSharesChange(participantId, shares) {
        this.currentSplitShares[participantId] = shares;
        this.updateSplitAmounts();
        this.validateSplit();
    }

    makeEqualSharesSplit() {
        this.currentSplitShares = this.generateEqualShares();
        this.renderSplitParticipants();
        this.updateSplitAmounts();
        this.validateSplit();
    }

    updateSplitSummaryVisibility() {
        // Show/hide percentage vs shares summary
        if (this.elements.splitRemaining) {
            this.elements.splitRemaining.style.display = this.splitMode === 'shares' ? 'none' : 'inline';
        }

        if (this.elements.splitSharesTotal) {
            this.elements.splitSharesTotal.style.display = this.splitMode === 'shares' ? 'inline' : 'none';
        }

        if (this.elements.sharesMakeEqualBtn && this.elements.sharesMakeEqualBtn.parentElement) {
            this.elements.sharesMakeEqualBtn.parentElement.style.display = this.splitMode === 'shares' ? 'flex' : 'none';
        }
    }

    calculateSharesAmount(participantId, totalAmount) {
        const shares = this.currentSplitShares[participantId] || 0;
        if (shares === 0) return 0;

        const totalShares = Object.values(this.currentSplitShares).reduce((sum, s) => sum + (s || 0), 0);
        if (totalShares === 0) return 0;

        return (totalAmount * shares) / totalShares;
    }

    // Edit Event Methods
    async showEditEventDialog() {
        if (!this.currentEvent) {
            showError('No event selected');
            return;
        }

        this.resetEditEventForm();
        await this.loadEditEventData();
        
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
    }

    async loadEditEventData() {
        // Pre-populate form fields with current event data
        if (this.elements.editEventName) {
            this.elements.editEventName.value = this.currentEvent.name || '';
        }
        
        if (this.elements.editEventDate) {
            // Convert date to YYYY-MM-DD format for date input
            let dateValue = '';
            if (this.currentEvent.date) {
                const eventDate = this.parseDateSafely(this.currentEvent.date);
                dateValue = eventDate.toISOString().split('T')[0];
            }
            this.elements.editEventDate.value = dateValue;
        }
        
        if (this.elements.editEventLocation) {
            this.elements.editEventLocation.value = this.currentEvent.location || '';
        }
        
        if (this.elements.editEventDescription) {
            this.elements.editEventDescription.value = this.currentEvent.description || '';
        }

        // Load participant management data
        await this.loadParticipantManagement();
    }

    async loadParticipantManagement() {
        if (this.elements.editParticipantsLoading) {
            this.elements.editParticipantsLoading.style.display = 'block';
        }

        try {
            // Get all users and current event expenses
            const [allUsers, eventExpenses] = await Promise.all([
                api.getUsers(),
                api.getEventCostItems(this.currentEventId)
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

        const currentParticipantIds = this.currentEvent.participants || [];
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
    }

    renderAvailableParticipants(allUsers) {
        if (!this.elements.editAvailableParticipants) return;

        const currentParticipantIds = this.currentEvent.participants || [];
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
    }

    async addParticipant(participantId) {
        try {
            // Add participant to current event data
            if (!this.currentEvent.participants) {
                this.currentEvent.participants = [];
            }
            
            if (!this.currentEvent.participants.includes(participantId)) {
                this.currentEvent.participants.push(participantId);
                
                // Reload participant management UI
                await this.loadParticipantManagement();
            }
        } catch (error) {
            console.error('Failed to add participant:', error);
            showError('Failed to add participant. Please try again.');
        }
    }

    showRemoveParticipantDialog(participantId, participantName, hasExpenses) {
        this.participantToRemove = participantId;
        
        if (this.elements.removeParticipantName) {
            this.elements.removeParticipantName.textContent = participantName;
        }
        
        if (this.elements.removeParticipantWarning) {
            if (hasExpenses) {
                this.elements.removeParticipantWarning.style.display = 'block';
            } else {
                this.elements.removeParticipantWarning.style.display = 'none';
            }
        }
        
        if (this.elements.confirmRemoveParticipantModal) {
            this.elements.confirmRemoveParticipantModal.style.display = 'flex';
        }
    }

    hideRemoveParticipantDialog() {
        this.participantToRemove = null;
        
        if (this.elements.confirmRemoveParticipantModal) {
            this.elements.confirmRemoveParticipantModal.style.display = 'none';
        }
    }

    async confirmRemoveParticipant() {
        if (!this.participantToRemove) return;

        try {
            // Remove participant from current event data
            if (this.currentEvent.participants) {
                const index = this.currentEvent.participants.indexOf(this.participantToRemove);
                if (index > -1) {
                    this.currentEvent.participants.splice(index, 1);
                    
                    // Reload participant management UI
                    await this.loadParticipantManagement();
                }
            }
            
            this.hideRemoveParticipantDialog();
        } catch (error) {
            console.error('Failed to remove participant:', error);
            showError('Failed to remove participant. Please try again.');
        }
    }

    async handleEditEvent() {
        console.log('[EVENT-DETAIL.JS] handleEditEvent called', {
            currentEvent: this.currentEvent?.id,
            eventExists: !!this.currentEvent
        });
        
        // First check: event-detail page must be visible and active
        const eventDetailPage = document.getElementById('event-detail-page');
        const isEventDetailPageVisible = eventDetailPage && !eventDetailPage.classList.contains('hidden') && 
                                        eventDetailPage.style.display !== 'none';
        
        if (!isEventDetailPageVisible) {
            console.warn('[EVENT-DETAIL.JS] handleEditEvent called but event-detail page is not visible, ignoring');
            return;
        }
        
        // Second check: must have a current event loaded
        if (!this.currentEvent) {
            console.warn('[EVENT-DETAIL.JS] handleEditEvent called but no event is currently being edited');
            return;
        }

        if (!this.validateEditEventForm()) {
            return;
        }

        this.setEditEventSaveButtonState(true);

        try {
            const formData = new FormData(this.elements.editEventForm);
            const eventData = {
                name: formData.get('name').trim(),
                date: formData.get('date'),
                location: formData.get('location').trim(),
                description: formData.get('description') ? formData.get('description').trim() : '',
                participants: this.currentEvent.participants
            };

            console.log('[EVENT-DETAIL.JS] About to update event', {
                eventId: this.currentEventId,
                eventData,
                formName: formData.get('name'),
                currentEventName: this.currentEvent.name
            });

            const updatedEvent = await api.updateEvent(this.currentEventId, eventData);
            
            console.log('[EVENT-DETAIL.JS] Event updated', {
                updatedEvent,
                updatedEventName: updatedEvent.name
            });
            
            this.hideEditEventDialog();
            await this.refresh();
            
            showSuccess(`Event "${updatedEvent.data?.name || this.currentEvent.name}" updated successfully!`);
            
        } catch (error) {
            console.error('Failed to update event:', error);
            
            if (error.message.includes('name already exists')) {
                this.showEditEventError('name', 'An event with this name already exists');
            } else if (error.message.includes('participants')) {
                this.showEditEventError('participants', 'At least one participant is required');
            } else {
                showError('Failed to update event. Please try again.');
            }
        } finally {
            this.setEditEventSaveButtonState(false);
        }
    }

    validateEditEventForm() {
        let isValid = true;
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
            this.showEditEventError('date', 'Date is required');
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

        // Validate participants - check if currentEvent exists
        if (!this.currentEvent || !this.currentEvent.participants || this.currentEvent.participants.length === 0) {
            this.showEditEventError('participants', 'At least one participant is required');
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
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
    }

    clearAllEditEventErrors() {
        ['name', 'date', 'location'].forEach(field => {
            this.clearEditEventError(field);
        });
        
        // Clear participants error manually since it has a different pattern
        if (this.elements.editParticipantsError) {
            this.elements.editParticipantsError.style.display = 'none';
            this.elements.editParticipantsError.textContent = '';
        }
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

    // Delete Event Methods
    async showDeleteEventDialog() {
        if (!this.currentEvent) {
            showError('No event selected');
            return;
        }

        // Set event name in confirmation dialog
        if (this.elements.deleteEventName) {
            this.elements.deleteEventName.textContent = this.currentEvent.name;
        }

        // Check if event has expenses
        try {
            const eventExpenses = await api.getEventCostItems(this.currentEventId);
            const hasExpenses = eventExpenses && eventExpenses.length > 0;

            if (this.elements.deleteEventWarning) {
                if (hasExpenses) {
                    this.elements.deleteEventWarning.style.display = 'block';
                } else {
                    this.elements.deleteEventWarning.style.display = 'none';
                }
            }

            // Show participants warning
            if (this.elements.deleteEventParticipantsWarning && this.elements.deleteEventParticipantCount) {
                const participantCount = this.currentEvent.participants ? this.currentEvent.participants.length : 0;
                if (participantCount > 0) {
                    this.elements.deleteEventParticipantCount.textContent = participantCount;
                    this.elements.deleteEventParticipantsWarning.style.display = 'block';
                } else {
                    this.elements.deleteEventParticipantsWarning.style.display = 'none';
                }
            }

        } catch (error) {
            console.error('Failed to check event expenses:', error);
            // Still allow deletion, but show warning
            if (this.elements.deleteEventWarning) {
                this.elements.deleteEventWarning.style.display = 'block';
            }
        }

        // Show confirmation modal
        if (this.elements.confirmDeleteEventModal) {
            this.elements.confirmDeleteEventModal.style.display = 'flex';
        }
    }

    hideDeleteEventDialog() {
        if (this.elements.confirmDeleteEventModal) {
            this.elements.confirmDeleteEventModal.style.display = 'none';
        }
        
        // Reset delete button state for next use
        if (this.elements.confirmDeleteEventOk) {
            this.elements.confirmDeleteEventOk.disabled = false;
            this.elements.confirmDeleteEventOk.innerHTML = 'Delete Event';
        }
    }

    async confirmDeleteEvent() {
        // Only proceed if the delete dialog was initiated from this page
        const deleteModal = document.getElementById('confirm-delete-event-modal');
        const isModalVisible = deleteModal && deleteModal.style.display !== 'none';
        const eventDetailPage = document.getElementById('event-detail-page');
        const isEventDetailActive = eventDetailPage && eventDetailPage.style.display !== 'none';
        
        if (!isModalVisible || !isEventDetailActive || !this.currentEventId || !this.currentEvent) {
            // If modal isn't visible or we're not on event detail page, don't handle
            return;
        }
        
        // Additional check: make sure the modal is showing OUR event
        const eventNameSpan = deleteModal.querySelector('#delete-event-name');
        if (eventNameSpan && eventNameSpan.textContent !== this.currentEvent.name) {
            // Modal is showing a different event - don't handle
            return;
        }

        try {
            // Disable the delete button to prevent double-deletion
            if (this.elements.confirmDeleteEventOk) {
                this.elements.confirmDeleteEventOk.disabled = true;
                this.elements.confirmDeleteEventOk.innerHTML = '<span class="loading-spinner-sm"></span> Deleting...';
            }

            // Delete the event via API
            await api.deleteEvent(this.currentEventId);

            // Hide confirmation dialog
            this.hideDeleteEventDialog();

            // Show success message
            showSuccess(`Event "${this.currentEvent.name}" deleted successfully!`);

            // Navigate back to events page
            this.goBackToEvents();

        } catch (error) {
            // Re-enable delete button
            if (this.elements.confirmDeleteEventOk) {
                this.elements.confirmDeleteEventOk.disabled = false;
                this.elements.confirmDeleteEventOk.innerHTML = 'Delete Event';
            }

            if (error.message.includes('has expenses') || error.message.includes('cannot be deleted')) {
                showError('Cannot delete event: This event has expenses or other dependencies. Please remove all expenses first.');
            } else {
                showError('Failed to delete event. Please try again.');
            }
        }
    }

    /**
     * Sanitize expense data to remove participants who are no longer in the event
     * @param {Object} expenseData - The expense data to sanitize
     * @param {Array} currentParticipants - Array of current event participant IDs
     * @returns {Object} Sanitized expense data
     */
    sanitizeExpenseData(expenseData, currentParticipants) {
        if (!currentParticipants) {
            return expenseData;
        }

        if (expenseData.splitPercentage) {
            // Handle percentage mode sanitization (existing logic)
            const validSplit = {};
            let totalValidPercentage = 0;
            let removedParticipants = 0;

            // Keep only current participants
            for (const [userId, percentage] of Object.entries(expenseData.splitPercentage)) {
                if (currentParticipants.includes(userId)) {
                    validSplit[userId] = percentage;
                    totalValidPercentage += percentage;
                } else {
                    removedParticipants++;
                    console.log('[EXPENSE-EDIT] Removing participant from percentage split:', userId);
                }
            }

            // Log debug info about the sanitization
            console.log('[EXPENSE-EDIT] Percentage sanitization - removedParticipants:', removedParticipants, 'totalValidPercentage:', totalValidPercentage);

            // If we removed participants, recalculate percentages
            if (removedParticipants > 0 && totalValidPercentage > 0) {
                console.log('[EXPENSE-EDIT] Recalculating split percentages after removing', removedParticipants, 'participants');

                // Normalize to 100%
                const factor = 100 / totalValidPercentage;
                let adjustedTotal = 0;

                console.log('[EXPENSE-EDIT] Normalization factor:', factor, 'Original valid split:', validSplit);

                for (const userId in validSplit) {
                    const originalPercentage = validSplit[userId];
                    validSplit[userId] = Math.round(validSplit[userId] * factor * 100) / 100;
                    adjustedTotal += validSplit[userId];
                    console.log('[EXPENSE-EDIT] Adjusted', userId, 'from', originalPercentage, 'to', validSplit[userId]);
                }

                // Handle rounding errors by adjusting the largest percentage
                if (Math.abs(adjustedTotal - 100) > 0.01) {
                    const largestUserId = Object.keys(validSplit).reduce((a, b) =>
                        validSplit[a] > validSplit[b] ? a : b
                    );
                    console.log('[EXPENSE-EDIT] Rounding adjustment needed - current total:', adjustedTotal, 'adjusting', largestUserId);
                    validSplit[largestUserId] += (100 - adjustedTotal);
                    validSplit[largestUserId] = Math.round(validSplit[largestUserId] * 100) / 100;
                }

                console.log('[EXPENSE-EDIT] Final sanitized percentage split:', validSplit);
            }

            return { ...expenseData, splitPercentage: validSplit };
        } else if (expenseData.splitShares) {
            // Handle shares mode sanitization
            const validShares = {};
            let removedParticipants = 0;

            // Keep only current participants
            for (const [userId, shares] of Object.entries(expenseData.splitShares)) {
                if (currentParticipants.includes(userId)) {
                    validShares[userId] = shares;
                } else {
                    removedParticipants++;
                    console.log('[EXPENSE-EDIT] Removing participant from shares split:', userId);
                }
            }

            console.log('[EXPENSE-EDIT] Shares sanitization - removedParticipants:', removedParticipants, 'Final sanitized shares split:', validShares);

            return { ...expenseData, splitShares: validShares };
        }

        return expenseData;
    }

    /**
     * Sanitize split percentages to only include current event participants
     * @param {Object} splitPercentages - Current split percentages
     * @param {Array} currentParticipants - Array of current event participant IDs
     * @returns {Object} Sanitized split percentages
     */
    sanitizeSplitPercentages(splitPercentages, currentParticipants) {
        if (!splitPercentages || !currentParticipants) {
            return {};
        }

        const validSplit = {};
        let totalValidPercentage = 0;
        let removedCount = 0;

        // First pass: collect valid participants and calculate total
        for (const [userId, percentage] of Object.entries(splitPercentages)) {
            if (currentParticipants.includes(userId)) {
                validSplit[userId] = percentage;
                totalValidPercentage += percentage;
            } else {
                removedCount++;
            }
        }

        // If no participants were removed, return as is
        if (removedCount === 0) {
            return validSplit;
        }

        // If some participants were removed, recalculate percentages to total 100%
        const validParticipantCount = Object.keys(validSplit).length;
        if (validParticipantCount === 0) {
            return {};
        }

        // Recalculate percentages proportionally
        const scaleFactor = 100 / totalValidPercentage;
        for (const userId of Object.keys(validSplit)) {
            validSplit[userId] = parseFloat((validSplit[userId] * scaleFactor).toFixed(2));
        }

        // Ensure the total is exactly 100% by adjusting the first participant if needed
        const newTotal = Object.values(validSplit).reduce((sum, val) => sum + val, 0);
        if (Math.abs(newTotal - 100) > 0.01) {
            const firstParticipant = Object.keys(validSplit)[0];
            validSplit[firstParticipant] = parseFloat((validSplit[firstParticipant] + (100 - newTotal)).toFixed(2));
        }

        console.log(`Recalculated split after removing ${removedCount} participants:`, validSplit);
        return validSplit;
    }

    async refresh() {
        if (this.currentEventId) {
            await this.showEvent(this.currentEventId);
        }
    }

    /**
     * Share event with read-only URL
     */
    shareEvent() {
        if (!this.currentEventId) {
            showError('Cannot share event: Event not loaded');
            return;
        }

        // Generate read-only URL
        const currentUrl = window.location.href.split('?')[0];
        const shareUrl = `${currentUrl}?readonly=true`;

        // Try to copy to clipboard
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(shareUrl)
                .then(() => {
                    showSuccess('Share link copied to clipboard!');
                })
                .catch(err => {
                    console.error('Failed to copy to clipboard:', err);
                    this.showShareDialog(shareUrl);
                });
        } else {
            // Fallback for browsers without clipboard API
            this.showShareDialog(shareUrl);
        }
    }

    /**
     * Show share dialog with URL
     */
    showShareDialog(shareUrl) {
        // Create and show a simple share dialog
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            border: 2px solid #d1d5db;
            border-radius: 12px;
            padding: 24px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            z-index: 1000;
        `;

        dialog.innerHTML = `
            <h3 style="margin-top: 0; margin-bottom: 16px; color: #374151;">Share Event (Read-Only)</h3>
            <p style="margin-bottom: 16px; color: #6b7280;">Share this link to let others view the event without editing:</p>
            <div style="margin-bottom: 16px;">
                <input
                    type="text"
                    value="${shareUrl}"
                    readonly
                    style="width: 100%; padding: 8px 12px; border: 2px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 14px;"
                    onclick="this.select()"
                >
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button
                    onclick="this.parentElement.parentElement.remove()"
                    style="padding: 8px 16px; border: 2px solid #d1d5db; border-radius: 6px; background: white; cursor: pointer;"
                >
                    Close
                </button>
                <button
                    onclick="navigator.clipboard.writeText('${shareUrl}').then(() => showSuccess('Copied to clipboard!')); this.parentElement.parentElement.remove();"
                    style="padding: 8px 16px; border: none; border-radius: 6px; background: #667eea; color: white; cursor: pointer;"
                >
                    Copy Link
                </button>
            </div>
        `;

        // Add overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        `;
        overlay.onclick = () => {
            document.body.removeChild(overlay);
            document.body.removeChild(dialog);
        };

        document.body.appendChild(overlay);
        document.body.appendChild(dialog);

        // Auto-select the URL
        const input = dialog.querySelector('input');
        input.focus();
        input.select();
    }

    /**
     * Apply read-only mode by hiding all edit/add/delete buttons and adding visual indicators
     */
    applyReadOnlyMode() {
        console.log('EventDetailPage: Applying read-only mode');

        // Hide all edit/add/delete action buttons (but keep share button visible)
        const actionButtons = [
            '#add-expense-btn',
            '#add-first-expense-btn',
            '#edit-event-btn',
            '#delete-event-btn',
            '.edit-expense-btn',
            '.delete-expense-btn',
            '.btn-danger',
            '.btn-primary:not(.btn-outline)', // Keep share buttons but hide action buttons
        ];

        actionButtons.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                element.style.display = 'none';
            });
        });

        // Add read-only banner
        this.showReadOnlyBanner();

        // Disable all form inputs in modals
        const formInputs = document.querySelectorAll('#add-expense-modal input, #add-expense-modal select, #add-expense-modal textarea, #add-expense-modal button[type="submit"]');
        formInputs.forEach(input => {
            input.disabled = true;
        });

        console.log('EventDetailPage: Read-only mode applied');
    }

    /**
     * Show read-only banner at the top of the page
     */
    showReadOnlyBanner() {
        // Check if banner already exists
        if (document.getElementById('readonly-banner')) {
            return;
        }

        const banner = document.createElement('div');
        banner.id = 'readonly-banner';
        banner.style.cssText = `
            background: #f3f4f6;
            border: 2px solid #d1d5db;
            border-radius: 8px;
            padding: 12px 16px;
            margin: 16px 20px;
            text-align: center;
            color: #374151;
            font-weight: 500;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        `;

        banner.innerHTML = `
            <span style="font-size: 18px;">👁️</span>
            <span>This is a read-only view. No changes can be made.</span>
        `;

        // Insert banner at the top of the event detail page
        const eventDetailPage = document.getElementById('event-detail');
        if (eventDetailPage && eventDetailPage.firstChild) {
            eventDetailPage.insertBefore(banner, eventDetailPage.firstChild);
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