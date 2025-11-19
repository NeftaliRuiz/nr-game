# 🎮 Sistema de Trivia - Guía Rápida en Español

**Versión:** 1.0 ES_MX  
**Fecha:** 7 de octubre de 2025  
**Estado:** ✅ Sistema completamente en español

---

## 🚀 Inicio Rápido

### 1. Acceder al Sistema

**URL del Panel de Administración:**
```
http://localhost:4200/admin/login
```

**Credenciales de Administrador:**
- **Email:** admin@trivia.com
- **Contraseña:** admin123

**Credenciales de Usuario Regular:**
- **Email:** user@trivia.com
- **Contraseña:** user123

---

## 📋 Menú Principal del Panel

Después de iniciar sesión, verás el **Panel de Administración** con las siguientes secciones:

### 🏠 Panel Principal
- Vista general del sistema
- Acceso rápido a todas las funciones

### ❓ Preguntas
- **Recomendado:** Usa `/admin/question-manager-event`
- Gestiona preguntas por evento, modo de juego y ronda

### 👥 Usuarios
- Gestión de usuarios del sistema
- Roles: Admin y User

### 📅 Eventos
- **Recomendado:** Usa `/admin/event-manager`
- Crea y gestiona eventos para organizar juegos
- Filtra por estado (Activo/Inactivo)

### 📊 Estadísticas
- Dashboard con métricas del sistema
- Total de usuarios, preguntas, eventos y juegos
- Actualización automática cada 30 segundos

---

## 🎯 Gestión de Juegos

### 🎮 Crear Juego

**Ruta:** `/admin/game-creator`

**Pasos:**
1. **Selecciona el modo de juego:**
   - 🎯 **Kahoot** (Modo Equipos)
   - 🌎 **Geoparty** (Modo Individual)

2. **Configura el juego:**
   - Nombre del juego
   - Evento (opcional)
   - Número de preguntas

3. **Crea el juego:**
   - Se generará un código único de 6 dígitos
   - Puedes copiar el código al portapapeles
   - El juego aparecerá en la lista de "Juegos Activos"

4. **Acciones disponibles:**
   - 🎮 **Ir al Juego** - Jugar directamente
   - 📊 **Monitor** - Ver resultados en tiempo real

---

## 📅 Gestión de Eventos

**Ruta:** `/admin/event-manager`

### Crear Evento

1. Click en **"Nuevo Evento"**
2. Llena el formulario:
   - Nombre del evento
   - Descripción
   - Fecha
   - Estado (Activo/Inactivo)
3. Guarda los cambios

### Filtrar Eventos

- **Búsqueda:** Por nombre o descripción
- **Estado:** Todos / Activos / Inactivos

### Acciones en Eventos

- ✏️ **Editar** - Modificar información
- ⏸️ **Pausar** / ▶️ **Activar** - Cambiar estado
- 🗑️ **Eliminar** - Borrar evento

---

## ❓ Gestión de Preguntas

**Ruta:** `/admin/question-manager-event`

### Crear Pregunta

1. **Selecciona primero un evento** (filtro superior)
2. Click en **"Nueva Pregunta"**
3. Llena el formulario:
   - **Evento:** Selecciona el evento asociado
   - **Modo de Juego:** Kahoot o Geoparty
   - **Ronda:** Número de ronda
   - **Pregunta:** Texto de la pregunta
   - **Opciones:** 4 opciones de respuesta
   - **Respuesta Correcta:** Marca cuál es la correcta
   - **Categoría:** Tipo de pregunta
   - **Dificultad:** Fácil, Media o Difícil
   - **Puntos:** Valor base de la pregunta
   - **Tiempo Límite:** Segundos para responder

4. Click en **"Guardar Pregunta"**

### Filtrar Preguntas

- **Evento:** Selecciona un evento específico
- **Modo de Juego:** Kahoot o Geoparty
- **Ronda:** Número de ronda
- **Búsqueda:** Por texto de la pregunta

---

## 🎲 Jugar

### Modo Kahoot (Equipos)

1. El administrador crea un juego Kahoot
2. Los jugadores ingresan a: `/game/kahoot/[ID_DEL_JUEGO]`
3. **Fase de Unión:**
   - Ingresar código del juego
   - Seleccionar equipo
   - Esperar a otros jugadores

4. **Fase de Juego:**
   - El administrador controla el avance
   - Todos responden simultáneamente
   - Se muestran los resultados por equipo

5. **Finalización:**
   - Tabla de posiciones final
   - Podio con los 3 primeros lugares

### Modo Geoparty (Individual)

1. El administrador crea un juego Geoparty
2. Los jugadores ingresan a: `/game/geoparty/[ID_DEL_JUEGO]`
3. **Fase de Unión:**
   - Ingresar código del juego
   - Escribir nombre de jugador
   - Esperar a otros jugadores

4. **Fase de Juego:**
   - Cada jugador selecciona su categoría
   - Avanza a su propio ritmo
   - Puntuación individual

5. **Finalización:**
   - Tabla de posiciones individual
   - Estadísticas personales

---

## 📊 Monitor en Tiempo Real

**Ruta:** `/game-monitor/[ID_DEL_JUEGO]`

### Características:
- 📈 Ver puntuaciones en tiempo real
- 👥 Lista de participantes conectados
- 🏆 Tabla de posiciones actualizada
- 📊 Estadísticas del juego

---

## 🔐 Cerrar Sesión

1. Click en el botón **"Cerrar Sesión"** en el menú lateral
2. Serás redirigido al login

---

## 💡 Consejos y Mejores Prácticas

### Para Administradores:

1. **Organiza por Eventos:**
   - Crea un evento por cada sesión de juego
   - Asocia las preguntas a eventos específicos

2. **Preguntas Balanceadas:**
   - Mezcla dificultades (fácil, media, difícil)
   - Varía las categorías
   - Ajusta los tiempos según dificultad

3. **Modos de Juego:**
   - **Kahoot:** Ideal para competencias por equipos
   - **Geoparty:** Mejor para juego individual rápido

4. **Códigos de Juego:**
   - Comparte el código antes de iniciar
   - Ten el monitor abierto en otra ventana

### Para Jugadores:

1. **Unirse al Juego:**
   - Tener el código de juego listo
   - Usar un nombre/equipo identificable

2. **Durante el Juego:**
   - Lee cuidadosamente cada pregunta
   - Administra bien tu tiempo
   - En Geoparty, elige categorías que domines

---

## 🆘 Solución de Problemas

### No puedo iniciar sesión
- ✅ Verifica que el backend esté corriendo (puerto 3000)
- ✅ Usa las credenciales correctas
- ✅ Limpia el localStorage del navegador

### No aparecen eventos en el dropdown
- ✅ Asegúrate de que el evento tenga estado ACTIVE o UPCOMING
- ✅ Recarga la página

### El juego no inicia
- ✅ Verifica que haya al menos 2 participantes
- ✅ Revisa la consola del navegador (F12)

### No se guardan las preguntas
- ✅ Verifica que todos los campos requeridos estén llenos
- ✅ Asegúrate de haber seleccionado un evento
- ✅ Marca la respuesta correcta

---

## 🌐 URLs Importantes

### Administración:
- Login: `http://localhost:4200/admin/login`
- Dashboard: `http://localhost:4200/admin/dashboard`
- Eventos: `http://localhost:4200/admin/event-manager`
- Preguntas: `http://localhost:4200/admin/question-manager-event`
- Crear Juego: `http://localhost:4200/admin/game-creator`
- Estadísticas: `http://localhost:4200/admin/statistics`

### Juego:
- Kahoot: `http://localhost:4200/game/kahoot/[ID]`
- Geoparty: `http://localhost:4200/game/geoparty/[ID]`
- Monitor: `http://localhost:4200/game-monitor/[ID]`

### API Backend:
- Base URL: `http://localhost:3000/api`
- Health Check: `http://localhost:3000/health`

---

## 📱 Dispositivos Soportados

- 💻 **Escritorio:** Chrome, Firefox, Safari, Edge
- 📱 **Móvil:** iOS Safari, Chrome Mobile, Samsung Internet
- 📲 **Tablet:** iPadOS, Android Tablets

---

## 📞 Soporte

Para reportar problemas o solicitar nuevas funcionalidades:
- Revisa la documentación en `/TRIVIA-IASD/`
- Consulta los archivos de documentación:
  - `ARQUITECTURA_Y_PLAN.md`
  - `GUIA_COMPLETA_ESTADO.md`
  - `TRADUCCION_COMPLETA_ES_MX.md`

---

**¡Disfruta tu Sistema de Trivia en Español!** 🎉

---

**Última actualización:** 7 de octubre de 2025
