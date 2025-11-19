# 📱 Guía: Pruebas Multijugador con Múltiples Dispositivos

## 🎯 Objetivo
Probar el sistema Trivia con **3 jugadores en dispositivos diferentes** (celulares, tablets, laptops) conectados a tu red local.

---

## 🔧 Configuración Inicial

### **1. Identificar tu IP Local**

#### **En macOS (tu caso)**:
```bash
ipconfig getifaddr en0
# O si estás en WiFi:
ipconfig getifaddr en1
```

**Ejemplo de salida**: `192.168.1.10`

#### **Alternativa rápida**:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

#### **Desde la aplicación**:
1. Ve a **Preferencias del Sistema** → **Red**
2. Verás tu IP junto al estado de WiFi/Ethernet

---

### **2. Configurar Backend para Aceptar Conexiones Externas**

El backend **ya está configurado** para aceptar conexiones desde cualquier IP (CORS habilitado), pero vamos a asegurarnos:

**Archivo**: `backend/src/server.ts`

```typescript
// ✅ CORS ya configurado para todos los orígenes (development)
app.use(cors({
  origin: '*', // Acepta todas las conexiones en desarrollo
  credentials: true
}));
```

**No necesitas cambiar nada**, pero si quieres restringir solo a tu red local:

```typescript
app.use(cors({
  origin: [
    'http://localhost:4200',
    'http://192.168.1.10:4200', // Tu IP local
    /^http:\/\/192\.168\.1\.\d+:4200$/ // Cualquier IP de tu red
  ],
  credentials: true
}));
```

---

### **3. Configurar Frontend para Usar IP Local**

**Archivo**: `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://192.168.1.10:3000/api', // ← CAMBIA ESTO por tu IP
  socketUrl: 'http://192.168.1.10:3000'   // ← CAMBIA ESTO por tu IP
};
```

**Reemplaza `192.168.1.10` por la IP que obtuviste en el paso 1.**

---

### **4. Actualizar Servicios Frontend**

Verifica que los servicios usen `environment.apiUrl`:

**`frontend/src/app/services/trivia.service.ts`**:
```typescript
import { environment } from '../../environments/environment';

private apiUrl = environment.apiUrl + '/trivia'; // ← Debe usar environment
```

**`frontend/src/app/services/auth.service.ts`**:
```typescript
import { environment } from '../../environments/environment';

private apiUrl = environment.apiUrl + '/auth'; // ← Debe usar environment
```

**`frontend/src/app/services/admin.service.ts`**:
```typescript
import { environment } from '../../environments/environment';

private apiUrl = environment.apiUrl + '/admin'; // ← Debe usar environment
```

---

## 🚀 Levantar Servidores

### **1. Levantar Backend**
```bash
cd /Users/umidev/Desktop/TRIVIA-IASD
npm run dev:backend
```

**Verificar**: Debe decir `🚀 Server running on http://localhost:3000`

### **2. Levantar Frontend con IP Específica**
```bash
cd frontend
ng serve --host 0.0.0.0 --port 4200
```

**`--host 0.0.0.0`** permite conexiones desde cualquier IP (no solo localhost).

---

## 🔍 Verificación de Conectividad

### **Desde tu Mac (localhost)**:
```bash
# Test backend
curl http://localhost:3000/api/trivia/categories

# Test frontend
open http://localhost:4200
```

### **Desde otro dispositivo en la misma red**:

#### **En el navegador del celular/tablet**:
```
http://192.168.1.10:4200
```
*(Reemplaza `192.168.1.10` por tu IP real)*

#### **Test del backend desde celular**:
```
http://192.168.1.10:3000/api/trivia/categories
```

**Deberías ver**: JSON con las categorías de preguntas.

---

## 🎮 Escenarios de Prueba

### **Escenario 1: Juego Kahoot con 3 Equipos**

#### **Dispositivo 1 (Tu Mac) - ADMIN**:
1. Accede a: `http://localhost:4200/admin/login`
2. Login: `admin@trivia.com` / `admin123`
3. Ve a: **"Crear Juego"**
4. Llena:
   - **Nombre del Juego**: "Trivia Test 3 Jugadores"
   - **Modo**: Kahoot
   - **Evento**: Selecciona o deja vacío
   - **Número de Preguntas**: 5
5. Click **"Generar Código"**
6. **Aparecerá un código**: Por ejemplo, `ABC123`
7. Ve a: **"Monitor en Vivo"**
8. Verás el juego esperando jugadores

#### **Dispositivo 2 (Celular 1) - JUGADOR 1**:
1. Accede a: `http://192.168.1.10:4200`
2. Verás la pantalla de inicio del juego
3. Ingresa el **código del juego**: `ABC123`
4. Ingresa **nombre del equipo**: "Equipo Rojo"
5. Click **"Unirse al Juego"**

#### **Dispositivo 3 (Celular 2) - JUGADOR 2**:
1. Accede a: `http://192.168.1.10:4200`
2. Ingresa código: `ABC123`
3. Nombre del equipo: "Equipo Azul"
4. Click **"Unirse al Juego"**

#### **Dispositivo 4 (Tablet) - JUGADOR 3**:
1. Accede a: `http://192.168.1.10:4200`
2. Ingresa código: `ABC123`
3. Nombre del equipo: "Equipo Verde"
4. Click **"Unirse al Juego"**

#### **De vuelta en tu Mac (Admin)**:
1. En "Monitor en Vivo" verás los **3 equipos conectados**
2. Click **"Iniciar Juego"**
3. Los 3 dispositivos recibirán la primera pregunta **simultáneamente** (gracias a Socket.IO)
4. Cada jugador responde en su dispositivo
5. El monitor en vivo muestra respuestas en tiempo real
6. Al final, verás el **leaderboard** con los puntajes

---

### **Escenario 2: Juego Geoparty con 3 Jugadores Individuales**

#### **Dispositivo 1 (Admin - Mac)**:
1. Crear juego con **Modo: Geoparty**
2. Generar código: `XYZ789`
3. Ir a "Monitor en Vivo"

#### **Dispositivos 2, 3, 4 (Jugadores)**:
1. Acceder a `http://192.168.1.10:4200`
2. Ingresar código: `XYZ789`
3. Nombre individual (no equipo): "Jugador 1", "Jugador 2", "Jugador 3"
4. Unirse al juego

#### **Diferencia con Kahoot**:
- En **Geoparty**, cada jugador **elige su propia pregunta** (no sincronizado)
- Pueden estar en diferentes preguntas al mismo tiempo
- El admin ve el progreso de cada uno independientemente

---

## 🔥 Firewall y Seguridad

### **macOS Firewall**:
Si los dispositivos no pueden conectarse, verifica el firewall:

1. **Preferencias del Sistema** → **Seguridad y Privacidad** → **Firewall**
2. Si está activo, click **"Opciones de Firewall"**
3. Agrega excepciones para:
   - `node` (backend)
   - `ng serve` (frontend)
4. O temporalmente **deshabilita el firewall** para pruebas

### **Router/WiFi**:
- Asegúrate de que todos los dispositivos estén en la **misma red WiFi**
- Algunos routers tienen "Aislamiento de Cliente" activado → **Desactívalo**
- Si usas WiFi de invitados, no funcionará (red aislada)

---

## 🐛 Solución de Problemas

### **Problema 1**: No puedo acceder desde el celular
**Solución**:
```bash
# Verifica que el frontend use 0.0.0.0
ng serve --host 0.0.0.0 --port 4200

# Verifica tu IP
ipconfig getifaddr en0

# Prueba ping desde el celular (app de terminal)
ping 192.168.1.10
```

### **Problema 2**: Backend no responde
**Solución**:
```bash
# Verifica que el backend esté corriendo
curl http://192.168.1.10:3000/api/trivia/categories

# Si no responde, revisa CORS en server.ts
# Debe tener origin: '*' o incluir tu IP
```

### **Problema 3**: WebSocket no conecta
**Solución**:
- Verifica que `socketUrl` en `environment.ts` tenga tu IP
- Revisa en DevTools del celular: `ws://192.168.1.10:3000/game` debe conectar
- Socket.IO usa HTTP long-polling como fallback si WebSocket falla

### **Problema 4**: CORS error en navegador del celular
**Solución**:
```typescript
// backend/src/server.ts
app.use(cors({
  origin: '*', // ← Debe estar así en desarrollo
  credentials: true
}));
```

---

## 📊 Monitoreo en Tiempo Real

### **Logs del Backend**:
Verás en tu terminal:
```
✅ New player connected: Equipo Rojo
✅ New player connected: Equipo Azul
✅ New player connected: Equipo Verde
🎮 Game ABC123 started
📝 Player Equipo Rojo answered question 1
📝 Player Equipo Azul answered question 1
📝 Player Equipo Verde answered question 1
🏆 Game ABC123 finished
```

### **Chrome DevTools en Celular**:
1. En tu Mac, abre Chrome
2. Ve a: `chrome://inspect`
3. Conecta tu celular Android por USB (si tienes iPhone, usa Safari Web Inspector)
4. Verás la página del celular y podrás ver logs de consola

---

## 🎉 Checklist de Prueba Exitosa

- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Frontend corriendo en `http://0.0.0.0:4200`
- [ ] `environment.ts` tiene tu IP local
- [ ] Accedes desde celular a `http://TU_IP:4200` y carga la página
- [ ] Creas un juego desde el admin
- [ ] 3 dispositivos se unen con el código del juego
- [ ] Admin ve los 3 jugadores conectados en tiempo real
- [ ] Al iniciar juego, los 3 dispositivos reciben la pregunta simultáneamente
- [ ] Respuestas se reflejan en tiempo real en el monitor del admin
- [ ] Al finalizar, todos ven el leaderboard con los puntajes

---

## 📝 Comandos Rápidos

### **Obtener tu IP**:
```bash
ipconfig getifaddr en0  # WiFi
ipconfig getifaddr en1  # Ethernet
```

### **Levantar todo**:
```bash
# Terminal 1
cd /Users/umidev/Desktop/TRIVIA-IASD
npm run dev:backend

# Terminal 2
cd /Users/umidev/Desktop/TRIVIA-IASD/frontend
ng serve --host 0.0.0.0 --port 4200
```

### **Test de conectividad desde otro dispositivo**:
```bash
# Desde navegador del celular
http://TU_IP:4200           # Frontend
http://TU_IP:3000/api/trivia/categories  # Backend
```

### **Ver logs del backend**:
```bash
# Los logs aparecen automáticamente en la terminal donde corriste npm run dev:backend
```

---

## 🌐 URLs Finales

| Dispositivo | URL | Rol |
|-------------|-----|-----|
| **Tu Mac** | `http://localhost:4200/admin/login` | Admin Panel |
| **Tu Mac** | `http://localhost:4200/admin/game-creator` | Crear Juego |
| **Tu Mac** | `http://localhost:4200/admin/game-monitor` | Monitor en Vivo |
| **Celular 1** | `http://192.168.1.10:4200` | Jugador 1 |
| **Celular 2** | `http://192.168.1.10:4200` | Jugador 2 |
| **Tablet** | `http://192.168.1.10:4200` | Jugador 3 |

*(Reemplaza `192.168.1.10` por tu IP real)*

---

## 🎬 Video de Prueba Recomendado

1. **Preparación** (2 min):
   - Obtén tu IP
   - Actualiza `environment.ts`
   - Levanta servidores

2. **Creación del Juego** (1 min):
   - Login como admin
   - Crear juego Kahoot con 5 preguntas
   - Copiar código generado

3. **Conexión de Jugadores** (2 min):
   - Dispositivo 2: Unirse con código
   - Dispositivo 3: Unirse con código
   - Dispositivo 4: Unirse con código
   - Verificar que los 3 aparezcan en monitor

4. **Juego en Vivo** (5 min):
   - Iniciar juego desde admin
   - Todos responden pregunta 1
   - Ver leaderboard después de cada pregunta
   - Continuar hasta finalizar
   - Ver leaderboard final

5. **Verificación** (1 min):
   - Revisar estadísticas en admin panel
   - Ver historial de juegos
   - Confirmar puntajes guardados en BD

---

**Última Actualización**: 7 de octubre de 2025  
**Estado**: ✅ LISTO PARA PRUEBAS MULTIJUGADOR  
**Tecnología**: Angular 17 + Node.js + Socket.IO + PostgreSQL
