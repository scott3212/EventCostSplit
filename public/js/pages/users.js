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
            addButton: document.getElementById('add-user-btn'),
            // Add User Modal elements
            addModal: document.getElementById('add-user-modal'),
            addForm: document.getElementById('add-user-form'),
            addClose: document.getElementById('add-user-close'),
            addCancel: document.getElementById('add-user-cancel'),
            addSave: document.getElementById('add-user-save'),
            addSpinner: document.getElementById('add-user-spinner'),
            addSaveText: document.getElementById('add-user-save-text'),
            // Form inputs
            nameInput: document.getElementById('user-name'),
            emailInput: document.getElementById('user-email'),
            phoneInput: document.getElementById('user-phone'),
            // Error elements
            nameError: document.getElementById('name-error'),
            emailError: document.getElementById('email-error'),
            phoneError: document.getElementById('phone-error')
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

        // Modal close events
        if (this.elements.addClose) {
            this.elements.addClose.addEventListener('click', () => {
                this.hideAddUserDialog();
            });
        }

        if (this.elements.addCancel) {
            this.elements.addCancel.addEventListener('click', () => {
                this.hideAddUserDialog();
            });
        }

        // Modal backdrop click
        if (this.elements.addModal) {
            this.elements.addModal.addEventListener('click', (e) => {
                if (e.target === this.elements.addModal) {
                    this.hideAddUserDialog();
                }
            });
        }

        // Form submission
        if (this.elements.addSave) {
            this.elements.addSave.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleAddUser();
            });
        }

        if (this.elements.addForm) {
            this.elements.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddUser();
            });
        }

        // Real-time validation
        if (this.elements.nameInput) {
            this.elements.nameInput.addEventListener('blur', () => {
                this.validateName();
            });
            this.elements.nameInput.addEventListener('input', () => {
                this.clearError('name');
            });
        }

        if (this.elements.emailInput) {
            this.elements.emailInput.addEventListener('blur', () => {
                this.validateEmail();
            });
            this.elements.emailInput.addEventListener('input', () => {
                this.clearError('email');
            });
        }

        if (this.elements.phoneInput) {
            this.elements.phoneInput.addEventListener('blur', () => {
                this.validatePhone();
            });
            this.elements.phoneInput.addEventListener('input', () => {
                this.clearError('phone');
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
        this.resetAddUserForm();
        if (this.elements.addModal) {
            this.elements.addModal.style.display = 'flex';
            this.elements.addModal.classList.add('fade-in');
            
            // Focus on name input
            setTimeout(() => {
                if (this.elements.nameInput) {
                    this.elements.nameInput.focus();
                }
            }, 100);
        }
    }

    hideAddUserDialog() {
        if (this.elements.addModal) {
            this.elements.addModal.style.display = 'none';
            this.elements.addModal.classList.remove('fade-in');
        }
        this.resetAddUserForm();
    }

    resetAddUserForm() {
        if (this.elements.addForm) {
            this.elements.addForm.reset();
        }
        
        this.clearAllErrors();
        this.setAddButtonState(false);
    }

    async handleAddUser() {
        if (!this.validateForm()) {
            return;
        }

        try {
            this.setAddButtonState(true);

            const userData = {
                name: this.elements.nameInput.value.trim(),
                email: this.elements.emailInput.value.trim() || null,
                phone: this.elements.phoneInput.value.trim() || null
            };

            const newUser = await api.createUser(userData);
            
            this.hideAddUserDialog();
            await this.refresh();
            
            showError(`User "${newUser.name}" added successfully!`);
            
        } catch (error) {
            console.error('Failed to add user:', error);
            
            if (error.message.includes('name is not unique')) {
                this.showError('name', 'A user with this name already exists');
            } else if (error.message.includes('email is not unique')) {
                this.showError('email', 'A user with this email already exists');
            } else {
                showError('Failed to add user. Please try again.');
            }
        } finally {
            this.setAddButtonState(false);
        }
    }

    validateForm() {
        let isValid = true;

        if (!this.validateName()) isValid = false;
        if (!this.validateEmail()) isValid = false;
        if (!this.validatePhone()) isValid = false;

        return isValid;
    }

    validateName() {
        const name = this.elements.nameInput?.value?.trim();
        
        if (!name) {
            this.showError('name', 'Name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showError('name', 'Name must be at least 2 characters long');
            return false;
        }
        
        if (name.length > 100) {
            this.showError('name', 'Name cannot be longer than 100 characters');
            return false;
        }
        
        this.clearError('name');
        return true;
    }

    validateEmail() {
        const email = this.elements.emailInput?.value?.trim();
        
        if (!email) {
            this.clearError('email');
            return true; // Email is optional
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearError('email');
        return true;
    }

    validatePhone() {
        const phone = this.elements.phoneInput?.value?.trim();
        
        if (!phone) {
            this.clearError('phone');
            return true; // Phone is optional
        }
        
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
            this.showError('phone', 'Please enter a valid phone number');
            return false;
        }
        
        if (phone.replace(/\D/g, '').length < 10) {
            this.showError('phone', 'Phone number must be at least 10 digits');
            return false;
        }
        
        this.clearError('phone');
        return true;
    }

    showError(field, message) {
        const errorElement = this.elements[`${field}Error`];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        const inputElement = this.elements[`${field}Input`];
        if (inputElement) {
            inputElement.style.borderColor = '#ef4444';
        }
    }

    clearError(field) {
        const errorElement = this.elements[`${field}Error`];
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        
        const inputElement = this.elements[`${field}Input`];
        if (inputElement) {
            inputElement.style.borderColor = '';
        }
    }

    clearAllErrors() {
        this.clearError('name');
        this.clearError('email');
        this.clearError('phone');
    }

    setAddButtonState(loading) {
        if (this.elements.addSave) {
            this.elements.addSave.disabled = loading;
        }
        
        if (this.elements.addSpinner) {
            this.elements.addSpinner.style.display = loading ? 'inline-block' : 'none';
        }
        
        if (this.elements.addSaveText) {
            this.elements.addSaveText.textContent = loading ? 'Adding...' : 'Add User';
        }
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