# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Frontend (client/)
```bash
# Development
npm run dev                # Start development server with hot reload

# Build and Production
npm run build              # Build the application for production
npm run preview            # Preview production build

# Code Quality
npm run lint               # Run ESLint
```

### Backend (karma_ledger_backend/)
```bash
# Development
npm run start:dev          # Start with hot reload
npm run start:debug        # Start with debug mode

# Build and Production
npm run build              # Build the application
npm run start:prod         # Start production build

# Code Quality
npm run lint               # Run ESLint with auto-fix
npm run format             # Format code with Prettier

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:cov           # Run tests with coverage
npm run test:e2e           # Run end-to-end tests
```

## Architecture Overview

This is a full-stack karma tracking application with React TypeScript frontend and NestJS backend.

### Frontend Architecture (React + TypeScript + Vite)
- **Tech Stack**: React 19, TypeScript, Vite, TailwindCSS, React Router DOM
- **State Management**: Context API for authentication state
- **Styling**: TailwindCSS with responsive design
- **API Client**: Custom fetch-based client with JWT authentication
- **Routing**: React Router DOM with protected/public route components

### Frontend Structure
```
src/
├── components/          # Reusable UI components
│   ├── layout/         # Layout components (DashboardLayout)
│   ├── forms/          # Form components (LoginForm, RegisterForm)
│   ├── ProtectedRoute.tsx
│   └── PublicRoute.tsx
├── contexts/           # React Context providers
│   └── AuthContext.tsx # Authentication state management
├── pages/             # Page components
│   ├── dashboard/     # Dashboard sub-pages
│   │   ├── DashboardOverview.tsx
│   │   ├── EventsPage.tsx
│   │   ├── LeaderboardPage.tsx
│   │   ├── BadgesPage.tsx
│   │   └── SuggestionsPage.tsx
│   ├── HomePage.tsx
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   └── DashboardPage.tsx
├── services/          # API services
│   └── api.ts         # API client with all endpoints
├── types/             # TypeScript type definitions
│   └── index.ts       # All interfaces and types
└── hooks/             # Custom React hooks
    └── useAuth.ts     # Authentication hook
```

### Backend Architecture (NestJS + AI Integration)
- **Framework**: NestJS with TypeScript
- **Database**: SQLite (dev) / PostgreSQL (prod) with Sequelize ORM
- **Authentication**: JWT with Passport.js
- **Background Jobs**: BullMQ with Redis for AI processing
- **AI Integration**: Google Gemini API for karma analysis and suggestions

### Key Backend Modules
- **AuthModule**: JWT authentication with login/register endpoints
- **UsersModule**: User management and lookup
- **KarmaEventModule**: Core karma event tracking with AI feedback
- **DashboardModule**: Badges, leaderboard, suggestions, and analytics

### API Endpoints Summary
```
Authentication:
POST /auth/login         # User login
POST /auth/register      # User registration

Users:
GET /users              # Get all users
GET /users/:id          # Get user by ID
GET /users/lookup       # Find user by email

Karma Events:
POST /karma-events/create    # Create karma event (triggers AI analysis)
GET /karma-events/me         # Get user's karma events
GET /karma-events/me/score   # Get user's karma score percentage

Dashboard:
GET /dashboard/suggestions       # Get AI-generated suggestions
GET /dashboard/trigger-suggestions # Manually trigger suggestion generation
GET /dashboard/karma-scores     # Get weekly karma scores
GET /dashboard/leaderboard      # Get top 10 users leaderboard
GET /dashboard/badges          # Get all available badges
GET /dashboard/badges/me       # Get user's earned badges
```

### Asynchronous AI Processing
- **karma_feedback queue**: Processes each karma event through Google Gemini API for intensity scoring and personalized feedback
- **karma_suggestion queue**: Analyzes weekly karma patterns to generate personalized improvement suggestions
- **Event-driven badges**: Real-time badge awards for milestones (1st, 10th, 50th, 100th events, top 10 leaderboard)

### Database Schema
- **Users**: user_id, username, email, password
- **KarmaEvents**: event_id, user_id, action, intensity (-1 to 10), reflection, feedback, occurred_at
- **Badges**: badge_id, code, name, description, icon, is_active
- **UserBadges**: user_badge_id, user_id, badge_id, awarded_at
- **Suggestions**: id, user_id, suggestion_text, week, used, created_at

### Environment Configuration
- **Frontend**: VITE_API_URL environment variable for API base URL
- **Backend**: NODE_ENV switches between SQLite (dev) and PostgreSQL (prod)
- **AI**: Google Gemini API key required for karma analysis features

### Key Features
1. **AI-Powered Karma Analysis**: Each karma event is analyzed for emotional intensity and receives personalized feedback
2. **Weekly Suggestions**: AI generates personalized improvement suggestions based on user's karma patterns
3. **Gamification**: Badge system with achievement tracking and leaderboards
4. **Real-time Processing**: Background job queues ensure responsive user experience while processing AI analysis
5. **Responsive Design**: Mobile-first TailwindCSS implementation

### Development Notes
- Frontend uses custom API client with automatic JWT token management
- All protected routes require authentication via JWT Bearer token
- AI processing happens asynchronously to maintain API responsiveness
- Database auto-synchronizes in development mode
- Error handling implemented throughout API client and components