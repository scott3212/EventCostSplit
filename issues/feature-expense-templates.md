# Feature: Quick Add Expense Templates

**Status:** 🎯 In Planning
**Priority:** High
**Estimated Effort:** 3-4 hours (Phase 1)
**Created:** 2025-11-15

## Overview
Add quick-add expense templates to streamline adding common recurring expenses (court rentals, shuttlecocks, etc.) with pre-filled data.

## User Requirements
- ✅ One-click to add common expenses from templates
- ✅ Pre-filled expense name and amount
- ✅ User only needs to select "paid by" (and optionally adjust amount)
- ✅ Templates managed globally (not per-event)
- ✅ Start with empty templates (user creates their own)
- ✅ Default payer configurable per template (optional)

## Design Decisions

### Template Scope
- **Global templates** (shared across all events)
- **Flexible design** for future category support
- **Maximum 6 visible templates** in quick-add bar (expandable later)

### Data Structure
```json
{
  "templates": [
    {
      "id": "template_<uuid>",
      "name": "Court Rental",
      "defaultAmount": 65,
      "category": null,          // Reserved for Phase 2
      "defaultPaidBy": "user_1", // Optional: pre-select default payer
      "order": 1,
      "createdAt": "2025-11-15T10:00:00Z",
      "updatedAt": "2025-11-15T10:00:00Z"
    }
  ]
}
```

### User Interface
**Location:** Event Detail page, above expense list

```
┌────────────────────────────────────────────────┐
│ Quick Add Templates                            │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│ │ Court    │ │ Shuttle  │ │ Water    │  [+]   │
│ │  $65     │ │  $20     │ │  $10     │        │
│ └──────────┘ └──────────┘ └──────────┘        │
│ [Manage Templates]                             │
└────────────────────────────────────────────────┘
```

**Quick Add Flow:**
1. Click template button → Opens expense modal
2. Pre-filled: Name, Amount, Equal split (automatic)
3. User selects: Paid by (pre-selected if template has defaultPaidBy)
4. Optional: Adjust amount
5. Click "Add Expense" → Done!

## Phase 1: Core Implementation (3-4 hours)

### Backend Tasks
- [ ] **1.1 Data Model**
  - [ ] Create `ExpenseTemplate` model (`src/models/ExpenseTemplate.js`)
  - [ ] Validation: name (required), defaultAmount (required, > 0), defaultPaidBy (optional)
  - [ ] Support for future `category` field (nullable for now)

- [ ] **1.2 Repository Layer**
  - [ ] Create `ExpenseTemplateRepository` (`src/repositories/ExpenseTemplateRepository.js`)
  - [ ] File: `data/expense_templates.json`
  - [ ] CRUD operations: create, findAll, findById, update, delete
  - [ ] Atomic file operations with proper error handling

- [ ] **1.3 Service Layer**
  - [ ] Create `ExpenseTemplateService` (`src/services/ExpenseTemplateService.js`)
  - [ ] Business logic: template ordering, default payer validation
  - [ ] Auto-increment order for new templates

- [ ] **1.4 Controller & Routes**
  - [ ] Create `ExpenseTemplateController` (`src/controllers/ExpenseTemplateController.js`)
  - [ ] Routes:
    - `GET /api/expense-templates` - List all templates
    - `POST /api/expense-templates` - Create template
    - `PUT /api/expense-templates/:id` - Update template
    - `DELETE /api/expense-templates/:id` - Delete template
    - `PUT /api/expense-templates/reorder` - Reorder templates (for future drag-drop)

- [ ] **1.5 Unit Tests**
  - [ ] Model validation tests
  - [ ] Repository CRUD tests
  - [ ] Service business logic tests
  - [ ] Controller endpoint tests

### Frontend Tasks
- [ ] **2.1 API Client**
  - [ ] Add template API methods to `public/js/api.js`
  - [ ] GET, POST, PUT, DELETE template endpoints

- [ ] **2.2 Template Management Page**
  - [ ] Create `TemplateManagementPage` class (`public/js/pages/template-management.js`)
  - [ ] Template list display (empty state when no templates)
  - [ ] Add/Edit template modal with form validation
  - [ ] Delete template with confirmation
  - [ ] Default payer dropdown (populated from users)

- [ ] **2.3 Event Detail Quick Add Integration**
  - [ ] Add quick-add template bar to Event Detail page
  - [ ] Show first 6 templates in button row
  - [ ] Template button click → Open expense modal with pre-filled data
  - [ ] Pre-select default payer if template has `defaultPaidBy`
  - [ ] "Manage Templates" button → Navigate to template management

- [ ] **2.4 Expense Modal Enhancement**
  - [ ] Support "template mode" with pre-filled, editable fields
  - [ ] Visual indicator that expense is from template
  - [ ] Allow amount adjustment before adding

- [ ] **2.5 UI/UX Polish**
  - [ ] Mobile-responsive template button row (horizontal scroll if needed)
  - [ ] Loading states for template operations
  - [ ] Error handling and user feedback
  - [ ] CSS styling for template buttons (consistent with app theme)

- [ ] **2.6 Navigation Integration**
  - [ ] Add "Templates" link to main navigation
  - [ ] Update router to handle `/templates` route

### Testing Tasks
- [ ] **3.1 Backend Unit Tests**
  - [ ] 309 existing tests still passing
  - [ ] New template tests added and passing

- [ ] **3.2 E2E Tests**
  - [ ] Create `cypress/e2e/templates/template-management.cy.js`
  - [ ] Test: Create template with valid data
  - [ ] Test: Edit template (name, amount, default payer)
  - [ ] Test: Delete template with confirmation
  - [ ] Test: Quick-add template from event detail page
  - [ ] Test: Pre-filled expense form from template
  - [ ] Test: Adjust amount before adding expense
  - [ ] Test: Empty state when no templates exist

## Implementation Notes

### Future-Proofing for Phase 2 (Categories)
- Database schema includes `category` field (nullable)
- Template ordering supports future category grouping
- UI components designed to accommodate category filters
- API responses include `category` field for forward compatibility

### Edge Cases to Handle
- Template with defaultPaidBy user who is deleted → Show validation error
- Template with defaultPaidBy user not in event participants → Auto-clear selection
- Maximum template limit (suggest 50 templates max for UX)
- Template name uniqueness validation (warn on duplicates)

### Performance Considerations
- Template list cached in frontend (reload only on CRUD operations)
- Lazy load template management page
- Debounce template search if implemented

## Success Criteria
- [ ] User can create expense templates with name, amount, and optional default payer
- [ ] Templates appear in quick-add bar on Event Detail page (max 6 visible)
- [ ] Clicking template opens expense modal with pre-filled data
- [ ] User can adjust amount and select payer before adding expense
- [ ] Template CRUD operations work correctly with validation
- [ ] Mobile-responsive design works on phone screens
- [ ] All existing tests still pass (309 backend tests)
- [ ] New E2E tests cover template workflows

## Timeline Estimate
- **Backend (1.5-2 hours):** Model, Repository, Service, Controller, Unit Tests
- **Frontend (1.5-2 hours):** Template Management UI, Event Detail Integration, Styling
- **E2E Testing (0.5-1 hour):** Cypress tests for template workflows
- **Total: 3.5-5 hours** (conservative estimate)

## Related Files
- New: `src/models/ExpenseTemplate.js`
- New: `src/repositories/ExpenseTemplateRepository.js`
- New: `src/services/ExpenseTemplateService.js`
- New: `src/controllers/ExpenseTemplateController.js`
- New: `public/js/pages/template-management.js`
- Modified: `public/js/pages/event-detail.js` (quick-add integration)
- Modified: `public/js/api.js` (template API methods)
- Modified: `public/js/router.js` (template route)
- Modified: `public/index.html` (template management page section)

## Post-Phase 1 Enhancements (Future)
- **Phase 2:** Template categories and filtering
- **Phase 3:** Usage analytics and smart suggestions
- **Phase 4:** Template import/export (JSON)
- **Phase 5:** Drag-to-reorder templates
- **Phase 6:** Recent templates first (usage-based ordering)

---

**Next Steps:**
1. ✅ Design approved - Ready to implement
2. ⏳ Start with backend implementation (Model → Repository → Service → Controller)
3. ⏳ Follow with frontend (Template Management → Event Detail Integration)
4. ⏳ Complete with E2E testing

*Last Updated: 2025-11-15*
