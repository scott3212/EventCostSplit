# 🏸 Badminton Event Cost Splitter

A simple, user-friendly expense-splitting web application designed for badminton event organizers. Split costs fairly among participants with zero learning curve.

## 🎯 Features

- **Zero Learning Curve**: Intuitive interface that anyone can use immediately
- **Smart Cost Splitting**: Flexible percentage-based splitting with visual feedback
- **Mobile-First Design**: Optimized for use during events on phones
- **Cross-Event Tracking**: Track balances across multiple badminton sessions
- **Payment Recording**: Simple payment tracking with full audit trail
- **Local Storage**: No database required - uses JSON files for data

## 🚀 Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open Your Browser**
   Navigate to `http://localhost:3000`

4. **Run Tests** (Optional)
   ```bash
   npm test                 # Run all tests
   npm run test:coverage    # View coverage report
   ```

## 📱 Usage

### For Event Organizers

1. **Add Players** - Add friends who participate in badminton events
2. **Create Event** - Set up a new badminton session with participants
3. **Add Expenses** - Record costs like court rental, shuttlecocks, refreshments
4. **Configure Shares** - Easily adjust who pays what using visual controls
5. **Track Payments** - Record when people pay you back

### Example Scenario

- **Event**: 6 people signed up for Sunday badminton
- **Court Rental**: $60 - everyone splits equally ($10 each)
- **Shuttlecocks**: $30 - Bob didn't play, so 5 people split ($6 each)
- **Result**: Bob owes $10, others owe $16 each

## 🛠️ Development

### Scripts

```bash
npm run dev          # Start development server
npm test             # Run tests
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Generate coverage report
npm run lint         # Check code quality
npm run format       # Format code
```

### Testing

- **Unit Tests**: Models, services, utilities
- **Integration Tests**: API endpoints, service interactions
- **Coverage Goal**: 85%+ overall coverage

### Code Quality

- **ESLint**: Code style and error detection
- **Prettier**: Automatic code formatting
- **Jest**: Testing framework
- **Clean Architecture**: Layered design with clear separation

## 📁 Project Structure

```
src/
├── models/          # Data models with validation
├── repositories/    # Data access layer
├── services/        # Business logic
├── controllers/     # HTTP request handlers
├── routes/         # Express routes
├── middleware/     # Custom middleware
└── utils/          # Utility functions

public/
├── *.html          # Frontend pages
├── css/            # Stylesheets
├── js/             # Frontend JavaScript
└── assets/         # Images and icons

tests/              # Comprehensive test suite
data/               # JSON data files
```

## 🎨 User Experience

This app prioritizes **user-friendliness** above all else:

- **Plain Language**: "Expense" not "Cost Item", "Share" not "Percentage"
- **Visual Feedback**: Color coding and emojis for instant understanding
- **Error Prevention**: Smart defaults and validation
- **Mobile Optimized**: Touch-friendly controls and thumb navigation
- **Progressive Disclosure**: Simple features first, advanced options hidden

## 📊 Technology Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla JavaScript + HTML/CSS (Phase 3-4)
- **Storage**: JSON files (no database)
- **Testing**: Jest + Supertest
- **Code Quality**: ESLint + Prettier

## 🏗️ Development Status

### ✅ Phase 1: Project Foundation (Completed)
- Clean architecture with layered design
- Express server with security middleware
- Data models with comprehensive validation
- File-based storage with backup/caching
- 78 unit tests with good coverage
- User-friendly error handling and terminology

### 🔄 Phase 2: Backend API Development (Next)
- REST API endpoints for all entities
- Service layer with business logic
- Integration tests for API
- Balance calculation system

### 📋 Phase 3: Frontend Foundation (Planned)
- Responsive UI components
- API communication layer
- Basic pages and navigation

### 🎨 Phase 4: Advanced Frontend (Planned)
- Interactive split configuration
- Real-time calculations
- Mobile-optimized experience

## 🤝 Contributing

This is a personal project for badminton event organization. The focus is on simplicity and user experience over complex features.

## 📄 License

MIT License - feel free to use for your own badminton group!

---

**Built with ❤️ for badminton enthusiasts who want to focus on the game, not the math.**