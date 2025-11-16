class TemplateManagementPage {
    constructor() {
        this.templates = [];
        this.users = []; // For default payer dropdown
        this.isInitialized = false;
        this.currentEditTemplate = null;
        this.init();
    }

    init() {
        if (this.isInitialized) return;

        this.elements = {
            loading: document.getElementById('templates-loading'),
            list: document.getElementById('templates-list'),
            empty: document.getElementById('templates-empty'),
            totalCount: document.getElementById('total-templates-count'),
            addButton: document.getElementById('add-template-btn'),
            emptyStateAddButton: document.getElementById('empty-state-add-template-btn'),
            container: document.querySelector('.templates-container'),
            // Add Template Modal elements
            addModal: document.getElementById('add-template-modal'),
            addForm: document.getElementById('add-template-form'),
            addClose: document.getElementById('add-template-close'),
            addCancel: document.getElementById('add-template-cancel'),
            addSave: document.getElementById('add-template-save'),
            addSpinner: document.getElementById('add-template-spinner'),
            addSaveText: document.getElementById('add-template-save-text'),
            // Form inputs
            nameInput: document.getElementById('template-name'),
            amountInput: document.getElementById('template-amount'),
            defaultPayerInput: document.getElementById('template-default-payer'),
            // Error elements
            nameError: document.getElementById('template-name-error'),
            amountError: document.getElementById('template-amount-error'),
            // Edit Template Modal elements
            editModal: document.getElementById('edit-template-modal'),
            editForm: document.getElementById('edit-template-form'),
            editClose: document.getElementById('edit-template-close'),
            editCancel: document.getElementById('edit-template-cancel'),
            editSave: document.getElementById('edit-template-save'),
            editDelete: document.getElementById('edit-template-delete'),
            editSpinner: document.getElementById('edit-template-spinner'),
            editSaveText: document.getElementById('edit-template-save-text'),
            // Edit form inputs
            editNameInput: document.getElementById('edit-template-name'),
            editAmountInput: document.getElementById('edit-template-amount'),
            editDefaultPayerInput: document.getElementById('edit-template-default-payer'),
            // Edit error elements
            editNameError: document.getElementById('edit-template-name-error'),
            editAmountError: document.getElementById('edit-template-amount-error'),
        };

        this.bindEvents();
        this.isInitialized = true;
    }

    bindEvents() {
        if (this.elements.addButton) {
            this.elements.addButton.addEventListener('click', () => {
                this.showAddTemplateDialog();
            });
        }

        if (this.elements.emptyStateAddButton) {
            this.elements.emptyStateAddButton.addEventListener('click', () => {
                this.showAddTemplateDialog();
            });
        }

        // Add modal events
        if (this.elements.addClose) {
            this.elements.addClose.addEventListener('click', () => this.hideAddTemplateDialog());
        }
        if (this.elements.addCancel) {
            this.elements.addCancel.addEventListener('click', () => this.hideAddTemplateDialog());
        }
        if (this.elements.addSave) {
            this.elements.addSave.addEventListener('click', () => this.handleAddTemplate());
        }
        if (this.elements.addForm) {
            this.elements.addForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddTemplate();
            });
        }

        // Edit modal events
        if (this.elements.editClose) {
            this.elements.editClose.addEventListener('click', () => this.hideEditTemplateDialog());
        }
        if (this.elements.editCancel) {
            this.elements.editCancel.addEventListener('click', () => this.hideEditTemplateDialog());
        }
        if (this.elements.editSave) {
            this.elements.editSave.addEventListener('click', () => this.handleUpdateTemplate());
        }
        if (this.elements.editDelete) {
            this.elements.editDelete.addEventListener('click', () => this.handleDeleteTemplate());
        }
        if (this.elements.editForm) {
            this.elements.editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUpdateTemplate();
            });
        }
    }

    async loadPage() {
        try {
            await this.loadTemplates();
            await this.loadUsers();
        } catch (error) {
            console.error('Failed to load templates page:', error);
            showError('Failed to load templates. Please refresh the page.');
        }
    }

    async loadTemplates() {
        try {
            this.showLoading();
            const response = await api.getExpenseTemplates();
            this.templates = response || [];
            this.renderTemplates();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load templates:', error);
            showError('Failed to load templates');
            this.showEmpty();
        }
    }

    async loadUsers() {
        try {
            const response = await api.getUsers();
            this.users = response || [];
            this.populateDefaultPayerDropdowns();
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    populateDefaultPayerDropdowns() {
        const dropdowns = [this.elements.defaultPayerInput, this.elements.editDefaultPayerInput];

        dropdowns.forEach(dropdown => {
            if (!dropdown) return;

            // Clear existing options (except first "None" option)
            dropdown.innerHTML = '<option value="">None (must select when using)</option>';

            // Add user options
            this.users.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                dropdown.appendChild(option);
            });
        });
    }

    renderTemplates() {
        if (this.templates.length === 0) {
            this.showEmpty();
            return;
        }

        this.showList();
        this.elements.list.innerHTML = this.templates.map(template =>
            this.createTemplateCard(template)
        ).join('');

        // Attach event listeners to template cards
        this.attachTemplateCardEvents();
    }

    createTemplateCard(template) {
        const defaultPayerName = template.defaultPaidBy
            ? (this.users.find(u => u.id === template.defaultPaidBy)?.name || 'Unknown User')
            : 'Not set';

        return `
            <div class="template-card" data-template-id="${template.id}">
                <div class="template-card-header">
                    <h3 class="template-name">${this.escapeHtml(template.name)}</h3>
                    <button class="btn btn-sm btn-outline edit-template-btn" data-template-id="${template.id}">
                        ✏️ Edit
                    </button>
                </div>
                <div class="template-card-body">
                    <div class="template-info">
                        <div class="template-info-item">
                            <span class="label">Default Amount:</span>
                            <span class="value amount">${formatCurrency(template.defaultAmount)}</span>
                        </div>
                        <div class="template-info-item">
                            <span class="label">Default Payer:</span>
                            <span class="value">${this.escapeHtml(defaultPayerName)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachTemplateCardEvents() {
        const editButtons = this.elements.list.querySelectorAll('.edit-template-btn');
        editButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const templateId = btn.dataset.templateId;
                this.showEditTemplateDialog(templateId);
            });
        });
    }

    showLoading() {
        if (this.elements.loading) this.elements.loading.classList.remove('hidden');
        if (this.elements.list) this.elements.list.classList.add('hidden');
        if (this.elements.empty) this.elements.empty.classList.add('hidden');
    }

    showList() {
        if (this.elements.loading) this.elements.loading.classList.add('hidden');
        if (this.elements.list) this.elements.list.classList.remove('hidden');
        if (this.elements.empty) this.elements.empty.classList.add('hidden');
    }

    showEmpty() {
        if (this.elements.loading) this.elements.loading.classList.add('hidden');
        if (this.elements.list) this.elements.list.classList.add('hidden');
        if (this.elements.empty) this.elements.empty.classList.remove('hidden');
    }

    updateStats() {
        if (this.elements.totalCount) {
            this.elements.totalCount.textContent = this.templates.length;
        }
    }

    // Add Template Dialog Methods
    async showAddTemplateDialog() {
        this.resetAddForm();
        await this.loadUsers(); // Ensure users are loaded
        if (this.elements.addModal) {
            this.elements.addModal.style.display = 'flex';
            this.elements.addModal.classList.add('fade-in');
        }
        // Focus on name input
        setTimeout(() => {
            if (this.elements.nameInput) {
                this.elements.nameInput.focus();
            }
        }, 100);
    }

    hideAddTemplateDialog() {
        if (this.elements.addModal) {
            this.elements.addModal.style.display = 'none';
            this.elements.addModal.classList.remove('fade-in');
        }
        this.resetAddForm();
    }

    resetAddForm() {
        if (this.elements.addForm) {
            this.elements.addForm.reset();
        }
        this.clearAddErrors();
    }

    clearAddErrors() {
        if (this.elements.nameError) this.elements.nameError.textContent = '';
        if (this.elements.amountError) this.elements.amountError.textContent = '';
    }

    validateAddForm() {
        this.clearAddErrors();
        let isValid = true;

        const name = this.elements.nameInput?.value.trim();
        const amount = parseFloat(this.elements.amountInput?.value);

        if (!name) {
            if (this.elements.nameError) {
                this.elements.nameError.textContent = 'Template name is required';
            }
            isValid = false;
        } else if (name.length < 2) {
            if (this.elements.nameError) {
                this.elements.nameError.textContent = 'Template name must be at least 2 characters';
            }
            isValid = false;
        } else if (name.length > 100) {
            if (this.elements.nameError) {
                this.elements.nameError.textContent = 'Template name must be less than 100 characters';
            }
            isValid = false;
        }

        if (!amount || isNaN(amount)) {
            if (this.elements.amountError) {
                this.elements.amountError.textContent = 'Amount is required';
            }
            isValid = false;
        } else if (amount <= 0) {
            if (this.elements.amountError) {
                this.elements.amountError.textContent = 'Amount must be greater than 0';
            }
            isValid = false;
        }

        return isValid;
    }

    async handleAddTemplate() {
        if (!this.validateAddForm()) {
            return;
        }

        // Prevent double submission
        if (this.isCreatingTemplate) {
            console.warn('Template creation already in progress, ignoring duplicate request');
            return;
        }

        const templateData = {
            name: this.elements.nameInput.value.trim(),
            defaultAmount: parseFloat(this.elements.amountInput.value),
            defaultPaidBy: this.elements.defaultPayerInput.value || null,
        };

        try {
            this.isCreatingTemplate = true;
            this.setAddLoading(true);
            await api.createExpenseTemplate(templateData);
            showSuccess(`Template "${templateData.name}" created successfully!`);
            this.hideAddTemplateDialog();
            await this.loadTemplates();
        } catch (error) {
            console.error('Failed to create template:', error);
            showError(error.message || 'Failed to create template');
        } finally {
            this.isCreatingTemplate = false;
            this.setAddLoading(false);
        }
    }

    setAddLoading(loading) {
        if (this.elements.addSave) {
            this.elements.addSave.disabled = loading;
        }
        if (this.elements.addSpinner) {
            this.elements.addSpinner.classList.toggle('hidden', !loading);
        }
        if (this.elements.addSaveText) {
            this.elements.addSaveText.textContent = loading ? 'Creating...' : 'Create Template';
        }
    }

    // Edit Template Dialog Methods
    async showEditTemplateDialog(templateId) {
        const template = this.templates.find(t => t.id === templateId);
        if (!template) {
            showError('Template not found');
            return;
        }

        this.currentEditTemplate = template;
        await this.loadUsers(); // Ensure users are loaded

        // Populate form
        if (this.elements.editNameInput) {
            this.elements.editNameInput.value = template.name;
        }
        if (this.elements.editAmountInput) {
            this.elements.editAmountInput.value = template.defaultAmount;
        }
        if (this.elements.editDefaultPayerInput) {
            this.elements.editDefaultPayerInput.value = template.defaultPaidBy || '';
        }

        this.clearEditErrors();

        if (this.elements.editModal) {
            this.elements.editModal.style.display = 'flex';
            this.elements.editModal.classList.add('fade-in');
        }

        // Focus on name input
        setTimeout(() => {
            if (this.elements.editNameInput) {
                this.elements.editNameInput.focus();
            }
        }, 100);
    }

    hideEditTemplateDialog() {
        if (this.elements.editModal) {
            this.elements.editModal.style.display = 'none';
            this.elements.editModal.classList.remove('fade-in');
        }
        this.currentEditTemplate = null;
        this.clearEditErrors();
    }

    clearEditErrors() {
        if (this.elements.editNameError) this.elements.editNameError.textContent = '';
        if (this.elements.editAmountError) this.elements.editAmountError.textContent = '';
    }

    validateEditForm() {
        this.clearEditErrors();
        let isValid = true;

        const name = this.elements.editNameInput?.value.trim();
        const amount = parseFloat(this.elements.editAmountInput?.value);

        if (!name) {
            if (this.elements.editNameError) {
                this.elements.editNameError.textContent = 'Template name is required';
            }
            isValid = false;
        } else if (name.length < 2) {
            if (this.elements.editNameError) {
                this.elements.editNameError.textContent = 'Template name must be at least 2 characters';
            }
            isValid = false;
        } else if (name.length > 100) {
            if (this.elements.editNameError) {
                this.elements.editNameError.textContent = 'Template name must be less than 100 characters';
            }
            isValid = false;
        }

        if (!amount || isNaN(amount)) {
            if (this.elements.editAmountError) {
                this.elements.editAmountError.textContent = 'Amount is required';
            }
            isValid = false;
        } else if (amount <= 0) {
            if (this.elements.editAmountError) {
                this.elements.editAmountError.textContent = 'Amount must be greater than 0';
            }
            isValid = false;
        }

        return isValid;
    }

    async handleUpdateTemplate() {
        if (!this.currentEditTemplate) return;
        if (!this.validateEditForm()) return;

        // Prevent double submission
        if (this.isUpdatingTemplate) {
            console.warn('Template update already in progress, ignoring duplicate request');
            return;
        }

        const templateData = {
            name: this.elements.editNameInput.value.trim(),
            defaultAmount: parseFloat(this.elements.editAmountInput.value),
            defaultPaidBy: this.elements.editDefaultPayerInput.value || null,
        };

        try {
            this.isUpdatingTemplate = true;
            this.setEditLoading(true);
            await api.updateExpenseTemplate(this.currentEditTemplate.id, templateData);
            showSuccess(`Template "${templateData.name}" updated successfully!`);
            this.hideEditTemplateDialog();
            await this.loadTemplates();
        } catch (error) {
            console.error('Failed to update template:', error);
            showError(error.message || 'Failed to update template');
        } finally {
            this.isUpdatingTemplate = false;
            this.setEditLoading(false);
        }
    }

    async handleDeleteTemplate() {
        if (!this.currentEditTemplate) return;

        // Prevent double submission
        if (this.isDeletingTemplate) {
            console.warn('Template deletion already in progress, ignoring duplicate request');
            return;
        }

        const confirmed = confirm(`Are you sure you want to delete the template "${this.currentEditTemplate.name}"?\n\nThis action cannot be undone.`);
        if (!confirmed) return;

        try {
            this.isDeletingTemplate = true;
            this.setEditLoading(true);
            await api.deleteExpenseTemplate(this.currentEditTemplate.id);
            showSuccess(`Template "${this.currentEditTemplate.name}" deleted successfully!`);
            this.hideEditTemplateDialog();
            await this.loadTemplates();
        } catch (error) {
            console.error('Failed to delete template:', error);
            showError(error.message || 'Failed to delete template');
        } finally {
            this.isDeletingTemplate = false;
            this.setEditLoading(false);
        }
    }

    setEditLoading(loading) {
        if (this.elements.editSave) {
            this.elements.editSave.disabled = loading;
        }
        if (this.elements.editDelete) {
            this.elements.editDelete.disabled = loading;
        }
        if (this.elements.editSpinner) {
            this.elements.editSpinner.classList.toggle('hidden', !loading);
        }
        if (this.elements.editSaveText) {
            this.elements.editSaveText.textContent = loading ? 'Saving...' : 'Save Changes';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    refresh() {
        return this.loadTemplates();
    }
}

// Create global instance
const templateManagementPage = new TemplateManagementPage();
