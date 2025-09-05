# Claude Code Session Context

## Project Overview
**Badminton Event Cost Splitter** - A simple expense-splitting web application for badminton events that allows users to create events, add participants, track expenses, and calculate balances.

## User Requirements Summary

### Initial Requirements
- Local app (no login required) for organizing badminton events
- Support multiple events with different participants and spending
- Even cost splitting by default among event participants  
- Proper calculation ensuring person who paid still owes their share
- Local file storage (CSV or JSON) - no database initially
- Simple web interface

### Core Features Needed
- **User Management**: Add users with UUID, name, email (optional), phone (optional)
- **Event Creation**: Create events with participants from user pool
- **Cost Tracking**: Add expenses with description, amount, paidBy, date
- **Balance Calculation**: Track who owes what across all events
- **Settlement Tracking**: Record when payments are made to organizer

### Additional Requirements Clarified
1. **Payment System**: Users pay directly to organizer/shared pot (not each other)
2. **Partial Cost Participation**: Support excluding users from specific cost items or custom split percentages
3. **Cross-Event Balance**: Track total balance across all events
4. **Top-up Support**: Allow advance payments
5. **Audit Trail**: Full transaction history for all payments and cost modifications
6. **Settlement vs Top-up**: Both are technically identical (add to user balance) - difference is just for audit/description purposes
7. **User Experience Priority**: App must be extremely user-friendly with minimal learning curve - intuitive for non-technical users

### Key Design Decisions Made

#### Data Structure Approach
- **JSON files** chosen over CSV (more flexible for nested data)
- **splitPercentage** system where all participants' percentages sum to 100% (easier calculation)
- **Unified payment** system (removed type distinction, kept optional event linking for audit)

#### Split Percentage Examples
- 3 people: 33.33%, 33.33%, 33.34% (default equal split)
- Custom: 40%, 35%, 25% (must sum to 100%)
- Exclusion: 0% for excluded participant

#### Technical Simplifications
- Payments are technically identical regardless of purpose
- Optional `relatedEventId` for audit trail only
- Description field allows user to specify purpose

## Example Business Scenario
**Event**: 6 people signed up for badminton session
**Cost Item 1**: Court Rental $60 - all 6 people pay equally (16.67% each = $10 each)
**Cost Item 2**: Shuttlecocks $30 - Bob excluded (0%), remaining 5 people pay equally (20% each = $6 each)
**Result**: Bob owes $10 (court only), others owe $16 each (court + shuttlecocks)

## File Structure Decided
```
data/
├── users.json          // User profiles with balances
├── events.json         // Event details with participants  
├── cost_items.json     // Expenses with splitPercentage config
└── payments.json       // All payments (settlements + top-ups)
```

## Technology Stack Selected
- **Backend**: Node.js + Express + File System operations
- **Frontend**: HTML/CSS/JavaScript (vanilla) + Bootstrap
- **Storage**: JSON files (no database initially)
- **ID Generation**: uuid library

## Key UI Design Elements
- **Dashboard**: Quick stats, recent activities, quick actions
- **Events Page**: List + detailed event view with cost items
- **Split Configuration UI**: Interactive sliders with real-time percentage updates
- **Payments Page**: Global balances + payment recording + transaction history
- **Visual Indicators**: Color coding for balances (red=owes, green=credit, gray=balanced)

## Current Status
- ✅ Complete design document created (`DESIGN.md`)
- ✅ All user requirements captured and addressed
- ✅ Data structures finalized with percentage-based splitting
- ✅ UI mockups and user flows designed
- ✅ Calculation logic defined and simplified
- ✅ Comprehensive implementation plan created (`IMPLEMENTATION_PLAN.md`)
- ✅ **PHASE 1 COMPLETED** - Project Foundation (2-3 days)
- ✅ **PHASE 2 COMPLETED** - Backend API Development (277 tests passing)
  - ✅ Complete Services layer with business logic
  - ✅ Controllers layer with comprehensive API endpoints (69 endpoints)
  - ✅ Full REST API with dependency injection
  - ✅ Integration tests and critical bug fixes
- ✅ **PHASE 3 FOUNDATION COMPLETED** - Frontend Foundation
  - ✅ Complete HTML structure with SPA architecture
  - ✅ Responsive CSS framework with component system
  - ✅ API client utilities with comprehensive endpoints
  - ✅ Navigation system with mobile menu support
  - ✅ Dashboard with real-time data loading
  - ✅ Working frontend at http://localhost:3000

## Implementation Plan Overview

### Phase 1: Project Foundation (2-3 days)
- Project setup with clean architecture
- Core infrastructure and models
- Testing framework setup

### Phase 2: Backend API Development (3-4 days) 
- Complete REST API with business logic
- User, Event, Cost Item, Payment services
- Balance calculation system

### Phase 3: Frontend Foundation (2-3 days)
- UI architecture and core components
- Responsive design framework
- Basic navigation and pages

### Phase 4: Advanced Frontend Features (3-4 days)
- Interactive split configuration
- Rich user interface components
- Mobile-optimized experience

### Phase 5: Integration & Testing (2-3 days)
- End-to-end testing
- Performance optimization
- Final polish and deployment prep

## Important Notes for Implementation
- Default split: Equal percentages (100 ÷ participant count)
- All split percentages must sum to exactly 100%
- Person who paid still owes their calculated share
- Payments are technically identical regardless of description/purpose
- Full audit trail required for all transactions
- UI should be intuitive for split percentage configuration
- Balance calculations happen across ALL events globally

## User Experience Requirements (CRITICAL)
- **Zero Learning Curve**: App should be immediately intuitive to anyone
- **Clear Visual Feedback**: Every action should have immediate, clear feedback
- **Guided Workflows**: Step-by-step guidance for complex operations
- **Error Prevention**: Prevent user mistakes before they happen
- **Mobile-First Design**: Optimized for phone usage during events
- **Minimal Clicks**: Reduce steps needed to complete common tasks
- **Smart Defaults**: Pre-fill forms with sensible defaults
- **Visual Hierarchy**: Most important actions prominently displayed
- **Confirmation Dialogs**: Clear confirmations for destructive actions
- **Progressive Disclosure**: Show advanced features only when needed

## Key Validation Rules
- Split percentages must sum to 100% exactly
- Only event participants can be assigned cost item splits
- Payment amounts must be positive
- User names must be unique
- Event participants must be existing users

## Implementation Decisions Made
- ✅ Split percentages sum to exactly 100% with proper rounding
- ✅ Validation happens on both client and server side
- ✅ Referential integrity handled through service layer validation
- ✅ User-friendly confirmation dialogs designed
- ✅ Full audit trail implemented with timestamps

## UX Decisions Implemented
- ✅ "Share" terminology instead of "percentage" for users
- ✅ Visual sliders with real-time dollar amount feedback
- ✅ Plain language throughout ("expense" not "cost item")
- ✅ Mobile-first touch targets and thumb-friendly navigation
- ✅ Error prevention with smart defaults and helpful messages
- ✅ Progressive disclosure: simple options first

## Phase 1 Deliverables Completed
- ✅ Complete project structure following clean architecture
- ✅ Express server with security, CORS, logging middleware
- ✅ File-based JSON storage with backup and caching
- ✅ Four data models with comprehensive validation
- ✅ BaseRepository with full CRUD operations
- ✅ User-friendly validation and error handling
- ✅ 78 unit tests with good coverage of core functionality
- ✅ Development tooling: ESLint, Prettier, Jest, nodemon
- ✅ UX utilities: terminology mapping, accessibility helpers

## Document Update History
- Initial design phase completed
- Implementation plan created with clean architecture
- User experience requirements added (critical for adoption)
- **Phase 1 Implementation Completed** (September 2024)
  - Project foundation established with clean architecture
  - Core infrastructure: Express server, file storage, validation
  - Data models: User, Event, CostItem, Payment with full validation
  - Testing framework: 78 tests passing, comprehensive coverage
  - UX foundation: User-friendly terminology and accessibility
  - Ready for Phase 2: Backend API Development
- **Phase 2 Backend Development Complete** (September 2024)
  - ✅ **SERVICES LAYER COMPLETE**: All business logic services implemented with comprehensive testing
  - ✅ **CONTROLLERS LAYER COMPLETE**: UserController, EventController, CostItemController, PaymentController with 69 API endpoints
  - ✅ Repositories layer: UserRepository, EventRepository, CostItemRepository, PaymentRepository with specialized methods  
  - ✅ CalculationService: Balance calculations, settlement suggestions, split validation with comprehensive logic
  - ✅ UserService: Complete user business logic with validation and balance integration
  - ✅ EventService: Advanced participant management with cost item validation and event statistics
  - ✅ CostItemService: Comprehensive expense management with split calculations and analytics
  - ✅ PaymentService: Payment processing with automatic balance adjustment and settlement features
  - Enhanced validators with comprehensive validation functions for all entities
  - Test coverage: 277 tests passing across all layers (100% pass rate)
  - ✅ Fixed critical BaseRepository ID generation bug
  - ✅ Complete REST API with dependency injection pattern
- **Phase 3 Frontend Foundation Complete** (September 2024)
  - ✅ **FRONTEND STRUCTURE**: Complete SPA architecture with HTML, CSS, and JavaScript
  - ✅ **CSS FRAMEWORK**: Responsive component system with modern design patterns
  - ✅ **API CLIENT**: Comprehensive JavaScript client with all 69 API endpoints
  - ✅ **NAVIGATION**: Mobile-responsive navigation with page routing
  - ✅ **DASHBOARD**: Real-time dashboard with API connectivity and data loading
  - ✅ **TESTING**: API connectivity verified, all static assets serving correctly
  - Frontend accessible at http://localhost:3000 with API at /api/*
  - Ready for Phase 3 Advanced Features: Interactive forms, user management, event creation

## Current Development Status

**Environment**: Fully functional development environment
- Server runs on `npm run dev` at http://localhost:3000
- Tests run with `npm test` (277 passing tests, 23 skipped integration tests)
- Code quality with `npm run lint` and `npm run format`
- Coverage reports with `npm run test:coverage`
- Frontend accessible with full API connectivity verified

**File Structure**: Clean architecture with complete frontend
- `src/models/` - Data models with validation
- `src/repositories/` - Data access layer with BaseRepository
- `src/services/` - Business logic layer with comprehensive features
- `src/controllers/` - HTTP request handling with 69 API endpoints
- `src/utils/` - Validation, file management, UX utilities
- `src/middleware/` - Error handling, logging, security
- `src/config/` - Application constants and configuration
- `public/` - Frontend assets (HTML, CSS, JavaScript)
  - `public/index.html` - Complete SPA structure
  - `public/css/` - main.css (layout) + components.css (UI components)
  - `public/js/` - api.js, navigation.js, dashboard.js, app.js
- `tests/` - Comprehensive test suite with helpers and fixtures

**Current Status**: Frontend Foundation Complete
- ✅ Complete backend API (277 tests passing)
- ✅ Working frontend with responsive design
- ✅ API client with all endpoints integrated
- ✅ Dashboard showing real-time data from API
- ✅ Mobile-responsive navigation system
- ✅ Ready for advanced frontend features

**Next Phase**: Advanced Frontend Features
- ✅ **USER MANAGEMENT UI COMPLETE** - Interactive user management interface
- 🚧 **EVENT MANAGEMENT UI** - Event creation and management interface (IN PROGRESS)
- Expense tracking with split configuration
- Payment recording and settlement tracking
- Mobile-optimized user experience

## Event Management UI Implementation Plan (Current Priority)

### User Story & Requirements
**As a badminton organizer, I want to create and manage events so that I can organize sessions with participants and track expenses.**

### Core Features Required
1. **Event List View**
   - Display all events with key information (name, date, participants count, total expenses)
   - Visual indicators for event status (upcoming, active, completed)
   - Quick action buttons (view, edit, add expense)
   - Mobile-responsive card layout

2. **Create Event Form**
   - Required: Name, Date, Location
   - Optional: Description, Notes
   - Participant selection from existing users (multi-select with search)
   - Smart defaults and validation
   - Success/error feedback

3. **Event Detail View**
   - Event information display
   - Participant list with balance indicators
   - Expense summary and list
   - Quick actions (add expense, record payment, edit event)

4. **Edit Event Functionality**
   - Update event details
   - Add/remove participants (with validation for existing expenses)
   - Confirmation dialogs for destructive changes

5. **Participant Management**
   - Add participants from user pool
   - Remove participants (with expense validation)
   - Visual participant cards with balance info

### Implementation Phases (Small, Testable Components)

#### Phase 4.1: Event List Foundation (2-3 hours)
- [ ] Create `public/js/pages/events.js` basic structure
- [ ] Implement event list loading and display
- [ ] Add loading states and error handling
- [ ] Basic responsive event cards
- [ ] Event status indicators
- **Tests**: Event list rendering, loading states, error handling

#### Phase 4.2: Create Event Form (3-4 hours)
- [ ] Create event modal/form structure in HTML
- [ ] Implement form validation (name, date, location)
- [ ] Add participant selection widget (multi-select)
- [ ] Form submission and API integration
- [ ] Success/error feedback
- **Tests**: Form validation, participant selection, API integration

#### Phase 4.3: Event Detail View (3-4 hours)
- [ ] Event detail page/modal layout
- [ ] Display event information and participants
- [ ] Show basic expense summary (if any)
- [ ] Navigation between list and detail views
- [ ] Responsive design for mobile
- **Tests**: Event detail loading, participant display, navigation

#### Phase 4.4: Edit Event & Participant Management (4-5 hours)
- [ ] Edit event form (pre-populated)
- [ ] Add/remove participants functionality
- [ ] Validation for participant changes (check existing expenses)
- [ ] Confirmation dialogs for changes
- [ ] Bulk participant operations
- **Tests**: Edit validation, participant management, confirmation flows

#### Phase 4.5: Polish & Integration (2-3 hours)
- [ ] Error handling improvements
- [ ] Loading state optimizations
- [ ] Mobile UX refinements
- [ ] Integration with dashboard stats
- [ ] Performance optimizations
- **Tests**: Error scenarios, mobile responsive tests, integration tests

### Technical Requirements

#### API Endpoints (Backend Ready)
- `GET /api/events` - List all events
- `POST /api/events` - Create new event
- `GET /api/events/:id` - Get event details
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event
- `POST /api/events/:id/participants` - Add participant
- `DELETE /api/events/:id/participants/:userId` - Remove participant

#### Frontend Components
- `EventsPage` class (main controller)
- Event list rendering and management
- Event form modal components
- Participant selection widget
- Event detail view components
- Error handling and loading states

#### Validation Rules
- Event name: required, 2-100 characters, unique
- Event date: required, valid date format
- Location: required, 2-200 characters
- Participants: at least 1 participant required
- Cannot remove participants if they have expenses in the event

#### UX/UI Patterns (Consistent with User Management)
- Card-based layouts for event list
- Modal forms for create/edit operations
- Loading spinners and error messages
- Mobile-first responsive design
- Confirmation dialogs for destructive actions
- Real-time validation feedback

### Success Criteria
1. ✅ All 279+ tests pass (including new Event UI tests)
2. ✅ Events can be created with participants from user pool
3. ✅ Event list displays correctly with proper status indicators
4. ✅ Event details show participants and basic info
5. ✅ Edit functionality works with proper validation
6. ✅ Mobile-responsive design works on phone screens
7. ✅ Error handling provides clear user feedback
8. ✅ Integration with existing dashboard and navigation

### Definition of Done
- [ ] All functionality implemented and tested
- [ ] Frontend tests covering happy path and error scenarios  
- [ ] Mobile responsive design verified
- [ ] Error handling and validation complete
- [ ] Code reviewed and documented
- [ ] Performance acceptable on mobile devices
- [ ] Integration with existing app navigation
- [ ] Backend API integration working correctly

## Recent Development Update: User Management UI (September 2024)

### **User Management UI Complete**
- ✅ **User List Display**: Complete user listing with balance visualization and status indicators
- ✅ **Add New User Form**: Comprehensive modal with validation for name, email, phone fields
- ✅ **Edit User Functionality**: Pre-populated modal with balance display and update capability
- ✅ **Delete User Feature**: Double confirmation dialog with warnings about consequences
- ✅ **Content Security Policy Fix**: Replaced inline event handlers with proper event delegation
- ✅ **API Integration Fix**: Fixed response format handling bug that prevented user list loading
- ✅ **Testing Verified**: All 277 tests passing, frontend functioning correctly at http://localhost:3000

### Implementation Details
**Files Modified:**
- `public/js/pages/users.js` - Complete user management functionality
- `public/js/api.js` - API client with correct response handling
- `public/index.html` - User modals and interface structure  
- `public/css/components.css` - User card styling and modal components

**Key Features Implemented:**
- Real-time user list with balance color coding (green=owed, red=owes, gray=settled)
- Form validation with user-friendly error messages
- Mobile-responsive design with touch-friendly interactions
- Double confirmation for destructive delete operations
- Proper event handling without CSP violations
- Automatic data refresh after CRUD operations

### Commit History for User Management UI:
- `c0afcdc` - Fix CSP violations and implement Delete User functionality
- `0e2c2f6` - Handle API response format correctly in frontend
- `3e7eaad` - Implement comprehensive Edit User functionality with modal
- `718049c` - Implement Add New User form with comprehensive validation
- `5b83495` - Implement user list display with balance visualization

### Testing Results:
- **Backend Tests**: 277 tests passing (100% success rate)
- **Frontend Integration**: Users page fully functional with Create, Read, Update, Delete operations
- **API Connectivity**: All user endpoints working correctly
- **Responsive Design**: Mobile and desktop compatibility verified
- **Security**: Content Security Policy compliance achieved

This context should help resume development on any machine or with any developer.
- Always remember to update docs including CLAUDE.md after any implementation
- Always remember to run all tests before make a commit.