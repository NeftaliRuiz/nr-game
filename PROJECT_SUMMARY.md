# 📊 Resumen del Proyecto - Trivia Game

## 🎯 Visión General

**Trivia Game** es una aplicación web full-stack de juego de preguntas y respuestas diseñada para eventos, clases y competencias. Soporta modo individual y por equipos, con múltiples categorías, sistema de puntuación dinámico y tabla de posiciones en tiempo real.

## 🏗️ Arquitectura Técnica

### Stack Tecnológico

**Frontend:**
- Angular 17 (Framework)
- TypeScript 5.2 (Lenguaje)
- TailwindCSS 3.3 (Estilos)
- RxJS (Gestión de estado reactivo)
- Angular Animations (Efectos visuales)

**Backend:**
- Node.js 20+ (Runtime)
- Express 4.18 (Framework web)
- TypeScript 5.3 (Lenguaje)
- CORS (Middleware)

**Infraestructura:**
- Almacenamiento: In-memory Map (desarrollo), PostgreSQL/MongoDB (producción)
- API: REST JSON
- Comunicación: HTTP

### Patrones de Diseño

1. **MVC**: Separación de controladores, modelos y vistas
2. **Service Layer**: Lógica de negocio encapsulada en servicios
3. **Observable Pattern**: RxJS para gestión de estado asíncrono
4. **Component-Based**: Arquitectura modular de Angular

## 📁 Estructura del Código

```
TRIVIA-IASD/
├── backend/              # API REST Node.js + Express
│   ├── src/
│   │   ├── controllers/  # Lógica de negocio
│   │   ├── routes/       # Endpoints API
│   │   ├── data/         # Base de datos JSON
│   │   └── server.ts     # Punto de entrada
│   └── package.json
├── frontend/             # SPA Angular + Tailwind
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/  # UI components
│   │   │   ├── services/    # API clients
│   │   │   └── models/      # TypeScript interfaces
│   │   ├── styles.css
│   │   └── main.ts
│   └── package.json
├── .github/
│   └── copilot-instructions.md  # AI agent guidance
├── README.md             # Documentación principal
├── QUICKSTART.md         # Guía rápida
├── DEPLOYMENT.md         # Guía de despliegue
├── CONTRIBUTING.md       # Guía de contribución
└── package.json          # Scripts root
```

## 🎮 Flujo de Datos

```
1. Setup
   Usuario → Frontend (crear equipos)
   Frontend → POST /api/trivia/sessions → Backend
   Backend → Crear sesión en memoria → Retornar sessionId

2. Juego
   Frontend → GET /api/trivia/questions/random → Backend
   Backend → Seleccionar pregunta aleatoria → Retornar pregunta
   Usuario → Seleccionar respuesta → Frontend
   Frontend → POST /api/trivia/validate → Backend
   Backend → Validar y calcular puntos → Retornar resultado
   Frontend → PUT /api/trivia/sessions/:id/score → Backend
   Backend → Actualizar puntaje del equipo → Retornar sesión actualizada

3. Resultados
   Frontend → GET /api/trivia/sessions/:id/leaderboard → Backend
   Backend → Ordenar equipos por puntaje → Retornar ranking
```

## 🔧 Características Implementadas

### Core Features
- ✅ Modo individual y por equipos
- ✅ 6 categorías (Cultura, Ciencia, Biblia, Historia, Deportes, Música)
- ✅ 18 preguntas de ejemplo
- ✅ 3 niveles de dificultad (fácil, medio, difícil)
- ✅ Sistema de puntuación con bonificaciones
- ✅ Temporizador circular visual (20 segundos)
- ✅ Tabla de posiciones en tiempo real
- ✅ Racha de respuestas correctas
- ✅ Retroalimentación visual inmediata

### UI/UX
- ✅ Diseño responsive (mobile-first)
- ✅ Tema oscuro con gradientes
- ✅ Animaciones suaves (fade, slide, bounce)
- ✅ Glassmorphism effects
- ✅ Iconos emoji nativos
- ✅ Personalización de equipos (nombre, color, ícono)

### API
- ✅ RESTful endpoints
- ✅ CORS habilitado
- ✅ Validación de respuestas
- ✅ Gestión de sesiones
- ✅ Health check endpoint

## 📈 Algoritmo de Puntuación

```typescript
// Puntos base según dificultad
easy: 100 pts
medium: 200 pts
hard: 300 pts

// Bonificación por velocidad
timeBonus = (timeRemaining / timeLimit) * 50
// Máximo +50 puntos

// Bonificación por racha
if (correctAnswersInRow % 3 === 0) {
  streakBonus = 50 pts
}

// Total
totalPoints = basePoints + timeBonus + streakBonus
```

## 🚀 Comandos Disponibles

### Desarrollo
```bash
npm run install-all     # Instalar todas las dependencias
npm run dev             # Ejecutar ambos servidores
npm run dev:backend     # Solo backend (port 3000)
npm run dev:frontend    # Solo frontend (port 4200)
```

### Producción
```bash
npm run build           # Construir ambos proyectos
npm run build:backend   # Construir backend
npm run build:frontend  # Construir frontend
npm start               # Iniciar ambos servidores
```

### Utilidades
```bash
./setup.sh              # Script de instalación (Linux/Mac)
setup.bat               # Script de instalación (Windows)
```

## 🎨 Guía de Estilos

### Colores del Tema
- Primary: `#3B82F6` (Azul)
- Secondary: `#8B5CF6` (Púrpura)
- Success: `#10B981` (Verde)
- Danger: `#EF4444` (Rojo)
- Warning: `#F59E0B` (Naranja)

### Tipografía
- Font: System fonts (native)
- Tamaños: 1rem base, scale 1.25

### Espaciado
- Grid: 8px base unit
- Container: max-width 1280px

## 🔐 Seguridad

### Consideraciones Actuales
- ❌ Sin autenticación (no requerido para MVP)
- ❌ Sin persistencia de datos (in-memory storage)
- ✅ CORS configurado
- ✅ Validación de entrada en backend
- ✅ TypeScript strict mode

### Para Producción
- [ ] Implementar rate limiting
- [ ] Agregar validación de datos más robusta
- [ ] Considerar autenticación para admin panel
- [ ] Implementar base de datos persistente
- [ ] Configurar HTTPS
- [ ] Agregar logging estructurado

## 📊 Métricas del Proyecto

### Líneas de Código (aprox.)
- Backend: ~400 líneas
- Frontend: ~1,200 líneas
- Total: ~1,600 líneas

### Archivos Creados
- Backend: 7 archivos
- Frontend: 15 archivos
- Documentación: 8 archivos
- Total: 30+ archivos

### Componentes Angular
1. GameBoardComponent (principal)
2. QuestionCardComponent
3. ScoreboardComponent
4. TimerComponent

### Endpoints API
- `GET /health`
- `GET /api/trivia/categories`
- `GET /api/trivia/questions/category/:category`
- `GET /api/trivia/questions/random`
- `POST /api/trivia/validate`
- `POST /api/trivia/sessions`
- `GET /api/trivia/sessions/:sessionId`
- `PUT /api/trivia/sessions/:sessionId/score`
- `GET /api/trivia/sessions/:sessionId/leaderboard`

## 🔮 Roadmap Futuro

### Fase 2 (Corto Plazo)
- [ ] Panel de administración para gestionar preguntas
- [ ] Persistencia en base de datos
- [ ] Sonidos de respuesta correcta/incorrecta
- [ ] Modo multijugador online
- [ ] Historial de partidas

### Fase 3 (Mediano Plazo)
- [ ] Autenticación de usuarios
- [ ] Perfiles de jugador con estadísticas
- [ ] Torneos y ligas
- [ ] Categorías personalizadas
- [ ] Importar/exportar preguntas (CSV)

### Fase 4 (Largo Plazo)
- [ ] Modo PWA offline
- [ ] Chat en tiempo real durante partidas
- [ ] Integración con redes sociales
- [ ] Leaderboards globales
- [ ] Sistema de logros y badges

## 🤝 Contribuciones

El proyecto acepta contribuciones en:
- 🐛 Corrección de bugs
- ✨ Nuevas características
- 📝 Mejoras en documentación
- 🎨 Mejoras de UI/UX
- 📊 Agregar preguntas al banco

Ver `CONTRIBUTING.md` para guía detallada.

## 📄 Licencia

ISC License - Ver `LICENSE` para detalles.

## 👥 Créditos

Desarrollado como proyecto educativo para eventos de trivia interactivos.

---

**Última actualización**: Octubre 2024  
**Versión**: 1.0.0  
**Estado**: Producción lista (MVP)
