# 🎮 GUÍA COMPLETA DE USO - TRIVIA GAME

## 📋 ÍNDICE
1. [Flujo Completo del Sistema](#flujo-completo)
2. [Explicación de Menús](#explicación-de-menús)
3. [Cómo Crear y Jugar](#cómo-crear-y-jugar)
4. [Solución de Problemas](#solución-de-problemas)

---

## 🔄 FLUJO COMPLETO DEL SISTEMA

### PASO 1: CREAR EVENTO (Admin)
**Ruta**: `/admin/events`
- Crear un evento (ej: "Trivia Navideña 2025")
- **IMPORTANTE**: Cambiar status a "ACTIVE" o "UPCOMING"
- Los eventos con status "COMPLETED" NO aparecerán en creación de juegos

### PASO 2: CREAR PREGUNTAS (Admin)
**Ruta**: `/admin/question-manager`
- Crear preguntas vinculadas al evento
- **Seleccionar gameMode**: KAHOOT o GEOPARTY
- **Seleccionar ronda**: 1, 2, 3, etc.
- Las preguntas solo aparecen en el modo de juego correcto

### PASO 3: CREAR EQUIPOS (Admin) ⚠️ FALTA IMPLEMENTAR
**Ruta**: Actualmente NO EXISTE
- **PROBLEMA**: No hay interfaz para crear equipos
- **SOLUCIÓN TEMPORAL**: Los equipos se crean en el seed o directamente en BD

### PASO 4: CREAR JUEGO (Admin/Host)
**Ruta**: `/admin/game-creator`
- Seleccionar modo: KAHOOT o GEOPARTY
- Seleccionar evento (solo muestra ACTIVE/UPCOMING)
- Dar nombre al juego
- Al crear, aparece **CÓDIGO DE 6 CARACTERES** (ej: "7OSFKJ")
- **Este código es para que los jugadores se unan**

### PASO 5: UNIRSE AL JUEGO (Jugadores)
**Ruta**: `/game/join` o directamente con código
- Ingresar el código de 6 caracteres
- O hacer clic en "Juegos Disponibles" en game-creator
- Seleccionar usuario y equipo
- Click en "Unirse"

### PASO 6: INICIAR JUEGO (Admin/Host)
**Desde**: El componente de game-creator o el componente del juego
- Una vez que todos se unan
- Admin hace clic en "Iniciar Juego"
- El juego comienza para todos

### PASO 7: JUGAR
**Kahoot**: `/game/kahoot/[ROOMCODE]`
- Preguntas aparecen una por una
- Todos responden al mismo tiempo
- Se muestran puntos y ranking

**Geoparty**: `/game/geoparty/[ROOMCODE]`
- Seleccionar categoría
- Responder pregunta
- Sistema por turnos

---

## 📂 EXPLICACIÓN DE MENÚS

### `/admin/events` (RECOMENDADO)
- **Función**: CRUD completo de eventos
- **Características**: 
  - Crear eventos nuevos
  - Editar eventos existentes
  - Ver lista paginada
  - Cambiar status (UPCOMING, ACTIVE, COMPLETED)
- **Cuándo usar**: SIEMPRE para gestionar eventos

### `/admin/event-manager` (LEGACY - CONFUSO)
- **Función**: Vista antigua de eventos
- **Problema**: Interfaz menos clara, puede estar desactualizada
- **Recomendación**: **NO USAR**, usar `/admin/events` en su lugar

### `/admin/question-manager` (PRINCIPAL)
- **Función**: Crear preguntas por evento, modo y ronda
- **Características**:
  - Filtrar por evento, gameMode, ronda
  - Crear preguntas específicas para cada juego
  - Asignar categorías

### `/admin/game-creator` (PRINCIPAL)
- **Función**: Crear nuevos juegos (sesiones de Kahoot/Geoparty)
- **Características**:
  - Seleccionar modo de juego
  - Vincular a un evento
  - Generar código de sala
  - Ver juegos activos

### `/admin/stats` o `/admin/dashboard`
- **Función**: Ver estadísticas de juegos pasados
- **Características**:
  - Leaderboards
  - Historial de partidas
  - Estadísticas por usuario/equipo

---

## 🎯 CÓMO CREAR Y JUGAR - PASO A PASO

### CONFIGURACIÓN INICIAL (Admin - UNA VEZ)

```bash
# 1. Crear evento
Ir a: /admin/events
Click: "Nuevo Evento"
Nombre: "Trivia de Prueba"
Status: ACTIVE ← IMPORTANTE
Guardar

# 2. Crear preguntas
Ir a: /admin/question-manager
Filtro Evento: "Trivia de Prueba"
Filtro Modo: KAHOOT
Click: "Nueva Pregunta"
Llenar formulario
Guardar
(Crear al menos 10 preguntas)

# 3. Verificar que hay usuarios
Ir a: /admin/users (si existe)
O usar usuarios del seed:
- admin@trivia.com / Admin123!
- user1@trivia.com / User123!
- user2@trivia.com / User123!
```

### CREAR Y JUGAR UNA PARTIDA

```bash
# ADMIN/HOST:
1. Ir a: /admin/game-creator
2. Click en "KAHOOT"
3. Seleccionar evento: "Trivia de Prueba"
4. Nombre: "Partida 1"
5. Click "Crear Juego"
6. Copiar código (ej: "ABC123")
7. Compartir código con jugadores

# JUGADORES:
1. Ir a: /game/join
2. Ingresar código: "ABC123"
3. Seleccionar usuario
4. Seleccionar equipo (si aplica)
5. Click "Unirse"

# ADMIN (volver a game-creator):
1. Ver participantes unidos
2. Click "Iniciar Juego"
3. Todos son redirigidos a /game/kahoot/ABC123
4. ¡A JUGAR!
```

---

## 🐛 SOLUCIÓN DE PROBLEMAS

### ❌ "No veo eventos al crear juego"
**Causa**: Los eventos están en status "COMPLETED"
**Solución**: 
1. Ir a `/admin/events`
2. Editar el evento
3. Cambiar status a "ACTIVE"
4. Recargar game-creator

### ❌ "Error al unirse al juego"
**Causa**: Código incorrecto o juego ya terminado
**Solución**:
1. Verificar que el código sea correcto (6 caracteres)
2. Verificar que el juego esté en status "WAITING"
3. Ver consola del navegador para más detalles

### ❌ "Las preguntas no aparecen en el juego"
**Causa**: Las preguntas tienen gameMode incorrecto
**Solución**:
1. Ir a `/admin/question-manager`
2. Filtrar por el evento correcto
3. Verificar que gameMode coincida (KAHOOT para Kahoot)
4. Crear más preguntas si es necesario

### ❌ "No puedo crear equipos"
**Causa**: No hay interfaz de equipos implementada
**Solución TEMPORAL**:
```bash
# Opción 1: Usar seed
cd backend
npm run seed

# Opción 2: Crear directo en BD
docker exec trivia-postgres psql -U trivia_user -d trivia_db
INSERT INTO teams (id, name, "eventId", "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'Equipo Rojo', 'ID_DEL_EVENTO', NOW(), NOW());
```

### ❌ "Backend no responde"
**Solución**:
```bash
# Verificar procesos
lsof -ti:3000 || echo "Backend caído"

# Reiniciar backend
cd /Users/umidev/Desktop/TRIVIA-IASD/backend
npm run dev
```

---

## 🔧 MEJORAS PENDIENTES

### CRÍTICAS (Bloquean el uso):
1. **Crear interfaz de equipos** (`/admin/teams`)
2. **Arreglar error al unirse a juegos** (verificar roomCode)
3. **Botón claro "Iniciar Juego"** en game-creator después de crear

### IMPORTANTES (Mejoran UX):
1. **Eliminar o arreglar** `/admin/event-manager` (duplicado)
2. **Agregar instrucciones en pantalla** de game-creator
3. **Mostrar participantes en tiempo real** antes de iniciar
4. **Validar que haya preguntas** antes de crear juego

### OPCIONALES (Nice to have):
1. Dashboard con métricas
2. Chat en juego
3. Música de fondo
4. Animaciones de victoria

---

## 📞 SOPORTE

Si algo no funciona:
1. Revisar logs del backend: `tail -f backend/backend.log`
2. Revisar consola del navegador (F12)
3. Verificar que ambos servicios estén corriendo:
   ```bash
   lsof -ti:3000 && echo "Backend OK"
   lsof -ti:4200 && echo "Frontend OK"
   ```

---

**Última actualización**: 8 de octubre de 2025
