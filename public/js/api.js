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
                throw new Error(error.message || `HTTP ${response.status}`);
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

    // Event endpoints
    async getEvents() {
        return this.get('/events');
    }

    async getEvent(id) {
        return this.get(`/events/${id}`);
    }

    async createEvent(eventData) {
        return this.post('/events', eventData);
    }

    async updateEvent(id, eventData) {
        return this.put(`/events/${id}`, eventData);
    }

    async deleteEvent(id) {
        return this.delete(`/events/${id}`);
    }

    // Cost Item endpoints
    async getCostItems() {
        return this.get('/cost-items');
    }

    async getCostItem(id) {
        return this.get(`/cost-items/${id}`);
    }

    async createCostItem(costItemData) {
        return this.post('/cost-items', costItemData);
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
        return this.post('/payments', paymentData);
    }

    async updatePayment(id, paymentData) {
        return this.put(`/payments/${id}`, paymentData);
    }

    async deletePayment(id) {
        return this.delete(`/payments/${id}`);
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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ApiClient, api, showError, hideError, formatCurrency, formatDate };
}