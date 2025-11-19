# Copilot / AI Agent Instructions - Trivia Game Project

## Architecture Overview

This is a **full-stack interactive trivia game** with Angular frontend and Node.js/Express backend.

### Component Structure

- **Backend** (`backend/`): Node.js + Express + TypeScript REST API
  - Entry: `backend/src/server.ts` (runs on port 3000)
  - Routes: `backend/src/routes/trivia.routes.ts` (defines `/api/trivia/*` endpoints)
  - Controller: `backend/src/controllers/trivia.controller.ts` (game logic, session management)
  - Data: `backend/src/data/questions.json` (trivia questions database - in-memory for now)

- **Frontend** (`frontend/`): Angular 17 + TailwindCSS SPA
  - Entry: `frontend/src/main.ts` → `app.module.ts` → `app.component.ts`
  - Main game: `frontend/src/app/components/game-board/game-board.component.ts` (orchestrates game flow)
  - Service: `frontend/src/app/services/trivia.service.ts` (HTTP client for API, RxJS state management)
  - Models: `frontend/src/app/models/*.model.ts` (TypeScript interfaces for Questions, Teams, Sessions)

### Data Flow

1. **Game Setup**: User creates teams → Frontend calls `POST /api/trivia/sessions` → Backend creates session with unique ID
2. **Question Loading**: Frontend requests `GET /api/trivia/questions/random?category=X&exclude=1,2,3` → Backend returns random unused question
3. **Answer Validation**: User submits answer → `POST /api/trivia/validate` → Backend validates and calculates points (base + time bonus + streak)
4. **Score Update**: Frontend calls `PUT /api/trivia/sessions/:sessionId/score` → Backend updates team stats and streak
5. **Leaderboard**: Frontend polls `GET /api/trivia/sessions/:sessionId/leaderboard` → Backend returns sorted teams

### Key Patterns & Conventions

- **Game State**: Managed in-memory via `Map<string, GameSession>` in `trivia.controller.ts` (not persistent - resets on server restart)
- **Scoring Algorithm**: 
  - Base points: 100 (easy), 200 (medium), 300 (hard)
  - Time bonus: up to +50 points based on `(timeRemaining / timeLimit) * 50`
  - Streak bonus: +50 points every 3 consecutive correct answers
- **Component Communication**: Parent-child via `@Input`/`@Output`, async via RxJS `BehaviorSubject` in service
- **Styling**: TailwindCSS utility classes + custom components in `frontend/src/styles.css` (`.btn-primary`, `.card`, `.option-btn`)
- **Animations**: Angular Animations (`@angular/animations`) for fade-in, slide, stagger effects

## Developer Workflows

### Initial Setup

```bash
# Install all dependencies (both frontend and backend)
npm run install-all

# OR install individually
cd backend && npm install
cd ../frontend && npm install
```

### Running Locally

```bash
# Run both servers concurrently (recommended)
npm run dev

# OR run separately in two terminals
npm run dev:backend   # Backend on http://localhost:3000
npm run dev:frontend  # Frontend on http://localhost:4200
```

### Building for Production

```bash
npm run build          # Builds both backend and frontend
npm run build:backend  # TypeScript compilation to backend/dist/
npm run build:frontend # Angular build to frontend/dist/
```

### Project-Specific Commands

- Backend: `cd backend && npm run dev` (nodemon with ts-node hot reload)
- Frontend: `cd frontend && npm start` (ng serve with live reload)
- Check backend health: `curl http://localhost:3000/health`

## Critical Implementation Details

### Adding Questions or Categories

Edit `backend/src/data/questions.json`:
- Each question must have: `id`, `category`, `difficulty`, `points`, `question`, `options[]`, `correctAnswer` (0-3), `timeLimit`
- Categories must match the `categories` array in the same file (id linkage)

### Modifying Game Rules

In `backend/src/controllers/trivia.controller.ts`:
- `validateAnswer()`: adjust time bonus calculation or base points
- `updateTeamScore()`: modify streak logic (currently every 3 correct = +50 bonus)

In `frontend/src/app/components/game-board/game-board.component.ts`:
- `totalQuestions`: change number of questions per game (default 10)
- `loadNextQuestion()`: modify category selection logic (currently random)

### State Management

- Frontend uses RxJS `BehaviorSubject` in `trivia.service.ts` for reactive state (`currentSession$`, `currentQuestion$`, `leaderboard$`)
- Backend stores sessions in `Map` (non-persistent) - consider adding Redis or DB for production

### API CORS Configuration

In `backend/src/server.ts`, CORS is enabled for all origins via `cors()` middleware. For production, restrict to specific origins:
```typescript
app.use(cors({ origin: 'https://your-frontend-domain.com' }));
```

## Common Troubleshooting

- **Port conflicts**: Backend uses 3000, frontend uses 4200. Change via `PORT=3001 npm run dev:backend` or `ng serve --port 4201`
- **CORS errors**: Ensure backend is running and accessible; check browser console for exact origin error
- **Dependencies not found**: Run `npm install` in both `backend/` and `frontend/` directories
- **TypeScript errors**: Lint errors during development are expected until `npm install` completes; they resolve after dependencies load

## Integration Points

- **Frontend → Backend**: All API calls via `trivia.service.ts` (base URL: `http://localhost:3000/api/trivia`)
- **No external services**: Currently self-contained (no DB, no auth, no cloud APIs)
- **Future extensions**: Persistent storage (SQLite/PostgreSQL), sound effects, admin panel for question management

## Quick Reference

- **Main game logic**: `frontend/src/app/components/game-board/game-board.component.ts` (~400 lines)
- **API controller**: `backend/src/controllers/trivia.controller.ts` (session management, validation)
- **Data source**: `backend/src/data/questions.json` (18 sample questions across 6 categories)
- **Styles**: `frontend/src/styles.css` + TailwindCSS utility classes
- **Models**: `frontend/src/app/models/question.model.ts` and `team.model.ts` (TypeScript interfaces)

For detailed usage, see `README.md` in project root.
