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
**Overall Progress**: ~92% Complete (6 phases, 4.7 completed)
- ✅ **Phases 1-3**: Foundation, Backend API, Frontend Core (Complete)
- ✅ **Phase 4**: Advanced Frontend Features (95% complete - expense management working)
- 📅 **Phase 5**: Integration & Testing (Pending)
- 🎯 **Phase 6**: E2E Testing (User management complete, events next)

### 🎯 Core User Journey Status
- ✅ Create Users → ✅ Create Events → ✅ Add Expenses → ⚠️ Custom Split Configuration

### 🎉 Recent Achievements (September 2024)
- **Participant Balance Calculation**: Fixed "all participants showing $0" bug with proper balance display
- **Expense Management Complete**: Full expense CRUD with participant name resolution
- **Race Condition Fixed**: Participant names now display correctly in expense cards  
- **UX Improvements**: Auto-refresh after expense deletion, no manual page refresh needed
- **CSP Compliance**: Eliminated all inline event handlers for proper security
- **Network Access**: Multi-device development support configured

### 🚀 Recent Bug Fixes (September 2024)
**Participant Count Synchronization ✅ FIXED**
- **Issue**: Participant count wasn't updating when adding/removing users via event detail page
- **Root Cause**: EventService.updateEvent() wasn't auto-updating `participantCount` when `participants` array changed
- **Solution**: Added automatic `participantCount = participants.length` calculation in EventService.updateEvent()
- **Testing**: Comprehensive Cypress test (`participant-count-simple.cy.js`) ensures regression protection
- **Status**: Fixed and verified with real-world usage

### 🚀 Current Feature Development
**URL Routing System (In Planning)**
- **Objective**: Implement proper SPA routing for bookmarkable URLs and better UX
- **Scope**: Replace single-URL navigation with proper route-based URLs
- **Proposed URLs**: 
  - `/` → Dashboard, `/events` → Events list, `/events/{id}` → Event detail
  - `/users` → Users page, `/expenses` → Expenses, `/payments` → Payments
- **Benefits**: Bookmarkable links, refresh preserves page, shareable URLs, professional UX
- **Status**: Feature branch approach planned, documentation updated

### 📋 Immediate Next Priorities
1. **URL Routing Implementation**: Professional SPA routing system (5-7 hours, moderate complexity)
2. **Custom Split Configuration UI**: Interactive percentage controls for unequal splits
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

## Technical Notes
- **Data Loading Order**: Participants MUST load before expenses to prevent "Unknown" names
- **Race Condition Pattern**: Always use sequential loading when data dependencies exist
- **CSP Compliance**: All event handlers use proper delegation, no inline handlers
- **Development Network**: Server binds to 0.0.0.0:3000 for multi-device testing
- **Participant Count Sync**: EventService automatically updates `participantCount` field when `participants` array changes via updateEvent()

## URL Routing Implementation Plan

### **Current Architecture**
- Single Page Application (SPA) with all pages in `index.html`
- Navigation via JavaScript show/hide of page divs
- Static URL: always `localhost:3000` regardless of current page
- Server fallback route serves `index.html` for all non-API routes (✅ already supports SPA routing)

### **Proposed Architecture** 
- **Route-Based URLs**: Each page gets its own URL path
- **Browser History Integration**: Back/forward buttons work correctly
- **Direct URL Access**: Users can bookmark and share specific pages
- **Refresh Preservation**: Page refresh maintains current context

### **Implementation Phases**
1. **Basic Router**: Create routing system with URL matching and page switching
2. **Event Detail Routing**: Add parameterized routes for event IDs (`/events/{id}`)
3. **Browser Integration**: Handle history API and navigation events
4. **URL Updates**: Update all navigation to use proper URLs instead of page switches

### **Risk Mitigation**
- **Feature Branch**: Implement in isolated branch for safe testing
- **Incremental Rollout**: Existing navigation remains functional during implementation
- **Fallback Support**: Server already configured to support SPA routing
- **No Breaking Changes**: Current functionality preserved throughout development

---

## 🎉 MAJOR MILESTONE: Advanced Frontend Features Complete (September 2025)

### **Phase 4.7: Complete Payments Page Implementation** ✅ COMPLETED
- ✅ **PaymentsPage Class**: Full implementation with balance overview, settlement suggestions, and payment history
- ✅ **Payment Recording**: Modal form with validation for recording settlements and top-ups
- ✅ **Settlement Processing**: Accurate "pays to group" messaging that matches backend behavior
- ✅ **Balance Visualization**: Color-coded balance cards showing who owes money vs who is owed
- ✅ **Settlement Suggestions**: Smart recommendations for efficient balance settlement
- ✅ **Comprehensive UI**: Responsive design with loading states, empty states, and error handling

### **Navigation System Standardization** ✅ COMPLETED
- ✅ **Consistency Fix**: Added missing `loadPage()` methods to EventsPage and UsersPage classes
- ✅ **Error Resolution**: Fixed "loadPage is not a function" errors across all page navigation
- ✅ **Debugging Enhancement**: Added comprehensive router debugging for troubleshooting
- ✅ **Mobile Navigation**: Fixed mobile menu text visibility issue

### **UX/UI Improvements** ✅ COMPLETED
- ✅ **Accurate Messaging**: Settlement suggestions now correctly show "Scott pays to group" instead of misleading "Scott pays to Zack"
- ✅ **Loading Flow Fix**: Proper execution order (hideLoading before renderPage) prevents container issues
- ✅ **Form Validation**: Payment recording with comprehensive client-side validation
- ✅ **API Integration**: Settlement endpoints properly integrated with frontend forms

## 🚀 NEXT PRIORITY: Phase 6 - Comprehensive E2E Testing

### **Phase 6.2: Event & Payment Management E2E Tests (HIGH PRIORITY)**
```cypress
Event Management Tests:
- Create event with participant selection
- Edit event details and manage participants  
- Delete event with proper warnings
- Event list display and navigation
- Participant validation and error handling

Payment Management Tests:
- View balance overview with correct color coding
- Process settlement suggestions 
- Record manual payments with validation
- Settlement flow from suggestion to completion
- Payment history display and filtering

Critical Business Journey Tests:
- Complete badminton session workflow:
  1. Create users (Alice, Bob, Charlie)
  2. Create event "Friday Badminton" 
  3. Add participants to event
  4. Add expenses (Court $60, Shuttlecocks $30)
  5. Verify balance calculations
  6. Process settlement suggestions
  7. Confirm balance updates
```

### **Current Application State: 100% CORE FUNCTIONALITY COMPLETE**

**Fully Functional User Journey:**
```
Create Users → Create Events → Add Participants → Add Expenses → View Balances → Process Settlements
     ✅              ✅              ✅              ✅              ✅              ✅
```

All major features are implemented and working:
- ✅ Complete User Management with balance tracking
- ✅ Complete Event Management with participant selection
- ✅ Complete Expense Management with automatic equal split calculation
- ✅ Complete Payment Management with settlement processing
- ✅ Dashboard Analytics with real-time statistics
- ✅ Mobile-responsive design with touch-friendly interactions
- ✅ SPA Navigation with URL routing

**Ready for comprehensive E2E testing and final production preparation.**

---

*Last Updated: September 8, 2025 - Payments Page Complete, Moving to Comprehensive E2E Testing*