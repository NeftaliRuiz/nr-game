# 🔍 Sopa de Letras - Modo de Juego Multijugador

## Descripción

El modo **Sopa de Letras (Word Search)** es un juego multijugador en tiempo real donde cada jugador recibe su propio tablero único con las mismas palabras escondidas. Los jugadores compiten para encontrar todas las palabras lo más rápido posible.

## Características Principales

### 🎮 Juego Multijugador
- Múltiples jugadores pueden unirse con un código de sala de 6 caracteres
- Cada jugador obtiene un tablero único generado aleatoriamente
- Las mismas palabras están escondidas en diferentes posiciones para cada jugador
- Competencia en tiempo real con podio actualizado dinámicamente

### 🏆 Podio en Tiempo Real
- **Top 3**: Visualización destacada de los 3 primeros lugares con medallas 🥇🥈🥉
- **Actualización automática**: El podio se actualiza conforme los jugadores encuentran palabras
- **Progreso individual**: Barra de progreso mostrando palabras encontradas/total
- **Tiempo de completado**: Muestra el tiempo exacto cuando un jugador termina

### 👥 Panel de Jugadores
- Lista de todos los participantes conectados
- Indicador del jugador actual (badge "Tú")
- Progreso en tiempo real de cada jugador
- Puntaje y cantidad de palabras encontradas

### ⏱️ Sistema de Puntuación
- **Puntos base**: 100 puntos por palabra encontrada
- **Bonus de tiempo**: Bonus adicional al completar todas las palabras rápidamente
  - Fórmula: `(timeLimit - timeElapsed) × 2`
- **Ejemplo**: Si completas en 120 segundos con límite de 300s:
  - Bonus = (300 - 120) × 2 = 360 puntos extra

### 🎯 Mecánica de Juego
- **Selección con mouse**: Click y arrastrar para seleccionar letras
- **8 direcciones**: Las palabras pueden estar en cualquier dirección:
  - Horizontal (izquierda/derecha)
  - Vertical (arriba/abajo)
  - Diagonal (4 direcciones)
- **Validación bidireccional**: Las palabras se detectan en ambos sentidos
- **Feedback visual**:
  - Azul: Letras seleccionadas actualmente
  - Verde: Letras de palabras ya encontradas
  - Gris: Letras sin seleccionar

## Arquitectura Técnica

### Backend (`backend/src/controllers/game-wordsearch.controller.ts`)

#### Algoritmo de Generación de Tableros
```typescript
function generateWordSearchGrid(words: string[], gridSize: number): string[][]
```
- Genera tablero NxN (configurable 10-20)
- Coloca palabras en 8 direcciones con detección de colisiones
- Rellena espacios vacíos con letras aleatorias (A-Z)
- Garantiza que cada palabra sea colocada exitosamente

#### Almacenamiento en Memoria
```typescript
const wordSearchGames: Map<string, {
  words: string[];
  gridSize: number;
  timeLimit: number;
  playerBoards: Map<string, {
    grid: string[][];
    foundWords: Set<string>;
    startTime?: number;
    endTime?: number;
  }>;
}>
```

#### Endpoints Implementados

1. **POST** `/api/game/wordsearch/create`
   - Crea una nueva sala de juego
   - Body: `{ words: string[], gridSize?: number, timeLimit?: number }`
   - Response: `{ roomCode: string, game: {...} }`

2. **POST** `/api/game/wordsearch/:roomCode/join`
   - Jugador se une a la sala
   - Body: `{ userId: string }`
   - Genera tablero único para el jugador
   - Response: `{ participantId: string }`

3. **POST** `/api/game/wordsearch/:roomCode/start`
   - Inicia el juego (solo host)
   - Emite evento WebSocket `game-started`
   - Inicia timer para todos los jugadores

4. **GET** `/api/game/wordsearch/:roomCode/grid/:participantId`
   - Obtiene el tablero del jugador
   - Response: `{ grid: string[][], words: string[], foundWords: string[] }`

5. **POST** `/api/game/wordsearch/:roomCode/submit-word`
   - Valida palabra encontrada
   - Body: `{ participantId: string, word: string }`
   - Calcula puntaje y actualiza leaderboard
   - Emite eventos WebSocket:
     - `word-found`: Notifica a todos los jugadores
     - `leaderboard-updated`: Actualiza podio en tiempo real

6. **GET** `/api/game/wordsearch/:roomCode/leaderboard`
   - Obtiene ranking actual
   - Ordenado por: puntaje DESC, palabras encontradas DESC
   - Response: Array de jugadores con rank, score, progress

7. **GET** `/api/game/wordsearch/:roomCode`
   - Detalles del juego
   - Response: Game info + lista de participantes

### Frontend (`frontend/src/app/components/game-wordsearch/`)

#### Componente Principal
```typescript
export class GameWordsearchComponent implements OnInit, OnDestroy
```

**Estados del Juego:**
- `WAITING`: Esperando que el host inicie
- `IN_PROGRESS`: Juego activo
- `FINISHED`: Juego terminado

**Gestión de Estado:**
- `grid: Cell[][]` - Tablero del jugador
- `words: string[]` - Palabras objetivo
- `foundWords: Set<string>` - Palabras encontradas
- `selectedCells: Cell[]` - Selección actual
- `leaderboard: Array<...>` - Podio en tiempo real
- `participants: Participant[]` - Lista de jugadores

#### Eventos WebSocket

**Recibidos:**
- `participant-joined`: Nuevo jugador se une
- `game-started`: Juego iniciado
- `word-found`: Otro jugador encontró una palabra
- `leaderboard-updated`: Actualización del podio
- `game-ended`: Juego terminado

**Emitidos:**
- `join-room`: Unirse a la sala
- `leave-room`: Salir de la sala

#### Interacción del Usuario

**Selección de Palabras:**
```typescript
onMouseDown(cell: Cell)  // Inicia selección
onMouseEnter(cell: Cell) // Extiende selección en línea recta
onMouseUp()              // Valida selección
```

**Validación:**
- Verifica que la selección sea una línea recta (horizontal/vertical/diagonal)
- Construye palabra de las celdas seleccionadas
- Comprueba palabra normal y reversa
- Envía al backend si es válida

## Uso

### Crear Juego

1. Navegar a `/game/wordsearch`
2. Ingresar palabras separadas por comas (mínimo 3)
   - Ejemplo: `ANGULAR, TYPESCRIPT, JAVASCRIPT, REACT, NODEJS`
3. Configurar tamaño del tablero (10-20)
4. Configurar tiempo límite (1-10 minutos)
5. Click en "🎮 Crear Juego"
6. Compartir código de sala con otros jugadores

### Unirse a Juego

1. Navegar a `/game/wordsearch/:roomCode`
2. O usar formulario de unión con código de 6 caracteres

### Jugar

1. Esperar que el host inicie el juego
2. Buscar palabras en el tablero
3. Click y arrastrar para seleccionar letras
4. Las palabras encontradas se marcan en verde
5. El podio se actualiza en tiempo real en el panel derecho
6. El juego termina cuando encuentras todas las palabras o se acaba el tiempo

## Características de UI

### Diseño Responsivo
- **Panel izquierdo (256px)**: Lista de jugadores conectados
- **Centro (flex-1)**: Tablero de juego y palabras
- **Panel derecho (320px)**: Podio en tiempo real

### Colores y Efectos
- **Gradiente de fondo**: Purple → Blue → Indigo
- **Tablero**: Backdrop blur con transparencia
- **Celdas**:
  - Seleccionadas: `bg-blue-500`
  - Encontradas: `bg-green-500`
  - Normal: `bg-white/10`
- **Hover effects**: Scale y color transitions
- **Animaciones**: Bounce para mensajes, smooth transitions para barras de progreso

### Medallas y Rankings
- 🥇 Primer lugar: Gradiente dorado, escala 110%, sombra destacada
- 🥈 Segundo lugar: Gradiente plata
- 🥉 Tercer lugar: Gradiente bronce
- Posiciones 4+: Número con emoji de posición

## Requisitos del Sistema

### Backend
- Node.js 16+
- TypeScript
- Express
- TypeORM
- PostgreSQL
- Socket.IO

### Frontend
- Angular 17
- TypeScript
- RxJS
- Tailwind CSS
- Socket.IO Client

## Comandos de Desarrollo

### Iniciar Backend
```bash
cd backend
npm run dev
# Corre en http://localhost:3001
```

### Iniciar Frontend
```bash
cd frontend
npm start
# Corre en http://localhost:4200
```

### Compilar Frontend
```bash
cd frontend
npm run build
```

## Rutas Configuradas

### Frontend Routing
```typescript
{ path: 'game/wordsearch', component: GameWordsearchComponent }
{ path: 'game/wordsearch/:roomCode', component: GameWordsearchComponent }
```

### API Endpoints
```
POST   /api/game/wordsearch/create
POST   /api/game/wordsearch/:roomCode/join
POST   /api/game/wordsearch/:roomCode/start
GET    /api/game/wordsearch/:roomCode/grid/:participantId
POST   /api/game/wordsearch/:roomCode/submit-word
GET    /api/game/wordsearch/:roomCode/leaderboard
GET    /api/game/wordsearch/:roomCode
```

## Próximas Mejoras

- [ ] Persistencia en base de datos (actualmente en memoria)
- [ ] Categorías de palabras predefinidas
- [ ] Niveles de dificultad automáticos
- [ ] Efectos de sonido al encontrar palabras
- [ ] Estadísticas históricas por jugador
- [ ] Chat en vivo entre jugadores
- [ ] Modo práctica individual
- [ ] Generador de palabras con IA
- [ ] Exportar/importar sets de palabras

## Créditos

Desarrollado como parte del proyecto TRIVIA-IASD
© 2025 - Modo de juego Sopa de Letras Multijugador
