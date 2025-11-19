# 🏗️ ARQUITECTURA Y PLAN DE MEJORAS - TRIVIA IASD

## 📊 ESTADO ACTUAL DEL SISTEMA

### ✅ Base de Datos (PostgreSQL)
El sistema YA TIENE las siguientes tablas creadas con TypeORM:

1. **events** - Eventos principales
   - Campos: id, name, description, startDate, endDate, status, isActive
   - Status: UPCOMING, ACTIVE, COMPLETED
   - Relaciones: questions[], games[], teams[]

2. **questions** - Preguntas de trivia
   - Vinculadas a eventos (eventId)
   - Incluye: question, category, difficulty, gameMode, round

3. **answers** - Respuestas de las preguntas
   - Vinculadas a preguntas (questionId)
   - Incluye: text, isCorrect

4. **games** - Juegos creados
   - Campos: id, name, mode (KAHOOT/GEOPARTY), status (WAITING/IN_PROGRESS/FINISHED)
   - Vinculado a evento (eventId)
   - Tracking: startedAt, finishedAt, usedQuestionIds

5. **teams** - Equipos por evento
   - Campos: id, name, icon, color, eventId
   - Vinculados a eventos
   - Relación con participants

6. **game_participants** - Participantes en juegos
   - Vincula: game + team
   - Tracking de score, streaks, time

7. **users** - Usuarios del sistema
   - Admin y usuarios regulares

### 🔄 COMPONENTES DUPLICADOS (Frontend)

#### Para EVENTOS:
1. **event-list + event-form** (Sistema VIEJO)
   - Ruta: `/admin/events`
   - Lista básica con CRUD simple
   - NO tiene gestión completa de status

2. **event-manager** (Sistema NUEVO) ⭐ RECOMENDADO
   - Ruta: `/admin/event-manager`
   - Gestión completa con status (UPCOMING, ACTIVE, COMPLETED)
   - UI mejorada

#### Para PREGUNTAS:
1. **question-list + question-form** (Sistema VIEJO)
   - Ruta: `/admin/questions`
   - Formulario básico sin filtros por evento

2. **question-manager-event** (Sistema NUEVO) ⭐ RECOMENDADO
   - Ruta: `/admin/question-manager-event`
   - Filtros por: evento, modo de juego (KAHOOT/GEOPARTY), ronda
   - UI mejorada con selección de evento

### ⚠️ PROBLEMAS IDENTIFICADOS

1. **Eventos no aparecen en dropdowns**
   - Backend devuelve: `{ data: { events: [...] } }`
   - Frontend espera: `{ data: [...] }`
   - YA SOLUCIONADO en question-manager-event y game-creator

2. **Sesión se pierde al recargar**
   - AuthGuard permite navegación si existe token
   - loadUserFromToken() es ASÍNCRONO
   - Usuario puede ver pantalla de login brevemente mientras carga

3. **NO existe gestión de equipos desde admin**
   - Tabla `teams` existe en BD
   - NO hay componente frontend para CRUD de equipos
   - NECESITA CREARSE

4. **Juegos NO se guardan en BD**
   - Tabla `games` existe
   - game-creator.component.ts NO guarda en BD
   - Juegos solo existen en memoria (se pierden al cerrar)
   - NECESITA IMPLEMENTARSE

5. **NO existe historial de juegos**
   - Backend tiene tabla `games` con status
   - NO hay componente para ver historial
   - NECESITA CREARSE

6. **Monitor en tiempo real incompleto**
   - Componente game-monitor existe
   - WebSockets configurados
   - Falta conectar con juegos persistentes
   - Podium no implementado

---

## 🎯 PLAN DE ACCIÓN

### FASE 1: Limpieza y Correcciones Inmediatas ✅

1. **Eliminar componentes obsoletos**
   - Remover event-list, event-form (usar solo event-manager)
   - Remover question-list, question-form (usar solo question-manager-event)
   - Limpiar rutas en app-routing.module.ts

2. **Corregir problema de sesión**
   - Modificar AuthGuard para esperar carga de usuario
   - Implementar loader mientras valida token

3. **Verificar carga de eventos**
   - Debug de por qué eventos NO aparecen
   - Verificar llamadas al backend

### FASE 2: Gestión de Equipos por Evento 🔧

1. **Crear componente team-manager**
   - CRUD de equipos vinculados a eventos
   - Formulario: nombre, icono, color
   - Lista de equipos por evento seleccionado

2. **Backend: endpoints de equipos**
   - GET /api/teams?eventId=xxx
   - POST /api/teams
   - PUT /api/teams/:id
   - DELETE /api/teams/:id

### FASE 3: Persistencia de Juegos 💾

1. **Modificar game-creator.component.ts**
   - Guardar juego en BD al crearlo
   - Generar código único del juego
   - Asociar con evento seleccionado

2. **Backend: endpoints de juegos**
   - POST /api/games (crear juego)
   - GET /api/games?eventId=xxx (listar por evento)
   - GET /api/games/:id (obtener juego específico)
   - PUT /api/games/:id/status (actualizar status)

3. **Crear componente game-history**
   - Lista de juegos creados
   - Filtros por evento
   - Ver detalles, código, participantes
   - Reactivar juegos (si status = WAITING)

### FASE 4: Monitor en Tiempo Real y Podium 📊

1. **Mejorar game-monitor.component.ts**
   - Conectar con juegos persistentes
   - WebSocket para actualizaciones en tiempo real
   - Mostrar scores de equipos/participantes

2. **Crear componente podium**
   - Top 3 equipos/jugadores
   - Animaciones de victoria
   - Exportar resultados

---

## 📝 ORDEN DE EJECUCIÓN RECOMENDADO

1. ✅ Corregir sesión (AuthGuard)
2. ✅ Debug eventos en dropdowns
3. 🔧 Crear team-manager (gestión de equipos)
4. 💾 Implementar persistencia de juegos
5. 📋 Crear historial de juegos
6. 📊 Mejorar monitor y crear podium

---

## 🚀 ESTADO ACTUAL DE IMPLEMENTACIÓN

- [✅] Base de datos con tablas correctas
- [✅] Entidades TypeORM configuradas
- [⚠️] Frontend con componentes duplicados
- [❌] Gestión de equipos no implementada
- [❌] Juegos no se guardan en BD
- [❌] Historial de juegos no existe
- [⚠️] Monitor en tiempo real parcial
- [❌] Podium no implementado

---

**Fecha de creación:** 7 de octubre de 2025
**Última actualización:** En progreso
