# 📚 Guía Completa de Administración - Trivia IASD

## 🔐 Credenciales de Acceso

### Usuario Administrador
- **Email:** `admin@trivia.com`
- **Contraseña:** `admin123`
- **URL de Login:** `http://10.45.3.141:4200/admin/login` o `http://localhost:4200/admin/login`

### Usuario de Prueba (opcional)
- **Email:** `user@trivia.com`
- **Contraseña:** `user123`

---

## 🎯 Problemas Resueltos en esta Sesión

### ✅ 1. Login y Sesión
**Problema:** No podías iniciar sesión y te sacaba al recargar
**Solución:** 
- El sistema ahora mantiene la sesión con JWT en localStorage
- AuthGuard verifica el token antes de cargar datos del usuario
- Token expira en 7 días

**Cómo usar:**
1. Ve a `/admin/login`
2. Ingresa `admin@trivia.com` / `admin123`
3. Se redirige automáticamente al dashboard

### ✅ 2. Texto Blanco en Respuestas  
**Problema:** Las opciones de respuesta no se veían (texto blanco en fondo blanco)
**Solución:** Agregué clases `text-gray-800 font-medium` a las opciones

### ✅ 3. Creación de Eventos
**Problema:** No se podían crear eventos
**Solución:** 
- Backend esperaba `startDate`, `endDate`, `status` 
- Frontend enviaba `date`, `isActive`
- Corregí los campos del formulario

**Nuevo formulario incluye:**
- Fecha de Inicio (obligatorio)
- Fecha de Fin (opcional)
- Estado: Próximamente / Activo / Completado

### ✅ 4. Eventos en Dropdowns
**Problema:** Eventos creados no aparecían en los dropdowns de preguntas/juegos
**Solución:** El servicio ahora usa `environment.apiUrl` correctamente

### ✅ 5. Juegos Múltiples Simultáneos
**Problema:** Al crear un juego nuevo, desaparecía el anterior
**Solución:** Ahora puedes tener Kahoot Y Geoparty al mismo tiempo

### ✅ 6. Letras A, B, C, D Invisibles
**Problema:** Al editar preguntas, las letras de opciones no se veían
**Solución:** Agregué badges azules con letras antes de cada opción

### ✅ 7. Jugar sin Login
**Problema:** Error "Por favor ingresa tu nombre" impedía jugar
**Solución:** Ahora se genera un ID de invitado automáticamente

---

## 📋 Gestión de Eventos

### ¿Qué son los Eventos?
Los eventos son contenedores para organizar preguntas por temática o fecha.
Ejemplo: "Trivia Bíblica 2025", "Semana de Oración", "Campamento Juvenil"

### ¿Por qué hay DOS secciones de Eventos?

**1. Event Manager (`/admin/events`)** - Gestión CRUD
- Crear, editar, eliminar eventos
- Configurar nombre, descripción, fechas, estado
- Ver estadísticas de equipos y preguntas asociadas

**2. Question Manager Event (`/admin/questions-event`)** - Preguntas por Evento
- Filtrar preguntas por evento, modo de juego, ronda
- Crear preguntas específicas para un evento
- Organizar contenido por categorías dentro de cada evento

**Flujo recomendado:**
1. Crear el evento en Event Manager
2. Crear preguntas para ese evento en Question Manager Event
3. Crear juego seleccionando el evento en Game Creator

### Crear un Evento Paso a Paso

1. **Ir a Event Manager**
   ```
   http://10.45.3.141:4200/admin/events
   ```

2. **Click en "✨ Crear Nuevo Evento"**

3. **Llenar el formulario:**
   - **Nombre:** "Trivia Bíblica Jóvenes 2025"
   - **Descripción:** "Preguntas sobre el Antiguo y Nuevo Testamento"
   - **Fecha de Inicio:** 2025-10-15
   - **Fecha de Fin:** 2025-10-20 (opcional)
   - **Estado:** Activo

4. **Click en "✨ Crear Evento"**

5. **Verificar:** El evento aparece en la lista con badge verde "ACTIVO"

---

## 📝 Gestión de Preguntas

### Crear Preguntas para un Evento

1. **Ir a Question Manager Event**
   ```
   http://10.45.3.141:4200/admin/questions-event
   ```

2. **Click en "✨ Crear Nueva Pregunta"**

3. **Llenar el formulario:**
   - **Evento:** Seleccionar "Trivia Bíblica Jóvenes 2025"
   - **Modo de Juego:** Kahoot o Geoparty
   - **Pregunta:** "¿Cuántos días estuvo Jonás dentro del pez?"
   - **Categoría:** Historia
   - **Dificultad:** Fácil / Media / Difícil
   - **Ronda:** 1 (para organizar secuencias)
   - **Puntos:** 100
   - **Tiempo Límite:** 30 segundos

4. **Opciones de Respuesta:**
   - Verás badges azules con letras: **[A]** **[B]** **[C]** **[D]**
   - **[A]** Un día
   - **[B]** Dos días
   - **[C]** Tres días ✓ (seleccionar radio button)
   - **[D]** Siete días

5. **Click en "✨ Crear Pregunta"**

### Editar/Eliminar Preguntas

- **Editar:** Click en botón azul "✏️ Editar"
- **Eliminar:** Click en botón rojo "🗑️ Eliminar"
- **Filtrar:** Usa los filtros de Evento, Modo, Ronda para encontrar preguntas

---

## 👥 Gestión de Equipos y Usuarios

### Crear Equipos (para modo Kahoot)

**Actualmente los equipos se crean automáticamente** cuando los jugadores se unen a un juego Kahoot:

1. Los jugadores eligen su equipo del dropdown:
   - Team Red
   - Team Blue
   - Team Green
   - Team Yellow

2. El sistema registra la participación automáticamente

### Crear Usuarios Concursantes

**Opción 1: Sin Login (Invitados)**
- Los jugadores solo necesitan:
  - **Kahoot:** Código del juego + Seleccionar equipo
  - **Geoparty:** Código del juego + Escribir su nombre
- El sistema genera un ID único automáticamente

**Opción 2: Con Login (Registro)**
**PENDIENTE DE IMPLEMENTAR** - Por ahora usa el modo invitado

Para agregar esta funcionalidad necesitarías:
1. Página de registro pública
2. Endpoint `/api/auth/register` en el backend
3. Formulario con: nombre, email, contraseña

---

## 🎮 Crear y Gestionar Juegos

### Crear un Juego Nuevo

1. **Ir a Game Creator**
   ```
   http://10.45.3.141:4200/admin/game-creator
   ```

2. **Seleccionar Modo:**
   - **🎯 Kahoot:** Modo equipos, control del admin, sincronizado
   - **🌎 Geoparty:** Modo individual, selección de categorías

3. **Configurar el Juego:**
   - **Nombre:** "Trivia Viernes de Noche"
   - **Evento:** "Trivia Bíblica Jóvenes 2025" (opcional)
   - **Número de Preguntas:** 10 (Kahoot) o 20 (Geoparty)

4. **Click en "🚀 Crear Juego"**

5. **Resultado:**
   - Aparece tarjeta con el código del juego: **ABC123**
   - Botones: "🎮 Ir al Juego" y "📊 Monitor"
   - El juego se agrega a la lista de juegos activos

### Gestionar Múltiples Juegos

**Ahora puedes tener varios juegos activos simultáneamente:**

```
🎮 Juegos Activos (3)

┌─────────────────────────┐ ┌─────────────────────────┐
│ 🎯 Kahoot              │ │ 🌎 Geoparty            │
│ Trivia Viernes         │ │ Geografía Mundial      │
│ Código: ABC123         │ │ Código: XYZ789         │
│ [🎮 Ir] [📊 Monitor]   │ │ [🎮 Ir] [📊 Monitor]   │
└─────────────────────────┘ └─────────────────────────┘
```

- Cada juego tiene su propio código
- Los jugadores se unen con códigos diferentes
- Puedes monitorear cada juego independientemente

### Eliminar un Juego de la Lista

- Click en la **✕** en la esquina superior derecha de cada tarjeta
- Esto solo lo quita de tu vista, los jugadores pueden seguir jugando

---

## 📊 Dashboard y Estadísticas

### Ver Estadísticas en Tiempo Real

1. **Ir a Dashboard**
   ```
   http://10.45.3.141:4200/admin/dashboard
   ```

2. **Verás:**
   - Total de usuarios, preguntas, equipos, juegos
   - Gráficas de dificultad y categorías
   - Top 5 categorías más usadas
   - Juegos recientes con participantes

3. **Auto-refresh:** Se actualiza cada 30 segundos

---

## 🔧 Solución de Problemas Comunes

### ❌ "No puedo iniciar sesión"

**Verificar:**
1. Credenciales correctas: `admin@trivia.com` / `admin123`
2. Backend corriendo en puerto 3000
3. Frontend corriendo en puerto 4200
4. Consola del navegador (F12) para ver errores

**Si sigue fallando:**
```bash
cd backend
npm run seed
```
Esto recrea el usuario admin.

### ❌ "Me saca al recargar la página"

**Verificar:**
1. Token en localStorage:
   - Abrir DevTools (F12)
   - Application → Local Storage
   - Buscar `trivia_auth_token`
   
2. Si no hay token, volver a iniciar sesión

### ❌ "Eventos no aparecen en dropdowns"

**Verificar:**
1. Evento está en estado "ACTIVO"
2. Recargar la página (Ctrl+F5)
3. Revisar filtros en Event Manager

### ❌ "No veo las letras A, B, C, D en las preguntas"

**Solucionado:** Ahora deberías ver badges azules con las letras.

Si no aparecen:
1. Refrescar con Ctrl+Shift+R (hard refresh)
2. Limpiar caché del navegador

### ❌ "Error al crear eventos"

**Verificar campos obligatorios:**
- Nombre (no vacío)
- Descripción (no vacía)
- Fecha de Inicio (formato: YYYY-MM-DD)

**Backend debe estar corriendo:**
```bash
lsof -ti:3000 && echo "✅ Backend OK" || echo "❌ Iniciar backend"
```

---

## 🌐 URLs del Sistema

### Frontend (Puerto 4200)
```
http://localhost:4200              - Home
http://10.45.3.141:4200            - Home (red local)

http://localhost:4200/admin/login  - Login Admin
http://localhost:4200/admin/dashboard - Dashboard
http://localhost:4200/admin/events - Gestión de Eventos
http://localhost:4200/admin/questions-event - Gestión de Preguntas
http://localhost:4200/admin/game-creator - Crear Juegos
http://localhost:4200/admin/stats - Estadísticas

http://localhost:4200/game/kahoot  - Jugar Kahoot (jugadores)
http://localhost:4200/game/geoparty - Jugar Geoparty (jugadores)
```

### Backend (Puerto 3000)
```
http://localhost:3000/health       - Health check
http://localhost:3000/api/auth/*   - Autenticación
http://localhost:3000/api/events/* - API de Eventos
http://localhost:3000/api/admin/*  - API Admin
http://localhost:3000/api/game/*   - API de Juegos
```

---

## 🚀 Comandos Útiles

### Iniciar Todo
```bash
cd /Users/umidev/Desktop/TRIVIA-IASD
npm run dev
```

### Iniciar Solo Backend
```bash
cd backend
npm run dev
```

### Iniciar Solo Frontend
```bash
cd frontend
npm start
```

### Recrear Base de Datos
```bash
cd backend
npm run seed
```

### Ver Puertos en Uso
```bash
lsof -ti:3000  # Backend
lsof -ti:4200  # Frontend
```

### Liberar Puerto 3000
```bash
lsof -ti:3000 | xargs kill -9
```

---

## 📱 Juego Multijugador (LAN)

### Para que otros jugadores se unan desde dispositivos diferentes:

1. **Encuentra tu IP local:**
   ```bash
   ipconfig getifaddr en0  # macOS
   ```
   Resultado: `10.45.3.141`

2. **Comparte la URL:**
   ```
   http://10.45.3.141:4200/game/kahoot    (equipos)
   http://10.45.3.141:4200/game/geoparty  (individual)
   ```

3. **Jugadores ingresan el código del juego**
   - Kahoot: Seleccionan equipo
   - Geoparty: Escriben su nombre

4. **Admin monitorea desde:**
   ```
   http://10.45.3.141:4200/game-monitor/[GAME_ID]
   ```

---

## 🎓 Flujo Completo de un Evento

### Ejemplo: "Noche de Trivia Bíblica"

1. **Admin crea el evento** (Event Manager)
   - Nombre: "Noche de Trivia Bíblica"
   - Fecha: 2025-10-15
   - Estado: Activo

2. **Admin crea 20 preguntas** (Question Manager Event)
   - Selecciona el evento
   - Modo: Kahoot
   - Categorías: Historia, Personajes, Geografía
   - 3 rondas de dificultad creciente

3. **Admin crea el juego** (Game Creator)
   - Modo: Kahoot
   - Evento: "Noche de Trivia Bíblica"
   - 10 preguntas
   - **Código generado: XYZ123**

4. **Jugadores se unen** (desde celulares/tablets)
   - Van a `http://10.45.3.141:4200/game/kahoot`
   - Ingresan código: `XYZ123`
   - Seleccionan equipo: Red, Blue, Green, Yellow

5. **Admin inicia el juego**
   - Click en "🎮 Ir al Juego"
   - Espera a que todos se unan
   - Click en "🚀 Iniciar Juego"

6. **Juego en progreso**
   - Admin controla las preguntas
   - Jugadores responden en sus dispositivos
   - Leaderboard se actualiza en tiempo real

7. **Ver resultados finales**
   - Podio con 3 mejores equipos
   - Estadísticas de cada jugador
   - Botón "Jugar de Nuevo"

---

## 💡 Tips y Mejores Prácticas

### Organización de Eventos
- Usa nombres descriptivos: "Trivia Bíblica Jóvenes 2025" mejor que "Trivia 1"
- Agrupa preguntas por temas similares
- Usa las rondas para escalar dificultad

### Creación de Preguntas
- Mantén las preguntas claras y concisas
- 4 opciones de respuesta es el estándar
- Tiempo: 15s (fácil), 30s (media), 45s (difícil)
- Puntos: 100 (fácil), 200 (media), 300 (difícil)

### Gestión de Juegos
- Crea el juego 10 minutos antes del evento
- Prueba el código con un dispositivo antes
- Ten backup de preguntas extra por si acaso

### Durante el Juego
- Usa una pantalla grande para el admin
- Muestra el código del juego en pantalla
- Ten WiFi estable para todos los dispositivos

---

## 📞 Soporte

### Documentos de Referencia
- `README.md` - Instalación y setup
- `DOCUMENTACION_TOKEN_JWT.md` - Sistema de autenticación
- `GUIA_PRUEBAS_MULTIJUGADOR.md` - Pruebas con múltiples dispositivos
- `RESUMEN_PRUEBAS_RAPIDO.md` - Quick start guide

### Logs y Debugging
- **Backend logs:** Terminal donde corre `npm run dev`
- **Frontend logs:** Consola del navegador (F12)
- **Database:** PostgreSQL en Docker puerto 5433

---

**Última actualización:** 8 de octubre de 2025
**Versión del sistema:** 2.0
**IP Local configurada:** 10.45.3.141
