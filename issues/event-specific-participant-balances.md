# Display Event-Specific Participant Balances

## Issue Description

**Type**: Feature Enhancement - UX Improvement
**Priority**: Medium
**Affects**: Event Detail Page - Participants Section
**Goal**: Replace global user balances with event-specific balances in participant display

## Problem Statement

Currently, the participants section in event detail pages displays each participant's **overall global balance** across all events. This is not contextually helpful when viewing a specific event, as users want to understand each participant's financial standing **within that event only**.

### Current Behavior
- Participants section shows: `Alice Smith - Owes $45.67` (global balance across all events)
- Users cannot easily see: "How much does Alice owe/is owed for THIS specific event?"

### Desired Behavior
- Participants section shows: `Alice Smith - Owes $15.00` (balance for this event only)
- Clear context: Users immediately understand financial standing within the current event

## Current Implementation Analysis

### Backend Balance Calculation
**File**: `src/services/CalculationService.js:49-104`

The `calculateEventBalance(eventId)` method already calculates event-specific balances:
```javascript
async calculateEventBalance(eventId) {
  // Returns event-specific balance data:
  return {
    eventId,
    eventName: event.name,
    userBalances: {
      'user-id-1': { owes: 25.50, paid: 40.00, net: 14.50 },
      'user-id-2': { owes: 30.00, paid: 15.00, net: -15.00 }
    },
    totalCosts: 120.00,
    totalPayments: 80.00
  };
}
```

### Frontend Implementation
**File**: `public/js/pages/event-detail.js:397-447`

Current flow:
1. ✅ `loadParticipants()` calls `api.getEventBalance(eventId)` (event-specific balance)
2. ✅ Merges balance data with participant data
3. ❌ **Problem**: Uses `balance.net` as global balance instead of event balance
4. ❌ **Problem**: `ParticipantComponent.createDisplayCard()` displays this as global balance

**Root Issue**: The event-specific balance data is available but incorrectly displayed as global balance.

## Technical Solution Design

### Phase 1: Fix Balance Data Interpretation

**File**: `public/js/pages/event-detail.js:410-418`

**Current Code**:
```javascript
const participantsWithBalance = participants.map(participant => {
    const balance = balanceData.userBalances[participant.id];
    return {
        ...participant,
        balance: balance ? balance.net : 0,      // ← Currently used as "global balance"
        owes: balance ? balance.owes : 0,
        paid: balance ? balance.paid : 0
    };
});
```

**Updated Code**:
```javascript
const participantsWithBalance = participants.map(participant => {
    const balance = balanceData.userBalances[participant.id];
    return {
        ...participant,
        // Event-specific balance data (already correct from backend)
        eventBalance: balance ? balance.net : 0,     // New: event-specific balance
        eventOwes: balance ? balance.owes : 0,       // New: owes for this event
        eventPaid: balance ? balance.paid : 0,       // New: paid for this event
        // Keep original structure for backward compatibility
        balance: balance ? balance.net : 0,          // Will be treated as event balance
        owes: balance ? balance.owes : 0,
        paid: balance ? balance.paid : 0
    };
});
```

### Phase 2: Update UI Component Logic

**File**: `public/js/components/ParticipantComponent.js`

**Current**: Displays `participant.totalBalance || participant.balance || 0` as "global balance"

**Updated**: Recognize context and display event-specific balance:

```javascript
static create(participant, options = {}) {
    // ... existing code ...

    // Determine balance source based on context
    const balance = options.useEventBalance
        ? (participant.eventBalance || participant.balance || 0)
        : (participant.totalBalance || participant.balance || 0);

    // ... rest of method ...
}

// Update createDisplayCard for event context
static createDisplayCard(participant) {
    return this.create(participant, {
        selectable: false,
        variant: 'card',
        balanceFormat: 'absolute',
        showContact: true,
        useEventBalance: true  // New: use event-specific balance
    });
}
```

### Phase 3: Enhance Balance Display Context

**Enhancement**: Add visual indicators to clarify the balance scope

```javascript
static buildBalanceDisplay(balance, balanceStatus, balanceFormat, options = {}) {
    if (!this.showBalance) return '';

    const balanceText = balanceFormat === 'signed'
        ? formatCurrency(balance, { showSign: true })
        : formatCurrency(Math.abs(balance));

    const contextLabel = options.useEventBalance ? 'This Event' : 'Overall';

    return `
        <div class="participant-balance ${balanceStatus.class}">
            <div class="balance-amount">${balanceText}</div>
            <div class="balance-status">${balanceStatus.text} • ${contextLabel}</div>
        </div>
    `;
}
```

## Implementation Plan

### Backend Changes: ✅ No Changes Required
- `calculateEventBalance()` already provides correct event-specific data
- API endpoint `/api/events/:id/balance` already returns event-scoped balances
- All backend logic is correct and complete

### Frontend Changes Required

#### 1. Update Balance Data Processing
**File**: `public/js/pages/event-detail.js:410-418`
- Rename balance fields to clarify they are event-specific
- Add backward compatibility support
- **Effort**: 30 minutes

#### 2. Update ParticipantComponent
**File**: `public/js/components/ParticipantComponent.js`
- Add `useEventBalance` option to control balance source
- Update `createDisplayCard()` to use event balances
- Add context labels ("This Event" vs "Overall")
- **Effort**: 1 hour

#### 3. CSS Enhancements (Optional)
**File**: `public/css/components.css`
- Add styling for context labels
- Enhance visual distinction between event and global balances
- **Effort**: 30 minutes

### API Changes: ✅ No Changes Required
The existing `/api/events/:id/balance` endpoint already provides event-specific balance data in the correct format. No backend modifications needed.

## Test Coverage Plan

### Unit Tests

#### Frontend Balance Processing Tests
**File**: `tests/unit/frontend/EventDetailPage.participants.test.js` (new)
```javascript
describe('Event Participant Balance Display', () => {
    test('should process event-specific balance data correctly');
    test('should handle participants with no event activity');
    test('should maintain backward compatibility with balance field');
    test('should pass event balance context to component');
});
```

#### ParticipantComponent Tests
**File**: `tests/unit/frontend/ParticipantComponent.test.js` (enhance existing)
```javascript
describe('ParticipantComponent Event Balance Display', () => {
    test('should use event balance when useEventBalance is true');
    test('should use global balance when useEventBalance is false');
    test('should display correct context labels');
    test('should handle missing balance data gracefully');
});
```

### Integration Tests

#### Event Balance API Integration
**File**: `tests/integration/event-balance-display.test.js` (new)
```javascript
describe('Event-Specific Balance Display Integration', () => {
    test('should load and display event balances correctly');
    test('should handle events with no expenses');
    test('should update balances when expenses change');
    test('should maintain consistency with calculation service');
});
```

### E2E Tests

#### Complete Event Balance Workflow
**File**: `cypress/e2e/event-management/event-participant-balances.cy.js` (new)
```javascript
describe('Event Participant Balance Display', () => {
    it('should display event-specific balances for participants', () => {
        // Create event with multiple participants
        // Add expenses with different splits
        // Verify participant section shows event-specific balances
        // Verify balances match expense calculations
        // Verify balance changes when expenses are modified
    });

    it('should distinguish between event and global balances', () => {
        // Create multiple events with same participants
        // Add different expenses to each event
        // Navigate between events
        // Verify balance displayed changes per event context
    });
});
```

#### Balance Accuracy Validation
**File**: `cypress/e2e/calculations/event-balance-accuracy.cy.js` (new)
```javascript
describe('Event Balance Calculation Accuracy', () => {
    it('should calculate event balances correctly for complex scenarios', () => {
        // Create event with 4 participants
        // Add multiple expenses with varying splits
        // Add payments and settlements
        // Verify participant balances match manual calculations
    });
});
```

## User Experience Improvements

### 1. Contextual Clarity
- **Before**: "Alice owes $45.67" (unclear scope)
- **After**: "Alice owes $15.00 • This Event" (clear scope)

### 2. Actionable Information
- Users can immediately understand event-specific financial responsibilities
- Better decision-making for settlements within the event context
- Clear visibility of who owes what for the current event

### 3. Visual Enhancements
- Add subtle context indicators
- Maintain existing color coding (green = credit, red = owes)
- Consider adding event summary statistics

## Files to Modify

### Core Implementation
- `public/js/pages/event-detail.js` - Update balance data processing
- `public/js/components/ParticipantComponent.js` - Add event balance support

### Testing
- `tests/unit/frontend/EventDetailPage.participants.test.js` - New unit tests
- `tests/unit/frontend/ParticipantComponent.test.js` - Enhanced component tests
- `tests/integration/event-balance-display.test.js` - New integration tests
- `cypress/e2e/event-management/event-participant-balances.cy.js` - New E2E tests

### Optional Enhancements
- `public/css/components.css` - Context label styling
- `public/js/utils/formatters.js` - Balance formatting utilities

## Success Criteria

### Functional Requirements
✅ **Event Context**: Participants section displays event-specific balances only
✅ **Accuracy**: Balances match the event's expense and payment calculations
✅ **Clarity**: Users can distinguish between event and global balance contexts
✅ **Consistency**: Balance calculations remain consistent with backend logic

### User Experience Requirements
✅ **Immediate Understanding**: Users immediately understand event financial status
✅ **Contextual Relevance**: Information is relevant to the current event only
✅ **Visual Clarity**: Balance information is clearly labeled and contextualized
✅ **Seamless Transition**: No disruption to existing user workflows

### Technical Requirements
✅ **No Breaking Changes**: Existing API endpoints remain unchanged
✅ **Backward Compatibility**: Existing balance data structure preserved
✅ **Performance**: No additional API calls required
✅ **Test Coverage**: Comprehensive test suite prevents regressions

## Estimated Effort

### Development
- **Frontend Changes**: 2-3 hours
- **Component Updates**: 1 hour
- **CSS Enhancements**: 30 minutes
- **Total Development**: 3.5-4.5 hours

### Testing
- **Unit Tests**: 2 hours
- **Integration Tests**: 1 hour
- **E2E Tests**: 2 hours
- **Total Testing**: 5 hours

### **Grand Total**: 8.5-9.5 hours

## Priority Justification

This is a **Medium Priority** enhancement because:

### Benefits
1. **Improved User Experience**: More contextually relevant financial information
2. **Better Decision Making**: Clear event-specific balance visibility
3. **Reduced Confusion**: Eliminates ambiguity about balance scope
4. **Enhanced Usability**: Aligns displayed data with user mental model

### Low Implementation Risk
1. **No Backend Changes**: Leverages existing calculation logic
2. **No Breaking Changes**: Maintains API compatibility
3. **Incremental Enhancement**: Builds on solid existing foundation
4. **High Test Coverage**: Comprehensive validation prevents issues

### User Value
1. **Frequent Use Case**: Users regularly need event-specific financial status
2. **Decision Support**: Helps with settlement planning within events
3. **Clarity**: Removes confusion about cross-event vs event-specific balances

## Alternative Approaches Considered

### 1. Add Global Balance Toggle
**Pros**: Users could switch between event and global view
**Cons**: Added complexity, UI clutter, most users want event context

### 2. Show Both Balances
**Pros**: Complete information available
**Cons**: Information overload, visual clutter, confusing for most users

### 3. Selected Approach: Event-Specific Only
**Pros**: Simple, contextual, matches user expectations
**Cons**: Global balance not immediately visible (users can navigate to user page for that)

## Related Features

### Future Enhancements
1. **Balance History**: Show how balances changed over time within the event
2. **Settlement Suggestions**: Event-specific payment recommendations
3. **Expense Attribution**: Show which expenses contribute to each participant's balance
4. **Balance Alerts**: Notifications when event balances reach certain thresholds

### Cross-References
- Event balance calculation logic: `src/services/CalculationService.js`
- Global user balance display: `public/js/pages/users.js`
- Expense management: `public/js/pages/event-detail.js:expense-management`
- Payment processing: `public/js/pages/payments.js`

---

*Feature Request Created: 2025-09-24*
*Affects: Event Detail Page - Participants Section*
*Dependencies: None (uses existing calculation infrastructure)*
*Backwards Compatible: Yes*