class UsersPage {
    constructor() {
        this.users = [];
        this.isInitialized = false;
        this.currentEditUser = null;
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
            phoneError: document.getElementById('phone-error'),
            // Edit User Modal elements
            editModal: document.getElementById('edit-user-modal'),
            editForm: document.getElementById('edit-user-form'),
            editClose: document.getElementById('edit-user-close'),
            editCancel: document.getElementById('edit-user-cancel'),
            editSave: document.getElementById('edit-user-save'),
            editSpinner: document.getElementById('edit-user-spinner'),
            editSaveText: document.getElementById('edit-user-save-text'),
            // Edit form inputs
            editNameInput: document.getElementById('edit-user-name'),
            editEmailInput: document.getElementById('edit-user-email'),
            editPhoneInput: document.getElementById('edit-user-phone'),
            editBalanceAmount: document.getElementById('edit-balance-amount'),
            editBalanceStatus: document.getElementById('edit-balance-status'),
            // Edit error elements
            editNameError: document.getElementById('edit-name-error'),
            editEmailError: document.getElementById('edit-email-error'),
            editPhoneError: document.getElementById('edit-phone-error')
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

        // Edit User Modal events
        if (this.elements.editClose) {
            this.elements.editClose.addEventListener('click', () => {
                this.hideEditUserDialog();
            });
        }

        if (this.elements.editCancel) {
            this.elements.editCancel.addEventListener('click', () => {
                this.hideEditUserDialog();
            });
        }

        // Edit modal backdrop click
        if (this.elements.editModal) {
            this.elements.editModal.addEventListener('click', (e) => {
                if (e.target === this.elements.editModal) {
                    this.hideEditUserDialog();
                }
            });
        }

        // Edit form submission
        if (this.elements.editSave) {
            this.elements.editSave.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleEditUser();
            });
        }

        if (this.elements.editForm) {
            this.elements.editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEditUser();
            });
        }

        // Edit form real-time validation
        if (this.elements.editNameInput) {
            this.elements.editNameInput.addEventListener('blur', () => {
                this.validateEditName();
            });
            this.elements.editNameInput.addEventListener('input', () => {
                this.clearEditError('name');
            });
        }

        if (this.elements.editEmailInput) {
            this.elements.editEmailInput.addEventListener('blur', () => {
                this.validateEditEmail();
            });
            this.elements.editEmailInput.addEventListener('input', () => {
                this.clearEditError('email');
            });
        }

        if (this.elements.editPhoneInput) {
            this.elements.editPhoneInput.addEventListener('blur', () => {
                this.validateEditPhone();
            });
            this.elements.editPhoneInput.addEventListener('input', () => {
                this.clearEditError('phone');
            });
        }
    }

    async loadUsers() {
        try {
            this.showLoading();
            
            const response = await api.getUsers();
            // The API returns { success: true, data: [...], count: N }
            const users = response.data || response || [];
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
                        <button class="btn btn-sm btn-outline edit-user-btn" data-user-id="${user.id}" title="Edit user">
                            ✏️
                        </button>
                        <button class="btn btn-sm btn-danger delete-user-btn" data-user-id="${user.id}" title="Delete user">
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
        // Bind edit buttons
        const editButtons = document.querySelectorAll('.edit-user-btn');
        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const userId = button.dataset.userId;
                this.editUser(userId);
            });
        });

        // Bind delete buttons
        const deleteButtons = document.querySelectorAll('.delete-user-btn');
        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const userId = button.dataset.userId;
                this.deleteUser(userId);
            });
        });

        // Bind card click for user details (excluding button areas)
        const userCards = document.querySelectorAll('.user-card');
        userCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('button') && !e.target.closest('.user-actions')) {
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
            
            showSuccess(`User "${newUser.name}" added successfully!`);
            
        } catch (error) {
            console.error('Failed to add user:', error);
            
            if (error.message.includes('name already exists') || error.message.includes('name is not unique')) {
                this.showError('name', 'A user with this name already exists');
            } else if (error.message.includes('email already exists') || error.message.includes('email is not unique')) {
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
        const user = this.findUserById(userId);
        if (!user) {
            showError('User not found');
            return;
        }
        
        this.currentEditUser = user;
        this.showEditUserDialog(user);
    }

    showEditUserDialog(user) {
        this.resetEditUserForm();
        this.populateEditForm(user);
        
        if (this.elements.editModal) {
            this.elements.editModal.style.display = 'flex';
            this.elements.editModal.classList.add('fade-in');
            
            // Focus on name input
            setTimeout(() => {
                if (this.elements.editNameInput) {
                    this.elements.editNameInput.focus();
                    this.elements.editNameInput.select();
                }
            }, 100);
        }
    }

    hideEditUserDialog() {
        if (this.elements.editModal) {
            this.elements.editModal.style.display = 'none';
            this.elements.editModal.classList.remove('fade-in');
        }
        this.resetEditUserForm();
        this.currentEditUser = null;
    }

    resetEditUserForm() {
        if (this.elements.editForm) {
            this.elements.editForm.reset();
        }
        
        this.clearAllEditErrors();
        this.setEditButtonState(false);
    }

    populateEditForm(user) {
        if (this.elements.editNameInput) {
            this.elements.editNameInput.value = user.name || '';
        }
        
        if (this.elements.editEmailInput) {
            this.elements.editEmailInput.value = user.email || '';
        }
        
        if (this.elements.editPhoneInput) {
            this.elements.editPhoneInput.value = user.phone || '';
        }
        
        this.updateEditBalanceDisplay(user);
    }

    updateEditBalanceDisplay(user) {
        const balance = user.totalBalance || 0;
        const balanceStatus = this.getBalanceStatus(balance);
        
        if (this.elements.editBalanceAmount) {
            this.elements.editBalanceAmount.textContent = formatCurrency(balance);
            this.elements.editBalanceAmount.className = `balance-amount ${balanceStatus.class}`;
        }
        
        if (this.elements.editBalanceStatus) {
            const statusIcon = this.elements.editBalanceStatus.querySelector('.status-icon');
            const statusText = this.elements.editBalanceStatus.querySelector('span');
            
            if (statusIcon) {
                statusIcon.className = `status-icon ${balanceStatus.iconClass}`;
            }
            
            if (statusText) {
                statusText.textContent = balanceStatus.text;
            }
            
            this.elements.editBalanceStatus.className = `balance-status ${balanceStatus.class}`;
        }
    }

    async handleEditUser() {
        if (!this.currentEditUser) {
            showError('No user selected for editing');
            return;
        }

        if (!this.validateEditForm()) {
            return;
        }

        try {
            this.setEditButtonState(true);

            const userData = {
                name: this.elements.editNameInput.value.trim(),
                email: this.elements.editEmailInput.value.trim() || null,
                phone: this.elements.editPhoneInput.value.trim() || null
            };

            const updatedUser = await api.updateUser(this.currentEditUser.id, userData);
            
            this.hideEditUserDialog();
            await this.refresh();
            
            showSuccess(`User "${updatedUser.name}" updated successfully!`);
            
        } catch (error) {
            console.error('Failed to update user:', error);
            
            if (error.message.includes('name already exists') || error.message.includes('name is not unique')) {
                this.showEditError('name', 'A user with this name already exists');
            } else if (error.message.includes('email already exists') || error.message.includes('email is not unique')) {
                this.showEditError('email', 'A user with this email already exists');
            } else {
                showError('Failed to update user. Please try again.');
            }
        } finally {
            this.setEditButtonState(false);
        }
    }

    validateEditForm() {
        let isValid = true;

        if (!this.validateEditName()) isValid = false;
        if (!this.validateEditEmail()) isValid = false;
        if (!this.validateEditPhone()) isValid = false;

        return isValid;
    }

    validateEditName() {
        const name = this.elements.editNameInput?.value?.trim();
        
        if (!name) {
            this.showEditError('name', 'Name is required');
            return false;
        }
        
        if (name.length < 2) {
            this.showEditError('name', 'Name must be at least 2 characters long');
            return false;
        }
        
        if (name.length > 100) {
            this.showEditError('name', 'Name cannot be longer than 100 characters');
            return false;
        }
        
        this.clearEditError('name');
        return true;
    }

    validateEditEmail() {
        const email = this.elements.editEmailInput?.value?.trim();
        
        if (!email) {
            this.clearEditError('email');
            return true; // Email is optional
        }
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.showEditError('email', 'Please enter a valid email address');
            return false;
        }
        
        this.clearEditError('email');
        return true;
    }

    validateEditPhone() {
        const phone = this.elements.editPhoneInput?.value?.trim();
        
        if (!phone) {
            this.clearEditError('phone');
            return true; // Phone is optional
        }
        
        const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
        if (!phoneRegex.test(phone)) {
            this.showEditError('phone', 'Please enter a valid phone number');
            return false;
        }
        
        if (phone.replace(/\D/g, '').length < 10) {
            this.showEditError('phone', 'Phone number must be at least 10 digits');
            return false;
        }
        
        this.clearEditError('phone');
        return true;
    }

    showEditError(field, message) {
        const errorElement = this.elements[`edit${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        
        const inputElement = this.elements[`edit${field.charAt(0).toUpperCase() + field.slice(1)}Input`];
        if (inputElement) {
            inputElement.style.borderColor = '#ef4444';
        }
    }

    clearEditError(field) {
        const errorElement = this.elements[`edit${field.charAt(0).toUpperCase() + field.slice(1)}Error`];
        if (errorElement) {
            errorElement.style.display = 'none';
            errorElement.textContent = '';
        }
        
        const inputElement = this.elements[`edit${field.charAt(0).toUpperCase() + field.slice(1)}Input`];
        if (inputElement) {
            inputElement.style.borderColor = '';
        }
    }

    clearAllEditErrors() {
        this.clearEditError('name');
        this.clearEditError('email');
        this.clearEditError('phone');
    }

    setEditButtonState(loading) {
        if (this.elements.editSave) {
            this.elements.editSave.disabled = loading;
        }
        
        if (this.elements.editSpinner) {
            this.elements.editSpinner.style.display = loading ? 'inline-block' : 'none';
        }
        
        if (this.elements.editSaveText) {
            this.elements.editSaveText.textContent = loading ? 'Saving...' : 'Save Changes';
        }
    }

    async deleteUser(userId) {
        try {
            if (!userId) {
                showError('Invalid user ID');
                return;
            }

            const user = this.users.find(u => u.id === userId);
            if (!user) {
                showError('User not found');
                return;
            }

            const confirmed = confirm(`Are you sure you want to delete "${user.name}"?\n\nThis action cannot be undone and will remove the user from all events and calculations.`);
            
            if (!confirmed) {
                return;
            }

            const secondConfirmation = confirm(`⚠️ FINAL CONFIRMATION ⚠️\n\nDeleting "${user.name}" will:\n• Remove them from all events\n• Delete their payment history\n• Affect expense calculations\n\nAre you absolutely sure?`);
            
            if (!secondConfirmation) {
                return;
            }

            await api.deleteUser(userId);
            
            await this.loadUsers();
            
            showSuccess(`User "${user.name}" has been deleted successfully.`);
            
        } catch (error) {
            console.error('Failed to delete user:', error);
            showError(`Failed to delete user: ${error.message}`);
        }
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