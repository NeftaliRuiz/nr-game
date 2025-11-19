# 🎮 Trivia Game V2.0 - Admin Panel Guide

## ✅ Status: Backend + Frontend Running Successfully

**Backend**: http://localhost:3000  
**Frontend**: http://localhost:4200  
**PostgreSQL**: localhost:5433 (trivia_db)

---

## 🚀 Quick Start

### 1. Start Both Servers
```bash
npm run dev
```

This runs both backend (port 3000) and frontend (port 4200) concurrently.

### 2. Access Admin Panel
1. Open browser: http://localhost:4200/admin/login
2. Use demo credentials:
   - **Email**: admin@trivia.com
   - **Password**: admin123

### 3. Access Game (V1 Original)
- Open: http://localhost:4200 or http://localhost:4200/game

---

## 📊 What's Implemented

### Backend V2.0 (✅ Complete & Running)
- **PostgreSQL Database**: TypeORM with 7 entities (User, Team, Event, Question, Game, GameParticipant, Answer)
- **Authentication API**: JWT-based login/register at `/api/auth`
- **Admin API**: CRUD operations at `/api/admin` (users, questions, statistics)
- **Events API**: Event management at `/api/events`
- **Legacy API**: Original V1 endpoints at `/api/trivia` (still working)

### Frontend Admin Panel (✅ Partially Complete)
**What's Working:**
- ✅ Login page with JWT authentication
- ✅ Admin dashboard layout with sidebar navigation
- ✅ Question list view with pagination
- ✅ HTTP interceptor for automatic JWT token injection
- ✅ Auth guard for protected routes
- ✅ Responsive TailwindCSS design

**What's Pending:**
- ⏳ Question create/edit forms
- ⏳ User management pages
- ⏳ Event management pages
- ⏳ Statistics dashboard
- ⏳ Game modes (Kahoot & Geoparty)

---

## 🗄️ Database Schema

### Seed Data (Already Loaded)
```
Users:
  - admin@trivia.com / admin123 (ADMIN role)
  - user@trivia.com / user123 (USER role)

Questions: 14 total
  - 12 general questions (Geography, Science, History, Sports, Entertainment, Technology)
  - 2 event-specific questions

Events:
  - 1 demo event: "Demo Trivia Event"
```

### Re-seed Database (if needed)
```bash
cd backend
npm run seed
```

---

## 🔌 API Endpoints

### Authentication (`/api/auth`)
```
POST /api/auth/register     - Create new user account
POST /api/auth/login        - Login with email/password
GET  /api/auth/profile      - Get current user profile (requires JWT)
PUT  /api/auth/profile      - Update profile (requires JWT)
```

### Admin Panel (`/api/admin`) - Requires Admin Role
```
GET    /api/admin/users              - List all users (pagination)
POST   /api/admin/users              - Create new user
PUT    /api/admin/users/:id          - Update user
DELETE /api/admin/users/:id          - Delete user

GET    /api/admin/questions          - List all questions (pagination)
POST   /api/admin/questions          - Create new question
PUT    /api/admin/questions/:id      - Update question
DELETE /api/admin/questions/:id      - Delete question

GET    /api/admin/statistics         - Get dashboard stats
```

### Events (`/api/events`)
```
GET    /api/events                   - List all events
GET    /api/events/:id               - Get event details
POST   /api/events                   - Create new event (requires auth)
PUT    /api/events/:id               - Update event (requires auth)
DELETE /api/events/:id               - Delete event (requires admin)
```

### Legacy V1 (`/api/trivia`) - Original Game
```
GET  /api/trivia/questions/random    - Get random question
POST /api/trivia/sessions             - Create game session
POST /api/trivia/validate             - Validate answer
PUT  /api/trivia/sessions/:id/score  - Update team score
GET  /api/trivia/sessions/:id/leaderboard - Get leaderboard
```

---

## 🔧 Technologies Used

### Backend
- **Runtime**: Node.js 20+ with TypeScript 5.3
- **Framework**: Express 4.18
- **Database**: PostgreSQL 16 (Docker)
- **ORM**: TypeORM 0.3.19
- **Authentication**: JWT (jsonwebtoken 9.0.2) + bcrypt 5.1.1
- **Validation**: express-validator 7.0.1, class-validator 0.14.1

### Frontend
- **Framework**: Angular 17
- **Styling**: TailwindCSS 3.3
- **HTTP Client**: RxJS + HttpClient
- **Routing**: Angular Router with Guards
- **Forms**: Reactive Forms with validation

### Infrastructure
- **Containerization**: Docker + Docker Compose
- **Package Manager**: npm
- **Version Control**: Git

---

## 📁 Project Structure

```
TRIVIA-IASD/
├── backend/
│   ├── src/
│   │   ├── entities/          # TypeORM entities (7 models)
│   │   ├── controllers/       # API controllers (auth, admin, event, trivia)
│   │   ├── routes/            # Express route definitions
│   │   ├── middleware/        # Auth & validation middleware
│   │   ├── utils/             # JWT & bcrypt utilities
│   │   ├── config/            # Database configuration
│   │   ├── seeds/             # Database seeding scripts
│   │   └── server.ts          # Application entry point
│   ├── .env                   # Environment variables
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/    # UI components
│   │   │   │   ├── game-board/          # V1 original game
│   │   │   │   ├── admin-login/         # V2 admin login
│   │   │   │   ├── admin-dashboard/     # V2 admin layout
│   │   │   │   └── question-list/       # V2 question management
│   │   │   ├── services/      # API services (trivia, auth, admin)
│   │   │   ├── guards/        # Route guards (AuthGuard)
│   │   │   ├── interceptors/  # HTTP interceptors (JWT injection)
│   │   │   ├── models/        # TypeScript interfaces
│   │   │   ├── app-routing.module.ts
│   │   │   └── app.module.ts
│   │   ├── styles.css         # Global Tailwind styles
│   │   └── main.ts
│   ├── package.json
│   └── angular.json
│
├── scripts/
│   └── init-postgres.sh       # PostgreSQL Docker setup
│
├── docker-compose.yml         # Multi-service orchestration
├── package.json               # Root package (runs both servers)
└── README.md                  # This file
```

---

## 🛠️ Development Workflows

### Run Backend Only
```bash
cd backend
npm run dev
```

### Run Frontend Only
```bash
cd frontend
npm start
```

### Run Both Servers
```bash
npm run dev
```

### Build for Production
```bash
npm run build           # Builds both
npm run build:backend   # Backend only
npm run build:frontend  # Frontend only
```

### Database Operations
```bash
cd backend
npm run seed            # Populate with demo data
```

---

## 🐛 Troubleshooting

### Port Already in Use
**Backend (3000):**
```bash
lsof -ti:3000 | xargs kill -9
```

**Frontend (4200):**
```bash
lsof -ti:4200 | xargs kill -9
```

**PostgreSQL (5433):**
```bash
docker stop trivia-postgres
docker rm trivia-postgres
```

### Database Connection Issues
Check PostgreSQL container status:
```bash
docker ps | grep trivia-postgres
```

Restart container:
```bash
docker restart trivia-postgres
```

### CORS Errors
Ensure backend is running on port 3000. CORS is configured for all origins in development.

### JWT Token Issues
Clear localStorage in browser DevTools:
```javascript
localStorage.clear()
```

Then login again.

---

## 🎯 Next Steps (Roadmap)

### Phase 1: Complete Admin Panel (Current)
- [ ] Question create/edit forms
- [ ] User management CRUD interface
- [ ] Event management interface
- [ ] Statistics dashboard with charts

### Phase 2: Game Modes
- [ ] Kahoot-style mode (turn-based teams)
- [ ] Geoparty mode (individual players with choices)
- [ ] WebSocket integration for real-time updates
- [ ] Game session management

### Phase 3: Advanced Features
- [ ] File upload for bulk question import
- [ ] Image/media support in questions
- [ ] Leaderboard persistence
- [ ] Analytics and reporting
- [ ] Multi-language support

### Phase 4: Production Deployment
- [ ] Docker production build
- [ ] Nginx reverse proxy
- [ ] SSL/HTTPS configuration
- [ ] Environment-based configuration
- [ ] CI/CD pipeline

---

## 📝 Notes

- **JWT Expiration**: Tokens expire after 7 days
- **Password Hashing**: bcrypt with 10 rounds
- **UUID**: All entities use UUID v4 as primary keys
- **Pagination**: Default limit is 10 items per page
- **Time Limits**: Questions have configurable time limits (30-60s)
- **Scoring**: Base points + time bonus + streak bonus

---

## 🔐 Security Considerations

### Implemented
✅ JWT authentication  
✅ Password hashing (bcrypt)  
✅ Role-based access control (RBAC)  
✅ Input validation (express-validator)  
✅ SQL injection protection (TypeORM parameterized queries)  

### TODO for Production
⏳ Rate limiting  
⏳ HTTPS enforcement  
⏳ CORS whitelist (currently allows all origins)  
⏳ Environment variable encryption  
⏳ Session management  
⏳ Audit logging  

---

## 👥 Team & Contributors

**Project Type**: Full-stack trivia game with admin panel  
**Architecture**: Microservices-ready monorepo  
**License**: MIT (or your choice)

---

## 📞 Support

For issues or questions:
1. Check console logs: Backend terminal and browser DevTools
2. Verify database connection: `docker ps`
3. Check API health: `curl http://localhost:3000/health`
4. Review seed data: `npm run seed` in backend/

---

**Last Updated**: January 2025  
**Version**: 2.0.0  
**Status**: Development - Admin Panel Partially Complete  

🎮 Happy Trivia Gaming! 🎉
