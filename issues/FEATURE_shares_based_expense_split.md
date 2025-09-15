# Feature Request: Shares-Based Expense Split System

## Issue Summary
**Current State**: Expense splitting uses percentage-based system (must sum to 100%)
**Proposed State**: Expense splitting uses share-based system (natural ratios)

## Real-World Use Case Example
**Scenario**: 2-hour badminton session, $60 court fee, 6 people
- 1 person plays only 1 hour → 1 share
- 5 people play full 2 hours → 2 shares each
- **Share ratio**: 1:2:2:2:2:2 (total: 11 shares)
- **Automatic calculation**:
  - 1-hour person pays: $60 × (1/11) = $5.45
  - 2-hour people pay: $60 × (2/11) = $10.91 each

**Current percentage system problems**:
- Users must manually calculate: 1/11 = 9.09%, 2/11 = 18.18%
- Prone to rounding errors and calculation mistakes
- Not intuitive for users

## Technical Analysis

### Current System Architecture
```javascript
// Current data structure
splitPercentage: {
  "user1": 33.33,  // Must sum to 100%
  "user2": 33.33,
  "user3": 33.34
}
```

### Proposed System Architecture
```javascript
// New data structure
splitShares: {
  "user1": 1,      // Natural share numbers
  "user2": 2,
  "user3": 2
}
// Total shares = 5, auto-calculated percentages: 20%, 40%, 40%
```

## Implementation Strategy

### Phase 1: Backend Data Model Extension (Non-Breaking)
1. **Add new field** to CostItem model alongside existing percentage field
2. **Dual storage** during transition period:
   ```javascript
   {
     splitPercentage: { user1: 20, user2: 40, user3: 40 }, // existing
     splitShares: { user1: 1, user2: 2, user3: 2 }         // new
   }
   ```
3. **Update calculation logic** to work with both systems
4. **Maintain API compatibility** - accept both formats

### Phase 2: Frontend UI Enhancement
1. **Add toggle switch** in expense form: "Percentage" vs "Shares"
2. **New share input interface**:
   - Simple number inputs (1, 2, 3, etc.)
   - Real-time calculation preview showing resulting percentages
   - Total shares display
3. **Backwards compatibility** - display existing percentage-based expenses

### Phase 3: Migration and Cleanup
1. **Data migration script** to convert existing percentages to equivalent shares
2. **Default to shares mode** for new expenses
3. **Eventually deprecate** percentage mode (with user preference)

## Detailed Implementation Plan

### 1. Database Schema Changes
```sql
-- Add new column (JSON field)
ALTER TABLE cost_items ADD COLUMN split_shares JSON;

-- Migration script to convert existing data
UPDATE cost_items
SET split_shares = CONVERT_PERCENTAGE_TO_SHARES(split_percentage);
```

### 2. Backend Model Updates
```javascript
// models/CostItem.js
class CostItem {
  constructor(data) {
    // ... existing fields
    this.splitShares = data.splitShares || null;
    this.splitMode = data.splitMode || 'percentage'; // 'percentage' | 'shares'
  }

  // New method to calculate percentages from shares
  calculatePercentagesFromShares() {
    if (!this.splitShares) return this.splitPercentage;

    const totalShares = Object.values(this.splitShares).reduce((sum, shares) => sum + shares, 0);
    const percentages = {};

    for (const [userId, shares] of Object.entries(this.splitShares)) {
      percentages[userId] = (shares / totalShares * 100);
    }

    return percentages;
  }
}
```

### 3. Frontend UI Components
```javascript
// New share input component
class ShareSplitComponent {
  render() {
    return `
      <div class="split-mode-toggle">
        <label><input type="radio" name="splitMode" value="shares" checked> Shares</label>
        <label><input type="radio" name="splitMode" value="percentage"> Percentage</label>
      </div>

      <div class="shares-input" id="shares-mode">
        ${participants.map(user => `
          <div class="share-row">
            <span>${user.name}</span>
            <input type="number" min="0" step="0.5" value="1" data-user-id="${user.id}">
            <span class="calculated-percentage">20.00%</span>
            <span class="calculated-amount">$12.00</span>
          </div>
        `).join('')}
        <div class="total-shares">Total: <span id="total-shares">5</span> shares</div>
      </div>
    `;
  }
}
```

### 4. Calculation Service Updates
```javascript
// services/CalculationService.js
class CalculationService {
  static calculateFromShares(amount, shareDistribution) {
    const totalShares = Object.values(shareDistribution).reduce((sum, shares) => sum + shares, 0);
    const balances = {};

    for (const [userId, shares] of Object.entries(shareDistribution)) {
      const percentage = shares / totalShares;
      balances[userId] = amount * percentage;
    }

    return balances;
  }

  static convertSharesToPercentages(shareDistribution) {
    const totalShares = Object.values(shareDistribution).reduce((sum, shares) => sum + shares, 0);
    const percentages = {};

    for (const [userId, shares] of Object.entries(shareDistribution)) {
      percentages[userId] = (shares / totalShares * 100);
    }

    return percentages;
  }
}
```

## Risk Assessment & Mitigation

### High Risks
1. **Data corruption** during migration
   - **Mitigation**: Comprehensive backup, gradual rollout, rollback plan
2. **Breaking existing functionality**
   - **Mitigation**: Dual-mode operation, extensive testing, feature flags

### Medium Risks
1. **User confusion** during transition
   - **Mitigation**: Clear UI indicators, help tooltips, gradual introduction
2. **API compatibility** issues
   - **Mitigation**: Version API endpoints, maintain backwards compatibility

### Low Risks
1. **Performance impact** from dual calculations
   - **Mitigation**: Minimal impact, cache calculations if needed

## Testing Strategy

### 1. Unit Tests
- Share-to-percentage conversion accuracy
- Rounding behavior consistency
- Edge cases (0 shares, fractional shares)

### 2. Integration Tests
- API endpoints accept both formats
- Database operations for both modes
- Migration script validation

### 3. E2E Tests
- UI toggle between modes
- Expense creation with shares
- Display of existing percentage-based expenses

### 4. User Acceptance Testing
- Real-world scenarios validation
- Usability testing with actual users
- Performance testing with large expense lists

## Success Metrics
1. **Functionality**: All existing expenses continue to work
2. **Usability**: Time to create custom split reduced by 50%
3. **Accuracy**: Elimination of manual calculation errors
4. **Adoption**: 80% of new custom splits use shares mode within 30 days

## Implementation Timeline

### Week 1-2: Backend Foundation
- [ ] Add database schema changes
- [ ] Implement dual-mode CostItem model
- [ ] Update calculation services
- [ ] Backend API updates

### Week 3-4: Frontend Development
- [ ] UI toggle component
- [ ] Share input interface
- [ ] Real-time calculation preview
- [ ] Integration with existing forms

### Week 5: Testing & Migration
- [ ] Comprehensive test suite
- [ ] Data migration script
- [ ] User acceptance testing
- [ ] Performance validation

### Week 6: Deployment & Monitoring
- [ ] Gradual feature rollout
- [ ] User feedback collection
- [ ] Performance monitoring
- [ ] Bug fixes and refinements

## User Experience Improvements

### Before (Percentage Mode)
```
Court Fee: $60
Alice: [33.33%] → Hard to calculate
Bob:   [33.33%] → What should this be?
Carol: [33.34%] → Must ensure 100% total
```

### After (Shares Mode)
```
Court Fee: $60
Alice: [1 share] → Plays 1 hour
Bob:   [2 shares] → Plays 2 hours
Carol: [2 shares] → Plays 2 hours
Total: 5 shares → Auto-calculates: 20%, 40%, 40%
```

## Backwards Compatibility Plan

1. **Display existing expenses** using percentage labels
2. **Allow editing** of old expenses in either mode
3. **Conversion utility** to migrate user preferences
4. **Documentation** for transition period
5. **Support both modes** indefinitely (user choice)

## Future Enhancements

1. **Preset share templates**: "Equal", "By hours played", "By skill level"
2. **Fractional shares**: Support 0.5, 1.5 shares for more precision
3. **Share justification**: Comments explaining why someone gets certain shares
4. **Historical analysis**: Track common share patterns per user
5. **Mobile-optimized** share input interface

---

**Priority**: High
**Complexity**: Medium
**Impact**: High (significantly improves user experience)
**Timeline**: 6 weeks for full implementation
**Dependencies**: None (pure enhancement)

**Next Steps**: Review and approve implementation plan, then begin with backend foundation work.