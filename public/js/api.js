class ApiClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.headers = {
            'Content-Type': 'application/json'
        };
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}/api${endpoint}`;
        
        const config = {
            headers: { ...this.headers, ...options.headers },
            ...options
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                const error = await response.json().catch(() => ({ message: 'Request failed' }));
                throw new Error(error.error || error.message || `HTTP ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            
            return await response.text();
        } catch (error) {
            console.error(`API Error [${options.method || 'GET'}] ${endpoint}:`, error);
            throw error;
        }
    }

    async get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    async post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: data
        });
    }

    async put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: data
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async checkHealth() {
        try {
            await this.get('/health');
            return true;
        } catch (error) {
            return false;
        }
    }

    // User endpoints
    async getUsers() {
        const response = await this.get('/users');
        return response.data || response || [];
    }

    async getUser(id) {
        return this.get(`/users/${id}`);
    }

    async createUser(userData) {
        const response = await this.post('/users', userData);
        return response.data || response;
    }

    async updateUser(id, userData) {
        const response = await this.put(`/users/${id}`, userData);
        return response.data || response;
    }

    async deleteUser(id) {
        return this.delete(`/users/${id}`);
    }

    async getUserEvents(id) {
        const response = await this.get(`/users/${id}/events`);
        return response.data || response || [];
    }

    async getUserPayments(id) {
        const response = await this.get(`/users/${id}/payments`);
        return response.data || response || [];
    }

    // Event endpoints
    async getEvents() {
        return this.get('/events');
    }

    async getEvent(id) {
        return this.get(`/events/${id}`);
    }

    async createEvent(eventData) {
        const response = await this.post('/events', eventData);
        return response.data || response;
    }

    async updateEvent(id, eventData) {
        return this.put(`/events/${id}`, eventData);
    }

    async deleteEvent(id) {
        return this.delete(`/events/${id}`);
    }

    async getEventById(id) {
        const response = await this.get(`/events/${id}`);
        return response.data || response;
    }

    async getEventParticipants(id) {
        // Use fallback approach since the participants endpoint doesn't exist yet
        try {
            const event = await this.getEventById(id);
            const users = await this.getUsers();
            return users.filter(user => event.participants && event.participants.includes(user.id));
        } catch (error) {
            console.error('Failed to get event participants:', error);
            return [];
        }
    }

    async getEventCostItems(id) {
        // Use fallback approach since the cost-items endpoint filtering doesn't exist yet
        try {
            const allCostItems = await this.getCostItems();
            const costItems = allCostItems.data || allCostItems || [];
            return costItems.filter(item => item.eventId === id);
        } catch (error) {
            console.error('Failed to get event cost items:', error);
            return [];
        }
    }

    async getEventBalance(id) {
        const response = await this.get(`/events/${id}/balance`);
        return response.data || response;
    }

    async getUserBalance(id) {
        const response = await this.get(`/users/${id}/balance`);
        return response.data || response;
    }

    async getUserBalanceBreakdown(id) {
        const response = await this.get(`/users/${id}/balance/breakdown`);
        return response.data || response;
    }

    // Cost Item endpoints
    async getCostItems() {
        return this.get('/cost-items');
    }

    async getCostItem(id) {
        return this.get(`/cost-items/${id}`);
    }

    async createCostItem(costItemData) {
        const response = await this.post('/cost-items', costItemData);
        return response.data || response;
    }

    async updateCostItem(id, costItemData) {
        return this.put(`/cost-items/${id}`, costItemData);
    }

    async deleteCostItem(id) {
        return this.delete(`/cost-items/${id}`);
    }

    // Payment endpoints
    async getPayments() {
        return this.get('/payments');
    }

    async getPayment(id) {
        return this.get(`/payments/${id}`);
    }

    async createPayment(paymentData) {
        const response = await this.post('/payments', paymentData);
        return response.data || response;
    }

    async updatePayment(id, paymentData) {
        return this.put(`/payments/${id}`, paymentData);
    }

    async deletePayment(id) {
        return this.delete(`/payments/${id}`);
    }

    // Settlement endpoints
    async processSettlement(settlementData) {
        const response = await this.post('/payments/settlement', settlementData);
        return response.data || response;
    }

    async getSettlementSuggestions() {
        const response = await this.get('/payments/settlement/suggestions');
        return response.data || response;
    }

    // Dashboard analytics
    async getDashboardStats() {
        try {
            const [usersResponse, eventsResponse, costItemsResponse, paymentsResponse] = await Promise.all([
                this.get('/users'),
                this.get('/events'),
                this.get('/cost-items'),
                this.get('/payments')
            ]);

            const users = usersResponse.data || usersResponse || [];
            const events = eventsResponse.data || eventsResponse || [];
            const costItems = costItemsResponse.data || costItemsResponse || [];
            const payments = paymentsResponse.data || paymentsResponse || [];

            const totalExpenses = costItems.reduce((sum, item) => sum + (item.amount || 0), 0);
            const totalPayments = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
            
            return {
                usersCount: users.length,
                eventsCount: events.length,
                totalExpenses: totalExpenses,
                totalPayments: totalPayments,
                pendingAmount: totalExpenses - totalPayments,
                recentActivity: this.getRecentActivity(costItems, payments)
            };
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error);
            return {
                usersCount: 0,
                eventsCount: 0,
                totalExpenses: 0,
                totalPayments: 0,
                pendingAmount: 0,
                recentActivity: []
            };
        }
    }

    getRecentActivity(costItems = [], payments = []) {
        const activities = [];
        
        costItems.slice(-5).forEach(item => {
            activities.push({
                type: 'expense',
                description: `Expense: ${item.description || 'Unnamed'}`,
                amount: item.amount,
                date: item.createdAt
            });
        });

        payments.slice(-5).forEach(payment => {
            activities.push({
                type: 'payment',
                description: `Payment received`,
                amount: payment.amount,
                date: payment.createdAt
            });
        });

        return activities
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10);
    }
}

const api = new ApiClient();

function showError(message, error = null) {
    console.error('Error:', message, error);
    
    const errorModal = document.getElementById('error-modal');
    const errorMessage = document.getElementById('error-message');
    
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.style.display = 'flex';
    } else {
        alert(message);
    }
}

function hideError() {
    const errorModal = document.getElementById('error-modal');
    if (errorModal) {
        errorModal.style.display = 'none';
    }
}

function showSuccess(message) {
    console.log('Success:', message);
    
    const successModal = document.getElementById('success-modal');
    const successMessage = document.getElementById('success-message');
    
    if (successModal && successMessage) {
        successMessage.textContent = message;
        successModal.style.display = 'flex';
    } else {
        alert(message);
    }
}

function hideSuccess() {
    const successModal = document.getElementById('success-modal');
    if (successModal) {
        successModal.style.display = 'none';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount || 0);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(new Date(dateString));
    } catch (error) {
        return 'Invalid Date';
    }
}

function formatDateOnly(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        // Check if it's a date-only string (YYYY-MM-DD format)
        const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (dateOnlyRegex.test(dateString)) {
            // For date-only strings, parse components manually to avoid timezone conversion
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
            return new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }).format(date);
        } else {
            // For full datetime strings, use the regular formatDate logic
            return formatDate(dateString);
        }
    } catch (error) {
        return 'Invalid Date';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api, showError, hideError, showSuccess, hideSuccess, formatCurrency, formatDate, formatDateOnly };
}