# Claude Code Session Context

## Project Overview
**Badminton Event Cost Splitter** - A web application for organizing badminton events, tracking expenses, and calculating cost splits among participants.

## Core Features
- **User Management**: Add users with name, email, phone (optional)
- **Event Creation**: Create events with participants from user pool
- **Expense Tracking**: Add expenses with custom split percentages
- **Balance Calculation**: Track who owes what across all events
- **Settlement Recording**: Record payments and settlements

## Key Design Decisions
- **JSON file storage** (no database initially)
- **Split percentage system** where percentages sum to 100%
- **Cross-event balance tracking** for global user balances
- **Mobile-first responsive design**

## Technology Stack
- **Backend**: Node.js + Express + File System
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Storage**: JSON files (users.json, events.json, cost_items.json, payments.json)
- **Testing**: Jest (backend), Cypress (E2E)

## Documentation Structure
- **[CLAUDE.md](./CLAUDE.md)** (this file): Current working context, essential info for development
- **[IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md)**: Detailed phase-by-phase progress history
- **[DESIGN.md](./DESIGN.md)**: Complete system design and architecture decisions
- **[IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md)**: Original development roadmap and specifications

## Current Implementation Status

### 📊 Quick Status Overview
**Overall Progress**: ~90% Complete (6 phases, 4.5 completed)
- ✅ **Phases 1-3**: Foundation, Backend API, Frontend Core (Complete)
- 🎯 **Phase 4**: Advanced Frontend Features (90% complete)
- 📅 **Phase 5**: Integration & Testing (Pending)
- 🎯 **Phase 6**: E2E Testing (User management complete, events next)

### 🎯 Core User Journey Status
- ✅ Create Users → ✅ Create Events → ✅ Add Expenses → ⚠️ Custom Split Configuration

### 📋 Immediate Next Priorities
1. **Custom Split Configuration UI**: Interactive percentage controls for unequal splits
2. **Event Management E2E Tests**: Expand Cypress testing to event workflows  
3. **Payment Recording Interface**: Settlement tracking and payment suggestions

> 📖 **See [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) for detailed implementation history and phase-by-phase progress**

## Development Environment
- **Server**: `npm run dev` at http://localhost:3000
- **Tests**: `npm test` (309 passing), `npm run test:e2e` (8 E2E tests passing)
- **Code Quality**: `npm run lint`, `npm run format`

## File Structure
```
src/
├── models/         # Data validation models
├── repositories/   # Data access layer
├── services/       # Business logic layer
├── controllers/    # API endpoints
└── utils/          # Helpers and validation

public/
├── index.html      # SPA structure
├── css/           # Responsive styling
└── js/            # Frontend JavaScript

cypress/
├── e2e/           # End-to-end tests
├── fixtures/      # Test data
└── support/       # Custom commands
```

## Key Validation Rules
- Split percentages must sum to exactly 100%
- Only event participants can be assigned expense splits
- User names must be unique
- Event participants must be existing users

## E2E Testing Status (September 2024)

### ✅ User Management Tests Complete
- Create/Edit/Delete users with validation
- Mobile responsiveness testing
- Empty state handling
- **8 tests passing, 3 skipped** (pending unimplemented features)

### 📋 Skipped Tests (Re-enable After Implementation)
1. **Duplicate User Validation**: Backend duplicate name validation
2. **User Balance Display**: Balance UI in user edit modal
3. **Balance Color Coding**: Visual balance indicators in user cards

### 🎯 Next E2E Test Phases
- Event Management E2E tests
- Expense management workflows
- Complete user journey testing

## Business Logic Example
**Scenario**: 4-person badminton session
- Court Rental $40 → Equal split: $10 each (25% each)
- Shuttlecocks $20 → Alice excluded: $6.67 each for 3 people (33.33% each, Alice 0%)
- **Result**: Alice owes $10, others owe $16.67 each

## Important Notes
- **User Experience Priority**: Intuitive interface for non-technical users
- **Mobile-First Design**: Optimized for phone usage during events
- **Real-Time Validation**: Immediate feedback on all forms
- **Cross-Event Balances**: Users' balances span multiple events
- **Audit Trail**: Complete transaction history maintained

---

*Last Updated: September 2024 - E2E Testing Infrastructure Complete*