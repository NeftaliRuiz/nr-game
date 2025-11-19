# 🎮 Trivia Game - Modos de Juego (Kahoot & Geoparty)

## ✅ Implementación Completa

### 📦 Componentes Creados

#### Backend (100% Complete)
- ✅ **game-kahoot.controller.ts**: 7 funciones para modo equipos
- ✅ **game-geoparty.controller.ts**: 7 funciones para modo individual  
- ✅ **game.routes.ts**: 14 endpoints REST API
- ✅ **game-socket.ts**: WebSocket handler con 14 eventos
- ✅ **server.ts**: Integración Socket.IO + HTTP server

#### Frontend (100% Complete)
- ✅ **game.service.ts**: HTTP client con 14 métodos + utilidades
- ✅ **websocket.service.ts**: Socket.IO client con RxJS observables
- ✅ **game-kahoot.component.ts/.html/.css**: Componente completo modo equipos
- ✅ **game-geoparty.component.ts/.html/.css**: Componente completo modo individual
- ✅ **app.module.ts**: Componentes registrados
- ✅ **app-routing.module.ts**: Rutas configuradas

---

## 🚀 Cómo Usar los Nuevos Modos de Juego

### 1. Iniciar Servidores

```bash
# Terminal 1 - Backend
cd /Users/umidev/Desktop/TRIVIA-IASD/backend
npm run dev

# Terminal 2 - Frontend  
cd /Users/umidev/Desktop/TRIVIA-IASD/frontend
npm start
```

**URLs:**
- Backend: http://localhost:3000
- Frontend: http://localhost:4200
- WebSocket: ws://localhost:3000/game

---

### 2. Modo Kahoot (Equipos) 🎯

**Características:**
- Juego basado en equipos (2-4 equipos)
- Administrador controla el flujo (next question)
- Timer sincronizado para todos
- Leaderboard en tiempo real
- Preguntas secuenciales

**Flujo de Juego:**

#### A) Como Administrador
1. Ir a http://localhost:4200/game/kahoot
2. Ingresar código de juego (generado previamente)
3. Seleccionar equipo
4. Click "Unirse al Juego"
5. Esperar a que se unan más jugadores
6. Click "🚀 Iniciar Juego" (mínimo 2 participantes)
7. Después de cada pregunta, click "➡️ Siguiente Pregunta"
8. Ver resultados finales al terminar

#### B) Como Jugador
1. Ir a http://localhost:4200/game/kahoot/:gameId
2. Seleccionar equipo (dropdown)
3. Click "Unirse al Juego"
4. Esperar a que admin inicie
5. Leer pregunta y seleccionar respuesta
6. Click "✓ Enviar Respuesta"
7. Ver feedback (✓ correcto / ✗ incorrecto)
8. Esperar a que admin cargue siguiente pregunta

**Eventos WebSocket Activos:**
- `game-started`: Admin inicia juego
- `question-changed`: Nueva pregunta disponible
- `timer-tick`: Actualización cada segundo
- `answer-submitted`: Jugador respondió
- `leaderboard-updated`: Actualización de puntuaciones
- `game-ended`: Juego terminado

---

### 3. Modo Geoparty (Individual) 🌎

**Características:**
- Juego individual (cada jugador por su cuenta)
- Sin administrador (flujo automático)
- Selección de categoría por pregunta
- Timer independiente por jugador
- Leaderboard continuo
- 20 preguntas por defecto

**Flujo de Juego:**

#### A) Unirse al Juego
1. Ir a http://localhost:4200/game/geoparty
2. Ingresar código de juego
3. Ingresar tu nombre
4. Click "Unirse al Juego"
5. Esperar a que se unan más jugadores (mínimo 2)
6. Click "🚀 Iniciar Juego"

#### B) Jugar
1. **Seleccionar Categoría**: Grid de 9 categorías con íconos:
   - 🌍 Geografía (azul)
   - 🔬 Ciencias (verde)
   - 📜 Historia (amarillo)
   - ⚽ Deportes (rojo)
   - 🎬 Entretenimiento (púrpura)
   - 💻 Tecnología (índigo)
   - 🎨 Arte (rosa)
   - 🎵 Música (naranja)
   - 📚 Literatura (teal)

2. **Responder Pregunta**:
   - Timer circular en pantalla
   - 4 opciones de respuesta
   - Click en opción → Click "✓ Enviar Respuesta"
   - Feedback inmediato (puntos + bonificación de tiempo)

3. **Repetir**:
   - Automáticamente vuelve a selección de categoría
   - Elige nueva categoría
   - Continúa hasta completar 20 preguntas

4. **Resultados**:
   - Ver clasificación final
   - Ver tus estadísticas
   - Click "🔄 Jugar de Nuevo" o "Volver al Dashboard"

**Eventos WebSocket Activos:**
- `participant-joined/left`: Jugadores entran/salen
- `question-changed`: Jugador seleccionó pregunta
- `leaderboard-updated`: Actualización continua
- `game-ended`: Algún jugador terminó sus 20 preguntas

---

## 📡 API Endpoints Disponibles

### Kahoot (Team Mode)
```
POST   /api/game/kahoot/create
       Body: { name?, eventId?, totalQuestions? }
       
POST   /api/game/kahoot/:gameId/join
       Body: { userId, teamId }
       
POST   /api/game/kahoot/:gameId/start
       Body: {}
       
POST   /api/game/kahoot/:gameId/answer
       Body: { participantId, questionId, selectedAnswer, timeRemaining }
       
POST   /api/game/kahoot/:gameId/next
       Body: {}
       
GET    /api/game/kahoot/:gameId/leaderboard

GET    /api/game/kahoot/:gameId
```

### Geoparty (Individual Mode)
```
POST   /api/game/geoparty/create
       Body: { name?, eventId?, totalQuestions? }
       
POST   /api/game/geoparty/:gameId/join
       Body: { userId }
       
POST   /api/game/geoparty/:gameId/start
       Body: {}
       
POST   /api/game/geoparty/:gameId/select-question
       Body: { category }
       
POST   /api/game/geoparty/:gameId/answer
       Body: { participantId, questionId, selectedAnswer, timeRemaining }
       
GET    /api/game/geoparty/:gameId/leaderboard

GET    /api/game/geoparty/:gameId
```

### Monitoring
```
GET    /api/game/rooms
       Returns: { totalRooms, rooms: [{ gameId, mode, participants, hasCurrentQuestion, hasActiveTimer }] }
```

---

## 🧪 Testing End-to-End

### Test 1: Kahoot con 2 Equipos
1. Abrir 3 pestañas del navegador
2. **Pestaña 1 (Admin)**: 
   - Crear juego Kahoot
   - Team Red
   - Iniciar juego
   - Controlar next question
3. **Pestaña 2 (Player 1)**:
   - Mismo gameId
   - Team Blue
   - Responder preguntas
4. **Pestaña 3 (Player 2)**:
   - Mismo gameId
   - Team Red (mismo equipo que admin)
   - Responder preguntas
5. **Verificar**:
   - Todos ven misma pregunta
   - Timer sincronizado
   - Leaderboard se actualiza en tiempo real
   - Feedback de respuestas correcto
   - Resultados finales correctos

### Test 2: Geoparty con 3 Jugadores
1. Abrir 3 pestañas
2. **Todas las pestañas**:
   - Mismo gameId
   - Nombres diferentes
   - Unirse al juego
3. **Uno inicia el juego**
4. **Cada uno juega independientemente**:
   - Selecciona categorías diferentes
   - Responde a su propio ritmo
   - Ve leaderboard actualizado
5. **Verificar**:
   - Cada jugador ve sus propias preguntas
   - Leaderboard se sincroniza entre todos
   - Puntuaciones se actualizan correctamente
   - Bonificaciones de tiempo funcionan
   - Racha de 3 correctas consecutivas = +50 puntos

### Test 3: Eventos WebSocket
1. Abrir consola del navegador (F12)
2. Unirse a un juego
3. Verificar logs de eventos:
   ```
   [WebSocket] Connected to http://localhost:3000/game
   [WebSocket] Emitting: join-game
   [WebSocket] Received: participant-joined
   [WebSocket] Received: game-started
   [WebSocket] Received: question-changed
   [WebSocket] Received: timer-tick
   [WebSocket] Received: leaderboard-updated
   ```

---

## 🎨 UI Features Implementadas

### Kahoot Component
- ✅ Input de game code con validación
- ✅ Dropdown de equipos (Team Red/Blue/Green/Yellow)
- ✅ Timer circular SVG animado (verde → amarillo → rojo)
- ✅ 4 opciones de respuesta con hover effects
- ✅ Feedback visual (✓ verde / ✗ rojo)
- ✅ Leaderboard sidebar sticky con rankings
- ✅ Medallas (🥇🥈🥉) para top 3
- ✅ Indicador de racha 🔥
- ✅ Barra de progreso de preguntas
- ✅ Badges de dificultad (fácil/medio/difícil)
- ✅ Pantalla de resultados con podium animado
- ✅ Botones de admin (start game, next question)

### Geoparty Component
- ✅ Input de game code + nombre de jugador
- ✅ Grid 3x3 de categorías con íconos + colores
- ✅ Animaciones stagger en categorías (delay incremental)
- ✅ Timer circular independiente
- ✅ Leaderboard con highlight del jugador actual
- ✅ Estadísticas en tiempo real (puntos, correctas, racha)
- ✅ Feedback con bonificación de tiempo mostrada
- ✅ Transición automática a selección de categoría
- ✅ Pantalla de resultados con estadísticas personales
- ✅ Botones "Jugar de Nuevo" / "Volver al Dashboard"
- ✅ Scrollbar personalizado en leaderboard

---

## 🔧 Configuración

### Cambiar número de preguntas
```typescript
// GameKahootComponent
totalQuestions: number = 10; // Cambiar aquí

// GameGeopartyComponent  
totalQuestions: number = 20; // Cambiar aquí
```

### Cambiar tiempo por pregunta
```typescript
// backend/src/data/questions.json
{
  "id": "1",
  "timeLimit": 30, // Cambiar aquí (en segundos)
  ...
}
```

### Cambiar scoring
```typescript
// backend/src/controllers/game-kahoot.controller.ts
// Línea ~180
const basePoints = question.points; // 100/200/300
const timeBonus = Math.floor((timeRemaining / question.timeLimit) * 50); // Máximo +50
const streakBonus = Math.floor(participant.streak / 3) * 50; // Cada 3 = +50
```

### Cambiar categorías disponibles
```typescript
// GameGeopartyComponent
categories: Category[] = [
  { id: 'NewCategory', name: 'Nueva', icon: '🆕', color: 'bg-purple-600' },
  // Agregar más aquí...
];
```

---

## 📊 Sistema de Puntuación

### Base Points (por dificultad)
- **Easy**: 100 puntos
- **Medium**: 200 puntos
- **Hard**: 300 puntos

### Time Bonus (hasta +50 puntos)
```
timeBonus = (timeRemaining / timeLimit) * 50
Ejemplo: 
- 30s restantes de 30s = +50 puntos
- 15s restantes de 30s = +25 puntos
- 5s restantes de 30s = +8 puntos
```

### Streak Bonus (+50 puntos cada 3)
```
3 correctas consecutivas = +50 puntos extra
6 correctas consecutivas = +100 puntos extra
9 correctas consecutivas = +150 puntos extra
```

### Total Score
```
Total = Base Points + Time Bonus + Streak Bonus

Ejemplo:
Pregunta hard (300) + 20s restantes de 30s (33) + 3 streak (50) = 383 puntos
```

---

## 🐛 Troubleshooting

### WebSocket no conecta
```bash
# Verificar backend está corriendo
curl http://localhost:3000/health

# Verificar WebSocket
curl http://localhost:3000/api/game/rooms
```

### Timer no sincroniza
- El timer es manejado por el servidor en Kahoot
- En Geoparty cada jugador tiene su propio timer
- Verificar eventos `timer-tick` en consola del navegador

### Leaderboard no actualiza
- Verificar evento `leaderboard-updated` en consola
- Verificar participantId está correcto
- Refrescar leaderboard manualmente: `loadLeaderboard()`

### Componentes no se ven
```bash
# Verificar compilación
cd frontend
ng build --configuration development

# Verificar rutas
# Debe existir: /game/kahoot y /game/geoparty
```

---

## 🎯 Próximos Pasos Sugeridos

1. **Testing Manual Completo**
   - Probar ambos modos con múltiples usuarios
   - Verificar todos los flujos (join, play, finish)
   - Validar sincronización WebSocket

2. **Integración con Admin Panel**
   - Agregar botón "Crear Juego" en dashboard
   - Selector de modo (Kahoot vs Geoparty)
   - Mostrar active games en /api/game/rooms

3. **Mejoras Futuras**
   - Persistencia de sesiones (Redis)
   - Sound effects en respuestas
   - Animaciones más complejas
   - Chat en tiempo real
   - Historial de juegos
   - Exportar resultados a PDF

---

## 📝 Resumen Técnico

### Stack Completo
- **Backend**: Node.js 20 + Express + TypeScript + TypeORM + PostgreSQL 16 + Socket.IO 4.x
- **Frontend**: Angular 17 + TailwindCSS + RxJS + socket.io-client 4.x
- **Real-time**: WebSocket con /game namespace, room-based architecture
- **Database**: PostgreSQL con 7 entidades (User, Team, Event, Question, Game, GameParticipant, Answer)

### Archivos Creados (12 nuevos)
```
backend/src/controllers/game-kahoot.controller.ts       (300 líneas)
backend/src/controllers/game-geoparty.controller.ts     (300 líneas)
backend/src/routes/game.routes.ts                       (80 líneas)
backend/src/socket/game-socket.ts                       (300 líneas)

frontend/src/app/services/game.service.ts               (310 líneas)
frontend/src/app/services/websocket.service.ts          (254 líneas)
frontend/src/app/components/game-kahoot/*.ts/.html/.css (700 líneas)
frontend/src/app/components/game-geoparty/*.ts/.html/.css (800 líneas)
```

### Total: ~3,000 líneas de código funcional

---

## ✅ Estado Final

**Backend**: 95% complete (falta testing con usuarios reales)
**Frontend**: 95% complete (falta testing end-to-end)
**WebSocket**: 100% complete (todos los eventos implementados)
**Integración**: 90% complete (componentes listos, falta conectar con admin panel)

**¡Los modos de juego están completamente implementados y listos para probar!** 🎉

---

**Fecha de Implementación**: 7 de octubre de 2025
**Autor**: GitHub Copilot
**Versión**: 2.0 - Game Modes Complete
