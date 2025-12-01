# 🎮 Guía Rápida - Juego Kahoot Trivia

## Arquitectura del Proyecto

```
TRIVIA-IASD/
├── backend/                 # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   │   └── game-kahoot.controller.ts   # Lógica del juego Kahoot
│   │   ├── data/
│   │   │   └── kahoot-questions.json       # Banco de preguntas
│   │   ├── entities/                       # Modelos TypeORM
│   │   ├── routes/
│   │   │   └── game.routes.ts              # Rutas API
│   │   └── socket/
│   │       └── game-socket.ts              # WebSocket tiempo real
│   └── package.json
│
├── frontend/                # Angular 17 + TailwindCSS
│   ├── src/app/
│   │   ├── components/
│   │   │   ├── game-kahoot-host/           # Vista del Presentador
│   │   │   └── game-kahoot-player/         # Vista del Jugador
│   │   ├── services/
│   │   │   ├── game.service.ts             # HTTP API client
│   │   │   └── websocket.service.ts        # WebSocket client
│   │   └── app-routing.module.ts           # Rutas
│   └── package.json
```

## 🚀 Cómo Ejecutar el Proyecto

### 1. Instalar Dependencias

```bash
# Desde la raíz del proyecto
npm run install-all

# O instalar por separado:
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configurar Base de Datos (PostgreSQL)

Crea un archivo `.env` en `/backend`:

```env
PORT=3000
DATABASE_URL=postgresql://usuario:password@localhost:5432/trivia_db
JWT_SECRET=tu_secreto_jwt
```

### 3. Ejecutar en Desarrollo

```bash
# Ejecutar ambos servidores (recomendado)
npm run dev

# O por separado en dos terminales:
cd backend && npm run dev     # Backend en http://localhost:3000
cd frontend && npm start      # Frontend en http://localhost:4200
```

## 🎯 Flujo del Juego

### Para el Presentador (Host)

1. Ir a: `http://localhost:4200/game/kahoot/host`
2. Configurar el nombre del juego y número de preguntas
3. Clic en **"Crear Juego"**
4. Compartir el código PIN con los jugadores
5. Cuando todos estén conectados, clic en **"Iniciar Juego"**
6. Controlar el flujo: mostrar pregunta → ver respuestas → leaderboard → siguiente

### Para los Jugadores

1. Ir a: `http://localhost:4200/game/kahoot/play`
2. Ingresar el código PIN proporcionado por el presentador
3. Escribir su nombre
4. Clic en **"Entrar"**
5. Esperar que inicie el juego
6. Cuando aparezca la pregunta, tocar el botón del color correspondiente
7. Ver resultados y esperar la siguiente pregunta

## 📱 URLs Importantes

| Ruta | Descripción |
|------|-------------|
| `/game/kahoot/host` | Vista del presentador para crear y controlar juegos |
| `/game/kahoot/play` | Vista del jugador para unirse |
| `/game/kahoot/join/:PIN` | Unirse directamente con código PIN |

## 🔌 API Endpoints

### Kahoot Game

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/game/kahoot/create` | Crear nuevo juego |
| POST | `/api/game/kahoot/:code/join-guest` | Unirse como invitado |
| POST | `/api/game/kahoot/:code/start` | Iniciar juego |
| POST | `/api/game/kahoot/:code/answer` | Enviar respuesta |
| POST | `/api/game/kahoot/:code/next` | Siguiente pregunta |
| GET | `/api/game/kahoot/:code/leaderboard` | Obtener clasificación |
| GET | `/api/game/kahoot/:code` | Estado del juego |

## 📊 Sistema de Puntuación

- **Respuesta correcta**: Puntos base según dificultad (100-200 pts)
- **Bonus por velocidad**: Hasta +50 pts según tiempo restante
- **Racha**: +50 pts extra cada 3 respuestas correctas seguidas

## 🎨 Colores de las Opciones

| Color | Símbolo | Posición |
|-------|---------|----------|
| 🔴 Rojo | ▲ | Opción A |
| 🔵 Azul | ◆ | Opción B |
| 🟡 Amarillo | ● | Opción C |
| 🟢 Verde | ■ | Opción D |

## 🔧 Configuración WebSocket

El servidor WebSocket se conecta en el namespace `/game` y maneja:

- `join-game`: Unirse a una sala
- `game-started`: Notificación de inicio
- `question-changed`: Nueva pregunta
- `timer-tick`: Actualización del temporizador
- `answer-submitted`: Respuesta enviada
- `leaderboard-updated`: Actualización de clasificación
- `game-ended`: Fin del juego

## 📝 Banco de Preguntas

Las preguntas se encuentran en:
- `backend/src/data/kahoot-questions.json`

Formato de pregunta:
```json
{
  "id": "kg001",
  "category": "cultura_general",
  "difficulty": "facil",
  "points": 100,
  "question": "¿Cuál es...?",
  "options": ["A", "B", "C", "D"],
  "correctAnswer": 1,
  "timeLimit": 20
}
```

## 🛠 Solución de Problemas

### El juego no conecta
- Verificar que el backend esté corriendo en el puerto 3000
- Verificar la URL del WebSocket en `environment.ts`

### No se muestran las preguntas
- Verificar que la base de datos tenga preguntas cargadas
- Revisar la consola del backend por errores

### Errores de CORS
- El backend tiene CORS habilitado para todos los orígenes en desarrollo
- En producción, configurar orígenes específicos

## 📦 Despliegue

### Backend (Railway/Render)
1. Conectar repositorio Git
2. Configurar variables de entorno
3. Deploy automático

### Frontend (Hostinger/Netlify)
1. Compilar: `ng build --configuration=production`
2. Subir contenido de `dist/trivia-frontend` a la raíz
3. Agregar `.htaccess` para rutas SPA

---

¡Disfruta del juego! 🎉
