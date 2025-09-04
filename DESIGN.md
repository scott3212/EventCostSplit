# Badminton Event Cost Splitter - Design Document

## Overview
A simple expense-splitting web application for badminton events. Users can create events, add participants, track expenses, and calculate how much each person owes. The app supports partial cost participation and settlement tracking.

**USER EXPERIENCE PRIORITY**: This app MUST be extremely user-friendly with zero learning curve. Target users are casual badminton organizers who may not be technically savvy. Every design decision prioritizes intuitive usability over technical complexity.

## Updated Data Structures

### Users
```json
{
  "id": "uuid-v4",
  "name": "John Doe",
  "email": "john@example.com",     // optional
  "phone": "+1234567890",          // optional
  "totalBalance": -25.50           // negative = owes money, positive = has credit
}
```

### Events
```json
{
  "id": "uuid-v4", 
  "name": "Badminton Session #1",
  "date": "2024-09-04",
  "description": "Weekly badminton at Community Center",
  "participants": ["user-id-1", "user-id-2", "user-id-3"]
}
```

### Cost Items (Updated)
```json
{
  "id": "uuid-v4",
  "eventId": "event-id",
  "description": "Court Rental", 
  "amount": 60.00,
  "paidBy": "user-id-1",
  "date": "2024-09-04",
  "splitPercentage": {
    "user-id-1": 33.33,    // 33.33% of total cost
    "user-id-2": 33.33,    // 33.33% of total cost
    "user-id-3": 33.34     // 33.34% of total cost (totals 100%)
  }
}
```

### Payments (Simplified)
```json
{
  "id": "uuid-v4",
  "userId": "user-id-1", 
  "amount": 50.00,
  "date": "2024-09-01",
  "description": "Advance payment for future events",
  "relatedEventId": null        // optional - for audit trail linking to specific event
}
```

## File Storage Structure

```
data/
├── users.json
├── events.json  
├── cost_items.json
└── payments.json    // renamed from topups.json
```

## Key Features

### 1. Cost Item Participation System

**Default Behavior:**
- All event participants automatically get equal split percentages in new cost items
- Default: 100 ÷ number of participants (e.g., 3 people = 33.33%, 33.33%, 33.34%)
- Users can modify split percentages before or after creating cost items
- All percentages must sum to exactly 100%

**Split Percentage Examples:**
- **33.33%** = Pays 33.33% of total cost
- **50%** = Pays half the total cost  
- **0%** = Excluded, pays nothing
- Custom splits: 40%, 35%, 25% (must sum to 100%)

**Example Scenario:**
- Event: 6 participants
- Court Rental ($60): All 6 people split equally (16.67% each) = $10 each
- Shuttlecocks ($30): Bob excluded (0%), remaining 5 people split equally (20% each) = $6 each

### 2. Simplified Payment System

**Single Payment Type:**
- All payments are technically identical (add to user's balance)
- Optional event linking for audit trail purposes
- Description field allows users to specify purpose (advance payment, settling debt, etc.)

**Payment Flow:**
- Users pay organizer/shared pot
- Organizer records payment in system
- Balance automatically updated
- Full audit trail maintained with optional event linking

## Updated Web Interface Design

### Main Navigation
- Dashboard 
- Users
- Events
- Payments & Balances

### Page Details

#### Dashboard
- Quick stats (users, events, total pending balances)
- Recent activities (new costs, payments received)
- Quick actions (Add User, Create Event, Record Payment)

#### Users Page
- List all users with current balances
- Add/edit user functionality
- Color coding: Red (owes money), Green (has credit), Gray (balanced)

#### Events Page

**Events List:**
- All events with dates, participants count, total cost
- Quick balance status per event

**Event Detail Page:**
```
Event: Sept 4 Badminton Session
Participants: Alice, Bob, Charlie, David (4 people)

Cost Items:
┌─────────────────────────────────────────────────────────────────┐
│ Court Rental - $60 (paid by Alice on Sept 4)                   │
│ Split: Alice(33.33%), Bob(33.33%), Charlie(33.34%), David(0%)  │
│ Per person: $20 each (David excluded)                          │
│ [Edit Split] [Delete]                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Shuttlecocks - $24 (paid by Bob on Sept 4)                     │
│ Split: Alice(25%), Bob(25%), Charlie(25%), David(25%)          │
│ Per person: $6 each                                            │
│ [Edit Split] [Delete]                                          │
└─────────────────────────────────────────────────────────────────┘

Event Balance Summary:
- Alice: Paid $60, Owes $26, Balance: +$34
- Bob: Paid $24, Owes $26, Balance: -$2
- Charlie: Paid $0, Owes $26, Balance: -$26
- David: Paid $0, Owes $6, Balance: -$6

[Add Cost Item]
```

**Add/Edit Expense with Share Configuration (User-Friendly):**
```
Add Expense
┌─────────────────────────────────────────────────────────────────┐
│ What was this for? [Shuttlecocks                           ]  │
│ How much? [$24.00                                          ]  │
│ Who paid? [Bob ▼                                           ]  │
│ When? [Today ▼                                             ]  │
│                                                               │
│ Who should share this cost?                                   │
│ ┌───────────────────────────────────────────────────────────┐ │
│ │ 👤 Alice Johnson    [◉ Include] [Share: $6.00]           │ │
│ │ 👤 Bob Smith        [◉ Include] [Share: $6.00]           │ │
│ │ 👤 Charlie Davis    [◉ Include] [Share: $6.00]           │ │
│ │ 👤 David Wilson     [◉ Include] [Share: $6.00]           │ │
│ │                                                           │ │
│ │ 🔄 [Split Equally] 🚫 [Exclude Someone] ⚙️ [Custom Split]  │ │
│ └───────────────────────────────────────────────────────────┘ │
│                                                               │
│ ✓ Everyone pays $6.00 (Total: $24.00)                       │
│ [💾 Save Expense] [❌ Cancel]                                │
└─────────────────────────────────────────────────────────────────┘
```

#### Payments & Balances Page

**Global Balance Summary:**
```
Overall Balances:
┌─────────────────────────────────────────────────────────────────┐
│ Alice Johnson     +$34.00  [Record Payment]                    │
│ Bob Smith         -$2.00   [Record Payment]                    │
│ Charlie Davis     -$26.00  [Record Payment]                    │
│ David Wilson      -$6.00   [Record Payment]                    │
└─────────────────────────────────────────────────────────────────┘

Settlement Summary:
- Total Owed to Organizer: $34.00
- Total Credit Available: $34.00
- Net Balance: $0.00 ✓
```

**Payment History:**
```
Payment History:
┌─────────────────────────────────────────────────────────────────┐
│ Sept 5 - Bob paid $25.00 - Balance: +$23.00                    │
│         "Settling up for recent games" (Event: Sept 4)         │
│ Sept 1 - Alice paid $50.00 - Balance: +$50.00                  │
│         "Advance payment for future events"                    │
│ Aug 30 - Charlie paid $30.00 - Balance: +$4.00                 │
│         "Payment for badminton expenses" (Event: Aug 30)       │
└─────────────────────────────────────────────────────────────────┘
```

**Record Payment Form (User-Friendly):**
```
💰 Someone Paid You Back
┌─────────────────────────────────────────────────────────────────┐
│ Who paid? [Charlie Davis ▼                                   ] │
│ How much? [$26.00                                           ] │
│ For which event? [Sept 4 Badminton ▼] (optional)             │
│ Notes: [Settling up for recent games                       ] │
│ When? [Today ▼                                             ] │
│                                                               │
│ 📊 Charlie currently owes: $26.00                            │
│ 🎯 After this payment: $0.00 (All caught up! 🎉)           │
│                                                               │
│ [✅ Record Payment] [❌ Cancel]                               │
└─────────────────────────────────────────────────────────────────┘
```

## Updated Calculation Logic

### Cost Item Balance Calculation
```javascript
function calculateCostItemBalances(costItem, eventParticipants) {
  let balances = {};
  
  // Calculate each user's share based on percentage
  eventParticipants.forEach(userId => {
    const percentage = costItem.splitPercentage[userId] || 0;
    const userShare = (costItem.amount * percentage) / 100;
    balances[userId] = -userShare; // User owes their share
  });
  
  // Person who paid gets credit for full amount
  balances[costItem.paidBy] += costItem.amount;
  
  return balances;
}
```

### Global Balance Calculation with Payments
```javascript
function calculateGlobalBalances() {
  let globalBalances = {};
  
  // Initialize all users
  users.forEach(user => globalBalances[user.id] = 0);
  
  // Add balances from all cost items
  events.forEach(event => {
    const eventCostItems = costItems.filter(item => item.eventId === event.id);
    
    eventCostItems.forEach(costItem => {
      const itemBalances = calculateCostItemBalances(costItem, event.participants);
      Object.keys(itemBalances).forEach(userId => {
        globalBalances[userId] += itemBalances[userId];
      });
    });
  });
  
  // Add all payments
  payments.forEach(payment => {
    globalBalances[payment.userId] += payment.amount;
  });
  
  return globalBalances;
}
```

## Technology Stack

**Backend:**
- Node.js + Express
- File System operations for JSON storage
- uuid library for ID generation

**Frontend:**
- HTML/CSS/JavaScript (vanilla)
- Bootstrap for styling
- Interactive sliders for percentage selection

**Project Structure:**
```
badminton-cost-splitter/
├── server/
│   ├── app.js
│   ├── routes/
│   │   ├── users.js
│   │   ├── events.js
│   │   ├── payments.js    // simplified payment system
│   │   └── balances.js
│   └── utils/
│       └── fileManager.js
├── public/
│   ├── index.html         // Dashboard
│   ├── users.html
│   ├── events.html        
│   ├── event-detail.html  // Single event view
│   ├── payments.html      // Payments & Balances
│   ├── css/style.css
│   └── js/app.js
└── data/
    ├── users.json
    ├── events.json
    ├── cost_items.json
    └── payments.json
```

## Audit Trail Features

All actions are logged with:
- Timestamp
- User action (cost added, payment recorded, split modified)
- Before/after states
- Full transaction history
- Balance change tracking

## User Experience Design Principles

### 1. Plain Language Throughout
- "Expense" instead of "Cost Item"
- "Share" instead of "Split Percentage"  
- "Player" instead of "Participant"
- "What you owe" instead of "Balance"
- "Who paid you back?" instead of "Record Settlement"

### 2. Visual Communication
- 👤 Icons for people/users
- 💰 Money/payment icons
- ✓ Checkmarks for positive states
- 🚨 Clear warning indicators
- Color coding: Red (owes money), Green (has credit), Blue (neutral)

### 3. Mobile-First Interactions
- Large touch targets (minimum 44px)
- Simple tap/toggle interactions
- Swipe gestures for common actions
- Thumb-friendly navigation placement

### 4. Error Prevention
- Smart defaults for all forms
- Real-time calculation preview
- Impossible to create invalid states
- "Are you sure?" confirmations for destructive actions

### 5. Progressive Disclosure
- Show essential features first
- "Advanced options" hidden by default
- Context-sensitive help tooltips
- Step-by-step guided workflows

This design provides a robust foundation for badminton expense splitting that prioritizes user experience and requires zero learning curve for casual organizers.