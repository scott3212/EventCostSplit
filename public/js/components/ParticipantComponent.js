/**
 * Shared ParticipantComponent for consistent participant rendering across the application
 * Consolidates duplicate logic from EventsPage and EventDetailPage
 */
class ParticipantComponent {

    /**
     * Create a participant HTML element with configurable options
     * @param {Object} participant - The participant/user object
     * @param {Object} options - Configuration options
     * @returns {string} HTML string for the participant component
     */
    static create(participant, options = {}) {
        const {
            selectable = false,       // Show checkbox for selection
            selected = false,         // Initial selection state
            showBalance = true,       // Display balance information
            showActions = false,      // Show action buttons (for future use)
            showContact = true,       // Show email/phone contact info
            variant = 'item',         // 'item' (selectable) or 'card' (display-only)
            balanceFormat = 'signed', // 'signed' (±$10) or 'absolute' ($10 + status text)
            className = '',           // Additional CSS classes
            userId = null             // For data attributes
        } = options;

        // Determine the base CSS class based on variant
        const baseClass = variant === 'card' ? 'participant-card' : 'participant-item';
        const fullClassName = `${baseClass} ${selected ? 'selected' : ''} ${className}`.trim();

        // Get balance information
        const balance = participant.totalBalance || participant.balance || 0;
        const balanceStatus = this.getBalanceStatus(balance);

        // Build contact information
        const contactInfo = this.buildContactInfo(participant, showContact);

        // Build balance display
        const balanceDisplay = showBalance ? this.buildBalanceDisplay(balance, balanceStatus, balanceFormat) : '';

        // Build the HTML
        return `
            <div class="${fullClassName}" ${userId ? `data-user-id="${userId}"` : ''}>
                ${selectable ? `<input type="checkbox" class="participant-checkbox" ${selected ? 'checked' : ''}>` : ''}
                <div class="participant-info">
                    <div class="participant-name">${participant.name}</div>
                    ${contactInfo}
                </div>
                ${balanceDisplay}
                ${showActions ? this.buildActionButtons(participant) : ''}
            </div>
        `;
    }

    /**
     * Create participant item for selection (EventsPage style)
     */
    static createSelectableItem(participant, selected = false, userId = null) {
        return this.create(participant, {
            selectable: true,
            selected: selected,
            variant: 'item',
            balanceFormat: 'signed',
            userId: userId
        });
    }

    /**
     * Create participant card for display (EventDetailPage style)
     */
    static createDisplayCard(participant) {
        return this.create(participant, {
            selectable: false,
            variant: 'card',
            balanceFormat: 'absolute',
            showContact: true
        });
    }

    /**
     * Get balance status information (consolidates duplicate logic)
     */
    static getBalanceStatus(balance) {
        if (balance > 0.01) {
            return {
                class: 'balance-owed',
                text: 'Credit'
            };
        } else if (balance < -0.01) {
            return {
                class: 'balance-owes',
                text: 'Owes'
            };
        } else {
            return {
                class: 'balance-settled',
                text: 'Settled'
            };
        }
    }

    /**
     * Build contact information HTML
     */
    static buildContactInfo(participant, showContact) {
        if (!showContact) return '';

        const contact = [];
        if (participant.email) contact.push(participant.email);
        if (participant.phone) contact.push(participant.phone);

        if (contact.length === 0) {
            // EventsPage style - show "No email" for missing contact
            return '<div class="participant-details">No email</div>';
        }

        // EventDetailPage style - show contact info
        return `<div class="participant-contact">${contact.join(' • ')}</div>`;
    }

    /**
     * Build balance display HTML
     */
    static buildBalanceDisplay(balance, balanceStatus, format) {
        if (format === 'absolute') {
            // EventDetailPage style - separate status text and absolute amount
            return `
                <div class="participant-balance ${balanceStatus.class}">
                    <span>${balanceStatus.text}</span>
                    <span>${formatCurrency(Math.abs(balance))}</span>
                </div>
            `;
        } else {
            // EventsPage style - signed amount only
            return `
                <div class="participant-balance ${balanceStatus.class}">
                    ${formatCurrency(balance)}
                </div>
            `;
        }
    }

    /**
     * Build action buttons (for future extensibility)
     */
    static buildActionButtons(participant) {
        return `
            <div class="participant-actions">
                <!-- Action buttons can be added here -->
            </div>
        `;
    }

    /**
     * Bind events for selectable participant items
     * @param {string} containerSelector - CSS selector for the container
     * @param {Function} onSelectionChange - Callback when selection changes
     */
    static bindSelectionEvents(containerSelector, onSelectionChange) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        // Delegate event handling for dynamically added participant items
        container.addEventListener('click', (e) => {
            const participantItem = e.target.closest('.participant-item');
            if (!participantItem) return;

            // Handle checkbox clicks
            const checkbox = participantItem.querySelector('.participant-checkbox');
            if (checkbox) {
                // If clicked on checkbox directly, let it handle its own state
                if (e.target === checkbox) return;

                // If clicked elsewhere on the item, toggle the checkbox
                checkbox.checked = !checkbox.checked;

                // Update visual state
                participantItem.classList.toggle('selected', checkbox.checked);

                // Get user ID and trigger callback
                const userId = participantItem.dataset.userId;
                if (userId && onSelectionChange) {
                    onSelectionChange(userId, checkbox.checked);
                }
            }
        });

        // Handle direct checkbox changes (keyboard, programmatic)
        container.addEventListener('change', (e) => {
            if (e.target.classList.contains('participant-checkbox')) {
                const participantItem = e.target.closest('.participant-item');
                const userId = participantItem?.dataset.userId;

                // Update visual state
                if (participantItem) {
                    participantItem.classList.toggle('selected', e.target.checked);
                }

                // Trigger callback
                if (userId && onSelectionChange) {
                    onSelectionChange(userId, e.target.checked);
                }
            }
        });
    }

    /**
     * Update selection state of a participant item
     */
    static updateSelection(containerSelector, userId, selected) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const item = container.querySelector(`[data-user-id="${userId}"]`);
        if (!item) return;

        const checkbox = item.querySelector('.participant-checkbox');
        if (checkbox) {
            checkbox.checked = selected;
            item.classList.toggle('selected', selected);
        }
    }

    /**
     * Get all selected participant user IDs
     */
    static getSelectedIds(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return [];

        const selectedItems = container.querySelectorAll('.participant-item.selected');
        return Array.from(selectedItems).map(item => item.dataset.userId).filter(Boolean);
    }

    /**
     * Clear all selections
     */
    static clearSelections(containerSelector) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const items = container.querySelectorAll('.participant-item');
        items.forEach(item => {
            const checkbox = item.querySelector('.participant-checkbox');
            if (checkbox) {
                checkbox.checked = false;
                item.classList.remove('selected');
            }
        });
    }
}

// Make available globally (browser) and as module (Node.js)
if (typeof window !== 'undefined') {
    window.ParticipantComponent = ParticipantComponent;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticipantComponent;
}