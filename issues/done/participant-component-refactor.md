# Participant Component Refactor

## Issue Type
🔧 **Technical Debt / Code Quality**

## Priority
**Medium** - Improves maintainability and consistency

## Description
The application currently has duplicate and inconsistent participant rendering logic across different pages:

- **Events Page** (`EventsPage.createParticipantItem()`): Uses `.participant-item` class
- **Event Detail Page** (`EventDetailPage.createParticipantCard()`): Uses `.participant-card` class

This violates DRY principles and creates maintenance issues.

## Current Problems
1. **Inconsistent CSS class names** - same concept, different selectors
2. **Duplicate HTML generation logic** - two functions doing similar work
3. **Testing complexity** - different selectors required for similar elements
4. **Maintenance burden** - changes must be made in multiple places

## Proposed Solution
Create a shared `ParticipantComponent` class that handles all participant rendering with configurable options:

```javascript
// Proposed shared component
class ParticipantComponent {
  static create(participant, options = {}) {
    const {
      selectable = false,      // Show checkbox for selection
      showBalance = false,     // Display balance information
      showActions = false,     // Show action buttons
      className = 'participant-item'
    } = options;

    return `
      <div class="${className} ${selectable ? 'selectable' : ''} ${showBalance ? 'with-balance' : ''}">
        ${selectable ? '<input type="checkbox" class="participant-checkbox">' : ''}
        <div class="participant-info">
          <div class="participant-name">${participant.name}</div>
          <!-- shared participant info structure -->
        </div>
        ${showBalance ? this.renderBalance(participant) : ''}
        ${showActions ? this.renderActions(participant) : ''}
      </div>
    `;
  }
}
```

## Benefits
- ✅ **Single source of truth** for participant HTML
- ✅ **Consistent styling** across all pages
- ✅ **Easier testing** with unified selectors
- ✅ **Better maintainability**
- ✅ **Reduced code duplication**

## Files to Modify
- `public/js/pages/events.js` - Replace `createParticipantItem()`
- `public/js/pages/event-detail.js` - Replace `createParticipantCard()`
- `public/js/components/` - Create new `ParticipantComponent.js`
- `public/css/components.css` - Consolidate participant styles
- `cypress/e2e/event-management/participant-count-sync.cy.js` - Update selectors

## Acceptance Criteria
- [ ] All participant rendering uses shared component
- [ ] Consistent CSS class names across pages
- [ ] All existing functionality preserved
- [ ] All tests updated and passing
- [ ] No visual regressions in UI

## Estimated Effort
**2-3 hours** - Medium complexity refactoring

## Dependencies
None - can be implemented independently

## Testing Requirements
- [ ] All existing Cypress tests pass with updated selectors
- [ ] Visual regression testing on Events and Event Detail pages
- [ ] Functional testing of participant selection and display

---
**Created:** September 13, 2025
**Status:** Open
**Assigned:** TBD