class Dashboard {
    constructor() {
        this.isInitialized = false;
        this.refreshInterval = null;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.elements = {
            usersCount: document.getElementById('users-count'),
            eventsCount: document.getElementById('events-count'),
            totalExpenses: document.getElementById('total-expenses'),
            balanceStatus: document.getElementById('balance-status'),
            activityList: document.getElementById('recent-activity-list'),
            apiStatus: document.getElementById('api-status')
        };
        
        this.isInitialized = true;
        this.loadDashboard();
    }

    async loadDashboard() {
        try {
            this.showLoadingState();
            
            const isApiHealthy = await api.checkHealth();
            this.updateApiStatus(isApiHealthy);
            
            if (isApiHealthy) {
                await this.loadStats();
            } else {
                this.showOfflineState();
            }
        } catch (error) {
            console.error('Dashboard load failed:', error);
            this.showErrorState();
        }
    }

    async loadStats() {
        try {
            const stats = await api.getDashboardStats();
            this.updateStats(stats);
            this.updateRecentActivity(stats.recentActivity);
        } catch (error) {
            console.error('Failed to load dashboard stats:', error);
            showError('Failed to load dashboard data');
            this.showErrorState();
        }
    }

    updateStats(stats) {
        if (this.elements.usersCount) {
            this.elements.usersCount.textContent = stats.usersCount || 0;
        }
        
        if (this.elements.eventsCount) {
            this.elements.eventsCount.textContent = stats.eventsCount || 0;
        }
        
        if (this.elements.totalExpenses) {
            this.elements.totalExpenses.textContent = formatCurrency(stats.totalExpenses);
        }
        
        if (this.elements.balanceStatus) {
            const settledUsers = this.calculateSettledUsers(stats);
            this.elements.balanceStatus.textContent = `${settledUsers}/${stats.usersCount || 0}`;
        }
    }

    calculateSettledUsers(stats) {
        const { totalExpenses = 0, totalPayments = 0, usersCount = 0 } = stats;
        
        if (usersCount === 0) return 0;
        
        const averageExpensePerUser = totalExpenses / usersCount;
        const averagePaymentPerUser = totalPayments / usersCount;
        
        return Math.abs(averageExpensePerUser - averagePaymentPerUser) < 0.01 ? usersCount : 0;
    }

    updateRecentActivity(activities = []) {
        if (!this.elements.activityList) return;
        
        if (activities.length === 0) {
            this.elements.activityList.innerHTML = `
                <div class="loading-placeholder">No recent activity found</div>
            `;
            return;
        }

        const activityHtml = activities.map(activity => `
            <div class="activity-item card" style="margin-bottom: 0.75rem;">
                <div class="card-body" style="padding: 1rem;">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center gap-3">
                            <span class="activity-icon">${activity.type === 'expense' ? '💰' : '💳'}</span>
                            <div>
                                <p class="font-semibold text-sm">${activity.description}</p>
                                <p class="text-gray text-sm">${formatDate(activity.date)}</p>
                            </div>
                        </div>
                        <div class="activity-amount ${activity.type === 'expense' ? 'text-danger' : 'text-success'}">
                            ${activity.type === 'expense' ? '-' : '+'}${formatCurrency(activity.amount)}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        this.elements.activityList.innerHTML = activityHtml;
    }

    updateApiStatus(isHealthy) {
        if (!this.elements.apiStatus) return;
        
        if (isHealthy) {
            this.elements.apiStatus.style.display = 'flex';
            this.elements.apiStatus.className = 'api-status';
            this.elements.apiStatus.innerHTML = `
                <div class="status-indicator"></div>
                <span class="status-text">API Connected</span>
            `;
        } else {
            this.elements.apiStatus.style.display = 'flex';
            this.elements.apiStatus.className = 'api-status';
            this.elements.apiStatus.style.background = '#fef2f2';
            this.elements.apiStatus.style.borderColor = '#ef4444';
            this.elements.apiStatus.style.color = '#dc2626';
            this.elements.apiStatus.innerHTML = `
                <div class="status-indicator" style="background: #ef4444; animation: none;"></div>
                <span class="status-text">API Disconnected - Working Offline</span>
            `;
        }
    }

    showLoadingState() {
        const loadingText = 'Loading...';
        
        if (this.elements.usersCount) this.elements.usersCount.textContent = loadingText;
        if (this.elements.eventsCount) this.elements.eventsCount.textContent = loadingText;
        if (this.elements.totalExpenses) this.elements.totalExpenses.textContent = loadingText;
        if (this.elements.balanceStatus) this.elements.balanceStatus.textContent = loadingText;
        
        if (this.elements.activityList) {
            this.elements.activityList.innerHTML = `
                <div class="loading-placeholder">Loading recent activity...</div>
            `;
        }
    }

    showOfflineState() {
        const offlineText = 'Offline';
        
        if (this.elements.usersCount) this.elements.usersCount.textContent = '0';
        if (this.elements.eventsCount) this.elements.eventsCount.textContent = '0';
        if (this.elements.totalExpenses) this.elements.totalExpenses.textContent = formatCurrency(0);
        if (this.elements.balanceStatus) this.elements.balanceStatus.textContent = '0/0';
        
        if (this.elements.activityList) {
            this.elements.activityList.innerHTML = `
                <div class="loading-placeholder">Unable to load activity - API offline</div>
            `;
        }
    }

    showErrorState() {
        const errorText = 'Error';
        
        if (this.elements.usersCount) this.elements.usersCount.textContent = errorText;
        if (this.elements.eventsCount) this.elements.eventsCount.textContent = errorText;
        if (this.elements.totalExpenses) this.elements.totalExpenses.textContent = errorText;
        if (this.elements.balanceStatus) this.elements.balanceStatus.textContent = errorText;
        
        if (this.elements.activityList) {
            this.elements.activityList.innerHTML = `
                <div class="loading-placeholder text-danger">Failed to load recent activity</div>
            `;
        }
    }

    refresh() {
        this.loadDashboard();
    }

    startAutoRefresh(intervalMs = 30000) {
        this.stopAutoRefresh();
        this.refreshInterval = setInterval(() => {
            if (navigation && navigation.getCurrentPage() === 'dashboard') {
                this.loadDashboard();
            }
        }, intervalMs);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new Dashboard();
    
    window.addEventListener('beforeunload', () => {
        if (window.dashboard) {
            window.dashboard.stopAutoRefresh();
        }
    });
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Dashboard;
}