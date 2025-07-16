# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

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

This is a NestJS-based AI-powered karma tracking application with the following key architectural patterns:

### Core Modules Structure
- **AppModule**: Root module with database, Redis queue, and event emitter configuration
- **AuthModule**: JWT-based authentication with Passport.js
- **UsersModule**: User management and profiles
- **KarmaEventModule**: Core karma event tracking with AI feedback processing
- **DashboardModule**: User dashboard, leaderboards, suggestions, and badge system

### Database Configuration
- **Development**: SQLite (configured in sequelize.config.ts:31)
- **Production**: PostgreSQL with SSL (configured in sequelize.config.ts:10-26)
- **ORM**: Sequelize with TypeScript models

### Asynchronous Processing Architecture
The application uses BullMQ with Redis for background job processing:

1. **karma_feedback queue**: Processes AI analysis for karma events
   - Triggered in karma_event.service.ts:31-35
   - Processed by karma-feedback.processor.ts
   - Calls Google Gemini API for intensity scoring and feedback

2. **karma_suggestion queue**: Generates weekly AI suggestions
   - Triggered in dashboard.service.ts
   - Processed by suggestions.processor.ts
   - Analyzes user's weekly karma events for personalized suggestions

### Event-Driven Badge System
- Uses @nestjs/event-emitter for real-time badge awards
- Events defined in config/events.ts
- Badge logic in dashboard/listeners/badge.listener.ts
- Emitted from karma_event.service.ts:37-49 for milestones

### Key Services
- **GeminiService**: AI integration for karma analysis (karma_event/gemini.service.ts)
- **BadgeService**: Achievement system (dashboard/badge.service.ts)
- **KarmaEventService**: Core event management with queue integration
- **DashboardService**: Leaderboard and suggestion management

### Environment Configuration
- Development: Uses SQLite + local Redis
- Production: Uses PostgreSQL + Redis Cloud URL
- Configuration switches based on NODE_ENV in sequelize.config.ts and app.module.ts

## Development Notes

### Database Models
- All models use Sequelize with TypeScript decorators
- Auto-synchronization enabled (synchronize: true)
- Models located in respective module/models/ directories

### Queue Processing
- Background workers run independently of API responses
- Jobs contain minimal data (IDs, not full objects)
- Queue names centralized in config/queues.ts

### Testing
- Unit tests use Jest with ts-jest transform
- E2E tests configured with separate Jest config
- Coverage reports generated in ../coverage/

### API Documentation
- Swagger integration available at root endpoint
- Interactive API testing with JWT authorization