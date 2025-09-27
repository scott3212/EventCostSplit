class PaymentsPage {
    constructor(api) {
        console.log('PaymentsPage constructor called', api);
        this.api = api;
        this.payments = [];
        this.users = [];
        this.settlementSuggestions = [];
        this.bindEvents();
    }

    bindEvents() {
        // Record Payment button
        const recordPaymentBtn = document.getElementById('record-payment-btn');
        if (recordPaymentBtn) {
            recordPaymentBtn.addEventListener('click', () => this.showRecordPaymentModal());
        }

        // Process Settlement buttons (will be bound dynamically)
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('process-settlement-btn')) {
                const fromUserId = e.target.dataset.fromUserId;
                const toUserId = e.target.dataset.toUserId;
                const amount = parseFloat(e.target.dataset.amount);
                this.processSettlement(fromUserId, toUserId, amount);
            }
        });

        // Record Payment Cancel button
        const recordPaymentCancelBtn = document.getElementById('record-payment-cancel');
        if (recordPaymentCancelBtn) {
            recordPaymentCancelBtn.addEventListener('click', () => this.hideRecordPaymentModal());
        }

        // Record Payment Save button
        const recordPaymentSaveBtn = document.getElementById('record-payment-save');
        if (recordPaymentSaveBtn) {
            recordPaymentSaveBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleRecordPayment();
            });
        }

        // Modal close events (X button and click outside)
        const recordPaymentModal = document.getElementById('record-payment-modal');
        if (recordPaymentModal) {
            const closeBtn = recordPaymentModal.querySelector('.modal-close');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => this.hideRecordPaymentModal());
            }
            recordPaymentModal.addEventListener('click', (e) => {
                if (e.target === recordPaymentModal) {
                    this.hideRecordPaymentModal();
                }
            });
        }
    }

    async loadPage() {
        console.log('PaymentsPage.loadPage() called');
        try {
            this.showLoading();
            console.log('Loading payments data...');
            
            // Load data in parallel
            const [usersResponse, paymentsResponse, suggestionsResponse] = await Promise.all([
                this.api.getUsers(),
                this.api.getPayments(), 
                this.api.getSettlementSuggestions().catch(() => ({ settlements: [] })) // Fallback if no suggestions
            ]);

            console.log('Data loaded:', { usersResponse, paymentsResponse, suggestionsResponse });

            this.users = usersResponse.data || usersResponse || [];
            this.payments = paymentsResponse.data || paymentsResponse || [];
            this.settlementSuggestions = suggestionsResponse.settlements || [];

            console.log('Parsed data:', { 
                users: this.users.length, 
                payments: this.payments.length, 
                suggestions: this.settlementSuggestions.length 
            });

            this.hideLoading();
            this.renderPage();
            console.log('PaymentsPage rendering complete');
        } catch (error) {
            console.error('Error loading payments page:', error);
            this.showError('Failed to load payments data');
            this.hideLoading();
        }
    }

    renderPage() {
        this.renderUserBalances();
        this.renderSettlementSuggestions();
        this.renderRecentPayments();
    }

    renderUserBalances() {
        const container = document.getElementById('user-balances-container');
        if (!container) {
            console.error('PaymentsPage: user-balances-container not found');
            return;
        }
        console.log('PaymentsPage: Rendering user balances for', this.users.length, 'users');

        if (this.users.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">👥</div>
                    <h3>No Users Found</h3>
                    <p>Add users to see balance information.</p>
                </div>
            `;
            return;
        }

        // Sort users by balance (highest positive first, then negative)
        const sortedUsers = [...this.users].sort((a, b) => {
            const balanceA = a.totalBalance || 0;
            const balanceB = b.totalBalance || 0;
            return balanceB - balanceA;
        });

        const balanceCards = sortedUsers.map(user => {
            const balance = user.totalBalance || 0;
            const balanceClass = balance > 0.01 ? 'positive' : balance < -0.01 ? 'negative' : 'zero';
            const statusText = balance > 0.01 ? 'Owed money' : balance < -0.01 ? 'Owes money' : 'All settled';
            
            return `
                <div class="balance-card ${balanceClass}">
                    <div class="balance-header">
                        <div class="user-info">
                            <h4>${user.name}</h4>
                            <p class="balance-status">${statusText}</p>
                        </div>
                        <div class="balance-amount ${balanceClass}">
                            $${Math.abs(balance).toFixed(2)}
                        </div>
                    </div>
                    ${user.email ? `<div class="user-contact">${user.email}</div>` : ''}
                </div>
            `;
        }).join('');

        container.innerHTML = balanceCards;
    }

    renderSettlementSuggestions() {
        const container = document.getElementById('settlement-suggestions-container');
        if (!container) {
            console.error('PaymentsPage: settlement-suggestions-container not found');
            return;
        }
        console.log('PaymentsPage: Rendering settlement suggestions:', this.settlementSuggestions.length, 'suggestions');

        if (this.settlementSuggestions.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">✅</div>
                    <h3>All Settled!</h3>
                    <p>No outstanding balances to settle.</p>
                </div>
            `;
            return;
        }

        const suggestionCards = this.settlementSuggestions.map(settlement => `
            <div class="settlement-card">
                <div class="settlement-info">
                    <div class="settlement-description">
                        <strong>${settlement.from.userName}</strong> pays to the group
                    </div>
                    <div class="settlement-amount">$${settlement.amount.toFixed(2)}</div>
                </div>
                <button class="btn btn-primary process-settlement-btn" 
                        data-from-user-id="${settlement.from.userId}"
                        data-to-user-id="${settlement.to.userId}"
                        data-amount="${settlement.amount}">
                    Process Settlement
                </button>
            </div>
        `).join('');

        container.innerHTML = suggestionCards;
    }

    renderRecentPayments() {
        const container = document.getElementById('recent-payments-container');
        if (!container) {
            console.error('PaymentsPage: recent-payments-container not found');
            return;
        }
        console.log('PaymentsPage: Rendering recent payments:', this.payments.length, 'payments');

        if (this.payments.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon">💳</div>
                    <h3>No Payments Yet</h3>
                    <p>Payment history will appear here.</p>
                </div>
            `;
            return;
        }

        // Sort payments by date (most recent first)
        const sortedPayments = [...this.payments].sort((a, b) => 
            new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date)
        ).slice(0, 10); // Show last 10 payments

        const paymentRows = sortedPayments.map(payment => {
            const date = payment.createdAt || payment.date;
            const formattedDate = date ? new Date(date).toLocaleDateString() : 'Unknown';
            const userName = this.getUserName(payment.userId);
            
            return `
                <div class="payment-row">
                    <div class="payment-info">
                        <div class="payment-description">
                            <strong>${userName}</strong>
                            ${payment.description ? ` - ${payment.description}` : ''}
                        </div>
                        <div class="payment-date">${formattedDate}</div>
                    </div>
                    <div class="payment-amount">+$${payment.amount.toFixed(2)}</div>
                </div>
            `;
        }).join('');

        container.innerHTML = paymentRows;
    }

    getUserName(userId) {
        const user = this.users.find(u => u.id === userId);
        return user ? user.name : 'Unknown User';
    }

    showRecordPaymentModal() {
        const modal = document.getElementById('record-payment-modal');
        if (!modal) return;

        // Populate user select options
        this.populateUserSelect();

        // Clear form
        const form = document.getElementById('record-payment-form');
        if (form) form.reset();

        // Clear any previous errors
        this.clearFormErrors();

        modal.style.display = 'flex';
    }

    hideRecordPaymentModal() {
        const modal = document.getElementById('record-payment-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    populateUserSelect() {
        const select = document.getElementById('payment-user-id');
        if (!select) return;

        // Sort users by name
        const sortedUsers = [...this.users].sort((a, b) => a.name.localeCompare(b.name));

        select.innerHTML = '<option value="">Select user...</option>' + 
            sortedUsers.map(user => `
                <option value="${user.id}">${user.name}</option>
            `).join('');
    }

    async handleRecordPayment() {
        const form = document.getElementById('record-payment-form');
        if (!form) return;

        const formData = new FormData(form);
        const paymentData = {
            userId: formData.get('userId'),
            amount: parseFloat(formData.get('amount')),
            description: formData.get('description'),
            date: formData.get('date') || new Date().toISOString().split('T')[0]
        };

        // Validate form
        if (!this.validatePaymentForm(paymentData)) {
            return;
        }

        try {
            // Update button to show loading state
            const submitBtn = document.getElementById('record-payment-save');
            const spinner = document.getElementById('record-payment-spinner');
            const saveText = document.getElementById('record-payment-save-text');

            if (submitBtn && spinner && saveText) {
                submitBtn.disabled = true;
                spinner.style.display = 'inline-block';
                saveText.textContent = 'Recording...';
            }

            await this.api.createPayment(paymentData);

            this.hideRecordPaymentModal();
            this.showSuccess('Payment recorded successfully!');

            // Reload page data
            await this.loadPage();

        } catch (error) {
            console.error('Error recording payment:', error);
            this.showError('Failed to record payment. Please try again.');
        } finally {
            // Reset button state
            const submitBtn = document.getElementById('record-payment-save');
            const spinner = document.getElementById('record-payment-spinner');
            const saveText = document.getElementById('record-payment-save-text');

            if (submitBtn && spinner && saveText) {
                submitBtn.disabled = false;
                spinner.style.display = 'none';
                saveText.textContent = 'Record Payment';
            }
        }
    }

    validatePaymentForm(paymentData) {
        this.clearFormErrors();
        let isValid = true;

        // Validate user
        if (!paymentData.userId) {
            this.showFieldError('userId', 'Please select a user');
            isValid = false;
        }

        // Validate amount
        if (!paymentData.amount || paymentData.amount == 0) {
            this.showFieldError('amount', 'Please enter a non-zero amount (negative for refunds)');
            isValid = false;
        }

        return isValid;
    }

    showFieldError(fieldName, message) {
        const errorElement = document.getElementById(`${fieldName}-error`);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
    }

    clearFormErrors() {
        const errorElements = document.querySelectorAll('.form-error');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
    }

    async processSettlement(fromUserId, toUserId, amount) {
        try {
            const fromUser = this.users.find(u => u.id === fromUserId);
            const toUser = this.users.find(u => u.id === toUserId);
            
            if (!fromUser || !toUser) {
                this.showError('Unable to find users for settlement');
                return;
            }

            const settlementData = {
                fromUserId,
                toUserId,
                amount,
                description: `Settlement: ${fromUser.name} pays $${amount.toFixed(2)} to group`
            };

            await this.api.processSettlement(settlementData);
            
            this.showSuccess(`Settlement processed: ${fromUser.name} paid $${amount.toFixed(2)} to the group`);
            
            // Reload page data
            await this.loadPage();

        } catch (error) {
            console.error('Error processing settlement:', error);
            this.showError('Failed to process settlement. Please try again.');
        }
    }

    showLoading() {
        const container = document.getElementById('payments-content');
        if (container) {
            container.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p>Loading payments data...</p>
                </div>
            `;
        }
    }

    hideLoading() {
        const container = document.getElementById('payments-content');
        if (container) {
            container.innerHTML = `
                <!-- User Balances Section -->
                <div class="payments-section">
                    <div class="section-header">
                        <h2>💰 Current Balances</h2>
                        <p>Overview of who owes money and who is owed</p>
                    </div>
                    <div id="user-balances-container" class="balances-grid">
                        <div class="loading-placeholder">Loading balances...</div>
                    </div>
                </div>

                <!-- Settlement Suggestions Section -->
                <div class="payments-section">
                    <div class="section-header">
                        <h2>🤝 Settlement Suggestions</h2>
                        <p>Recommended payments to settle balances efficiently</p>
                    </div>
                    <div id="settlement-suggestions-container" class="settlements-list">
                        <div class="loading-placeholder">Loading settlement suggestions...</div>
                    </div>
                </div>

                <!-- Recent Payments Section -->
                <div class="payments-section">
                    <div class="section-header">
                        <h2>📊 Recent Payments</h2>
                        <p>Transaction history and payment records</p>
                    </div>
                    <div id="recent-payments-container" class="payments-list">
                        <div class="loading-placeholder">Loading recent payments...</div>
                    </div>
                </div>
            `;
        }
    }

    showError(message) {
        const modal = document.getElementById('error-modal');
        const messageElement = document.getElementById('error-message');
        if (modal && messageElement) {
            messageElement.textContent = message;
            modal.style.display = 'flex';
        }
    }

    showSuccess(message) {
        const modal = document.getElementById('success-modal');
        const messageElement = document.getElementById('success-message');
        if (modal && messageElement) {
            messageElement.textContent = message;
            modal.style.display = 'flex';
        }
    }
}

// Initialize when DOM is loaded
if (typeof window !== 'undefined') {
    window.PaymentsPage = PaymentsPage;
}