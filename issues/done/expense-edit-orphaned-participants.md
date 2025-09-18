# Expense Edit Fails When Split Contains Removed Event Participants

## Issue Description

**Type**: Bug - Data Consistency Issue
**Priority**: High
**Affects**: Event Detail Page - Expense Management
**Error**: `User {userId} in split is not a participant in the event`

## Problem Summary

When editing an expense that previously had participants who were later removed from the event, the edit operation fails because the expense's split configuration still references the removed participants, but the backend validation rejects them as they're no longer event participants.

## Reproduction Steps

1. Create an event with 6 participants (including "Minnie")
2. Create an expense with all 6 participants in the split
3. Remove "Minnie" from the expense split configuration
4. Remove "Minnie" from the event participant list
5. Attempt to edit the expense description
6. **Result**: Edit fails with validation error

## Root Cause Analysis

### Frontend Issue
The frontend expense edit functionality (`event-detail.js:872`) sends the current split configuration, which may still contain participants that were removed from the event but not properly cleaned from the expense's split data.

**Key Problem Areas:**

1. **Split Data Persistence**: When editing an expense, the frontend may be sending stale split percentage data that includes removed participants
2. **Split Configuration Loading**: `loadSplitConfiguration()` and `renderSplitParticipants()` may not properly filter out participants who are no longer in the event
3. **Data Synchronization**: No mechanism to clean up expense split data when participants are removed from events

### Backend Validation
The backend correctly validates that split participants must be current event participants (`CostItemService.js:126-128`):

```javascript
for (const userId of splitParticipants) {
  if (!event.participants.includes(userId)) {
    throw new ValidationError(`User ${userId} in split is not a participant in the event`);
  }
}
```

This validation is **correct** and should remain - the issue is that the frontend is sending invalid data.

### Error Flow
```
User edits expense → Frontend sends split data with removed participant →
Backend validates split participants against current event participants →
Validation fails → 400 Bad Request returned → User sees generic error
```

## Impact Assessment

- **Severity**: High - Users cannot edit expenses when participants have been removed
- **User Experience**: Poor error handling - generic message doesn't explain the real issue
- **Data Integrity**: Risk of data inconsistency between expenses and events
- **Workflow Disruption**: Blocks normal expense management operations

## Technical Solution Plan

### Phase 1: Frontend Data Sanitization

1. **Expense Edit Data Preparation** (`event-detail.js`)
   - Filter split percentages to only include current event participants
   - Recalculate split percentages when participants are missing
   - Add validation before sending update request

2. **Split Configuration Loading**
   - Update `renderSplitParticipants()` to only show current event participants
   - Clean `currentSplitPercentages` to remove non-participants
   - Recalculate equal splits when participants are missing

3. **Data Synchronization Helper**
   - Create utility function to sanitize expense data against current participants
   - Ensure split percentages sum to 100% after participant removal

### Phase 2: Improved Error Handling

1. **Better Error Messages**
   - Parse backend error to provide specific guidance
   - Show which participants are invalid and why
   - Suggest corrective actions

2. **Proactive Validation**
   - Check split participants against event participants before sending
   - Show warnings when split data needs cleaning

### Phase 3: Automatic Data Cleanup

1. **Participant Removal Cascade**
   - When removing participants from events, offer to clean related expense splits
   - Automatically recalculate splits for affected expenses

## Implementation Details

### Frontend Changes Required

#### 1. Data Sanitization Function
```javascript
sanitizeExpenseData(expenseData, currentParticipants) {
    if (!expenseData.splitPercentage) return expenseData;

    const validSplit = {};
    let totalValidPercentage = 0;

    // Keep only current participants
    for (const [userId, percentage] of Object.entries(expenseData.splitPercentage)) {
        if (currentParticipants.includes(userId)) {
            validSplit[userId] = percentage;
            totalValidPercentage += percentage;
        }
    }

    // Recalculate if participants were removed
    if (totalValidPercentage > 0 && totalValidPercentage !== 100) {
        const factor = 100 / totalValidPercentage;
        for (const userId in validSplit) {
            validSplit[userId] = Math.round(validSplit[userId] * factor * 100) / 100;
        }
    }

    return { ...expenseData, splitPercentage: validSplit };
}
```

#### 2. Enhanced Error Handling
```javascript
catch (error) {
    if (error.message.includes('not a participant in the event')) {
        this.showExpenseError('participants',
            'Some participants in the split are no longer in this event. Please review and update the split configuration.');
    } else {
        // existing error handling
    }
}
```

#### 3. Split Configuration Cleanup
```javascript
loadSplitConfiguration() {
    if (!this.currentEvent || !this.currentEvent.participants) return;

    // Clean existing split data
    if (this.currentSplitPercentages) {
        this.currentSplitPercentages = this.sanitizeSplitPercentages(
            this.currentSplitPercentages,
            this.currentEvent.participants
        );
    }

    this.renderSplitParticipants();
    this.updateSplitAmounts();
}
```

## Test Coverage Plan

### Unit Tests Required

1. **Data Sanitization Tests**
   ```javascript
   describe('Expense Data Sanitization', () => {
     test('should remove non-participant from split percentages');
     test('should recalculate percentages after participant removal');
     test('should handle empty split after all participants removed');
     test('should preserve valid participants in split');
   });
   ```

2. **Split Configuration Tests**
   ```javascript
   describe('Split Configuration with Removed Participants', () => {
     test('should filter out removed participants from split UI');
     test('should recalculate equal split with current participants only');
     test('should maintain split integrity after participant changes');
   });
   ```

3. **Error Handling Tests**
   ```javascript
   describe('Expense Edit Error Handling', () => {
     test('should show helpful error for invalid participants');
     test('should suggest split reconfiguration');
     test('should prevent submission with invalid split data');
   });
   ```

### Integration Tests Required

1. **End-to-End Workflow Tests**
   ```javascript
   describe('Expense Management with Participant Changes', () => {
     test('should edit expense after removing participant from event');
     test('should handle multiple participant removals gracefully');
     test('should maintain expense integrity through event changes');
   });
   ```

### Cypress E2E Tests Required

1. **Complete Workflow Test**
   ```javascript
   it('should handle expense editing after participant removal', () => {
     // Create event with multiple participants
     // Create expense with all participants
     // Remove participant from event
     // Edit expense description
     // Verify edit succeeds
     // Verify split percentages are recalculated
   });
   ```

2. **Error Scenario Tests**
   ```javascript
   it('should show helpful error when split contains invalid participants', () => {
     // Create scenario with stale split data
     // Attempt edit
     // Verify error message guides user to solution
   });
   ```

## Files to Modify

### Core Implementation
- `public/js/pages/event-detail.js` - Main expense edit logic
- `public/js/api.js` - Error message handling improvements

### Test Files
- `tests/unit/frontend/EventDetailPage.expense.test.js` - Unit tests for expense management
- `tests/integration/expense-participant-consistency.test.js` - New integration test file
- `cypress/e2e/expense-management/expense-edit-after-participant-removal.cy.js` - New E2E test

## Success Criteria

✅ **Functional Requirements**
- Users can edit expenses even after participants are removed from events
- Split percentages are automatically recalculated when participants are missing
- Clear error messages guide users when manual intervention is needed

✅ **Technical Requirements**
- Frontend sanitizes expense data before sending to backend
- No changes required to backend validation (remains correctly strict)
- Comprehensive test coverage prevents regression

✅ **User Experience Requirements**
- Seamless editing experience without cryptic errors
- Automatic handling of common participant removal scenarios
- Clear feedback when manual split adjustment is needed

## Estimated Effort

- **Implementation**: 4-6 hours
- **Testing**: 3-4 hours
- **Total**: 7-10 hours

## Priority Justification

This is a **High Priority** issue because:
1. **Blocks core functionality** - Users cannot edit expenses in common scenarios
2. **Poor user experience** - Cryptic error messages provide no guidance
3. **Data consistency risk** - Misalignment between events and expenses
4. **Common workflow** - Participant changes are frequent in real usage

---

*Issue identified: 2025-09-17*
*Affects: Event Detail Page Expense Management*
*Related: Participant management, data consistency validation*