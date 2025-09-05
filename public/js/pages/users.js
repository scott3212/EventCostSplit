class UsersPage {
    constructor() {
        this.users = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        if (this.isInitialized) return;
        
        this.elements = {
            loading: document.getElementById('users-loading'),
            list: document.getElementById('users-list'),
            empty: document.getElementById('users-empty'),
            totalCount: document.getElementById('total-users-count'),
            addButton: document.getElementById('add-user-btn')
        };
        
        this.bindEvents();
        this.isInitialized = true;
    }

    bindEvents() {
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => {
                this.showAddUserDialog();
            });
        }
    }

    async loadUsers() {
        try {
            this.showLoading();
            
            const users = await api.getUsers();
            this.users = users;
            
            if (users.length === 0) {
                this.showEmptyState();
            } else {
                this.renderUsers(users);
            }
            
            this.updateStats();
        } catch (error) {
            console.error('Failed to load users:', error);
            showError('Failed to load users. Please try again.');
            this.showEmptyState();
        }
    }

    renderUsers(users) {
        if (!this.elements.list) return;
        
        const usersHtml = users.map(user => this.createUserCard(user)).join('');
        this.elements.list.innerHTML = usersHtml;
        
        this.bindUserActions();
        this.showUsersList();
    }

    createUserCard(user) {
        const balance = user.totalBalance || 0;
        const balanceStatus = this.getBalanceStatus(balance);
        
        return `
            <div class="user-card fade-in" data-user-id="${user.id}">
                <div class="user-card-header">
                    <div class="user-info">
                        <h3>${user.name}</h3>
                        ${user.email ? `<div class="user-email">📧 ${user.email}</div>` : ''}
                        ${user.phone ? `<div class="user-phone">📱 ${user.phone}</div>` : ''}
                    </div>
                    <div class="user-actions">
                        <button class="btn btn-sm btn-outline" onclick="usersPage.editUser('${user.id}')" title="Edit user">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="usersPage.deleteUser('${user.id}')" title="Delete user">
                            🗑️
                        </button>
                    </div>
                </div>
                
                <div class="user-balance">
                    <div class="balance-info">
                        <span class="balance-label">Current Balance</span>
                        <span class="balance-amount ${balanceStatus.class}">${formatCurrency(balance)}</span>
                    </div>
                    <div class="balance-status ${balanceStatus.class}">
                        <div class="status-icon ${balanceStatus.iconClass}"></div>
                        <span>${balanceStatus.text}</span>
                    </div>
                </div>
            </div>
        `;
    }

    getBalanceStatus(balance) {
        if (Math.abs(balance) < 0.01) {
            return {
                class: 'balance-settled',
                iconClass: 'status-settled',
                text: 'All settled'
            };
        } else if (balance < 0) {
            return {
                class: 'balance-owes',
                iconClass: 'status-owes',
                text: 'Owes money'
            };
        } else {
            return {
                class: 'balance-owed',
                iconClass: 'status-owed',
                text: 'Owed money'
            };
        }
    }

    bindUserActions() {
        const userCards = document.querySelectorAll('.user-card');
        userCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button')) {
                    const userId = card.dataset.userId;
                    this.viewUserDetails(userId);
                }
            });
        });
    }

    showLoading() {
        if (this.elements.loading) this.elements.loading.style.display = 'block';
        if (this.elements.list) this.elements.list.style.display = 'none';
        if (this.elements.empty) this.elements.empty.style.display = 'none';
    }

    showUsersList() {
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
            this.elements.totalCount.textContent = this.users.length;
        }
    }

    async refresh() {
        await this.loadUsers();
    }

    showAddUserDialog() {
        console.log('Add user dialog - TODO: implement in next step');
        showError('Add user functionality coming in the next step!');
    }

    editUser(userId) {
        console.log('Edit user:', userId);
        showError('Edit user functionality coming soon!');
    }

    deleteUser(userId) {
        console.log('Delete user:', userId);
        showError('Delete user functionality coming soon!');
    }

    viewUserDetails(userId) {
        console.log('View user details:', userId);
        showError('User details view coming soon!');
    }

    findUserById(userId) {
        return this.users.find(user => user.id === userId);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.usersPage = new UsersPage();
    
    const originalNavigateToPage = navigation.navigateToPage;
    navigation.navigateToPage = function(pageId) {
        originalNavigateToPage.call(this, pageId);
        
        if (pageId === 'users' && window.usersPage) {
            window.usersPage.refresh();
        }
    };
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = UsersPage;
}