# 🌐 Guía de Configuración para Red Local

Esta guía te permitirá exponer la aplicación en tu red local para que otros dispositivos puedan acceder.

## 📋 Prerrequisitos

- Node.js instalado
- PostgreSQL corriendo localmente
- Ambos dispositivos en la misma red WiFi

## 🔧 Configuración Paso a Paso

### 1️⃣ Obtener tu IP Local

**En macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**En Windows:**
```bash
ipconfig
```

Busca algo como: `192.168.1.XXX` o `10.0.0.XXX`

### 2️⃣ Configurar el Backend

El backend ya está configurado para aceptar conexiones de cualquier origen (CORS habilitado).

**Iniciar backend:**
```bash
cd backend
npm run dev
```

El backend correrá en: `http://0.0.0.0:3001` (accesible desde red local)

### 3️⃣ Configurar el Frontend

El frontend en desarrollo ya usa tu IP local: `10.45.3.141:3001`

**Si tu IP cambió, actualiza:**
```bash
# Edita: frontend/src/environments/environment.ts
# Cambia a tu nueva IP
```

**Iniciar frontend:**
```bash
cd frontend
npm start
```

El frontend correrá en: `http://0.0.0.0:4200`

### 4️⃣ Acceder desde Otros Dispositivos

**Desde cualquier dispositivo en la misma red:**

1. **Abrir navegador** (Chrome, Safari, Firefox)
2. **Ir a:** `http://TU_IP:4200`
   - Ejemplo: `http://10.45.3.141:4200`
3. **Crear o unirse a juegos** normalmente

## 🔥 Problemas Comunes

### ❌ No puedo acceder desde mi celular

**Solución:**
1. Verifica que ambos estén en la misma red WiFi
2. Desactiva firewall temporalmente:
   ```bash
   # macOS - Permitir conexiones entrantes
   System Preferences > Security & Privacy > Firewall > Firewall Options
   ```

### ❌ CORS Error

**Solución:**
El backend ya tiene CORS configurado para permitir todas las conexiones en desarrollo. Si persiste:
```typescript
// backend/src/server.ts ya tiene:
app.use(cors({
  origin: true, // Permite todos los orígenes
  credentials: true
}));
```

### ❌ WebSocket no conecta

**Solución:**
Verifica que el frontend use la IP correcta en `environment.ts`:
```typescript
socketUrl: 'http://TU_IP:3001'  // Debe ser tu IP, no localhost
```

### ❌ Base de datos no conecta

**Solución:**
Asegúrate de que PostgreSQL esté corriendo:
```bash
# macOS con Homebrew
brew services start postgresql

# Verificar estado
brew services list
```

## 🚀 Comandos Rápidos

**Iniciar todo (desde raíz del proyecto):**
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

**Ver logs en tiempo real:**
```bash
# Backend muestra logs de conexiones y errores
# Frontend muestra en consola del navegador (F12)
```

## 📱 Recomendaciones para Móviles

1. **Usa Chrome o Safari** (mejor compatibilidad con WebSockets)
2. **Mantén la pantalla encendida** durante el juego
3. **Conexión WiFi estable** (evita datos móviles)
4. **Modo horizontal** para mejor experiencia en Sopa de Letras

## 🔐 Seguridad

**⚠️ IMPORTANTE:** Esta configuración es solo para desarrollo/demos locales.

Para producción, usa:
- HTTPS con certificados SSL
- Restringir CORS a dominios específicos
- Variables de entorno seguras
- Firewall configurado correctamente

## 🆘 Soporte Rápido

**Si algo no funciona:**

1. **Verifica que ambos servicios estén corriendo:**
   ```bash
   # Backend debe mostrar:
   ✅ Database connected successfully
   🚀 Server running on: http://0.0.0.0:3001
   🎮 Socket.IO initialized
   
   # Frontend debe mostrar:
   ** Angular Live Development Server is listening on 0.0.0.0:4200 **
   ```

2. **Verifica conectividad:**
   ```bash
   # Desde otro dispositivo, prueba:
   curl http://TU_IP:3001/health
   
   # Debe responder: {"status":"ok",...}
   ```

3. **Revisa logs del navegador (F12):**
   - Tab "Console" para errores de JavaScript
   - Tab "Network" para ver peticiones HTTP
   - Tab "Application" para WebSocket

## 📊 Arquitectura

```
┌─────────────────┐         ┌─────────────────┐
│   Dispositivo   │         │   Tu Mac        │
│   (Celular/PC)  │◄───────►│                 │
│                 │  WiFi   │  Backend:3001   │
│  Browser:4200   │         │  Frontend:4200  │
└─────────────────┘         │  PostgreSQL     │
                            └─────────────────┘
```

**Flujo:**
1. Cliente abre `http://TU_IP:4200` (frontend)
2. Frontend hace peticiones a `http://TU_IP:3001/api` (backend)
3. Backend consulta PostgreSQL local
4. WebSocket mantiene conexión en tiempo real

---

**✨ ¡Listo!** Ya puedes jugar con amigos en la misma red WiFi.
