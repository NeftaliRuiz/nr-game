# 🔍 DEBUG DEL LOGIN - INSTRUCCIONES

## ✅ CAMBIOS IMPLEMENTADOS

He agregado **logs detallados** en el backend para identificar exactamente dónde está fallando el login.

### 1. **Logs Agregados en Backend**

El backend ahora muestra información detallada en cada paso del login:

```
🔐 Login attempt started
📧 Email received: admin@trivia.com
🔑 Password received: adm***
🔍 Searching user in database...
✅ User found: { id: xxx, email: admin@trivia.com, role: admin }
🔐 Comparing passwords...
🔐 Password valid? true/false
✅ Password validated successfully
✅ Last login updated
🎟️ Generating JWT token...
✅ Token generated: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Login successful for: admin@trivia.com
```

### 2. **Logs de Requests**

El backend también muestra TODAS las peticiones HTTP:

```
📨 2025-10-08T02:30:00.000Z - POST /api/auth/login
Body: {
  "email": "admin@trivia.com",
  "password": "admin123"
}
```

---

## 🔧 CÓMO USAR EL DEBUG

### Paso 1: Abre la Terminal del Backend

```bash
# En VS Code, ve a la terminal donde está corriendo el backend
# O abre una nueva terminal y ejecuta:
cd /Users/umidev/Desktop/TRIVIA-IASD/backend
tail -f logs.txt  # Si quieres ver los logs en tiempo real
```

### Paso 2: Limpia el localStorage del Navegador

```javascript
// Abre la consola del navegador (F12)
// Ejecuta este comando:
localStorage.clear()
// Luego recarga la página:
location.reload()
```

### Paso 3: Intenta Iniciar Sesión

1. Ve a: http://localhost:4200/admin/login
2. Ingresa:
   - **Correo**: admin@trivia.com
   - **Contraseña**: admin123
3. Haz clic en "Iniciar Sesión"

### Paso 4: Observa los Logs del Backend

En la terminal del backend verás EXACTAMENTE qué está pasando:

#### ✅ Login Exitoso:
```
📨 2025-10-08T02:30:00.000Z - POST /api/auth/login
Body: {
  "email": "admin@trivia.com",
  "password": "admin123"
}
🔐 Login attempt started
📧 Email received: admin@trivia.com
🔑 Password received: adm***
🔍 Searching user in database...
✅ User found: { id: 'uuid', email: 'admin@trivia.com', role: 'admin' }
🔐 Comparing passwords...
🔐 Password valid? true
✅ Password validated successfully
✅ Last login updated
🎟️ Generating JWT token...
✅ Token generated: eyJhbGci...
✅ Login successful for: admin@trivia.com
```

#### ❌ Usuario No Encontrado:
```
🔐 Login attempt started
📧 Email received: admin@trivia.com
🔑 Password received: adm***
🔍 Searching user in database...
❌ User not found for email: admin@trivia.com
```

#### ❌ Contraseña Incorrecta:
```
🔐 Login attempt started
📧 Email received: admin@trivia.com
🔑 Password received: adm***
🔍 Searching user in database...
✅ User found: { id: 'uuid', email: 'admin@trivia.com', role: 'admin' }
🔐 Comparing passwords...
🔐 Password valid? false
❌ Password mismatch for user: admin@trivia.com
```

#### ❌ Request No Llega:
Si NO ves ningún log, significa que la petición no está llegando al backend.
Posibles causas:
- Backend no está corriendo
- CORS bloqueando la petición
- URL incorrecta en el frontend

---

## 🐛 POSIBLES PROBLEMAS Y SOLUCIONES

### Problema 1: "Error al iniciar sesión" + Request Tarda Mucho

**Síntomas:**
- El botón se queda cargando mucho tiempo
- No ves logs en el backend
- Error genérico en el frontend

**Causas posibles:**
1. **Backend no está corriendo**
   ```bash
   lsof -ti:3000 && echo "✅ Backend corriendo" || echo "❌ Backend NO corriendo"
   ```

2. **URL incorrecta en el frontend**
   ```bash
   # Verifica en: frontend/src/environments/environment.ts
   cat /Users/umidev/Desktop/TRIVIA-IASD/frontend/src/environments/environment.ts
   # Debe decir: apiUrl: 'http://localhost:3000/api'
   ```

3. **CORS bloqueando la petición**
   - Abre la consola del navegador (F12)
   - Ve a la pestaña "Network"
   - Busca la petición a `/api/auth/login`
   - Si ves error CORS, el backend necesita configuración

### Problema 2: "Password Mismatch" en los Logs

**Síntomas:**
```
🔐 Password valid? false
❌ Password mismatch
```

**Solución:**
La contraseña en la base de datos está hasheada incorrectamente. Necesitas resetear:

```bash
# Ejecuta el seed script de nuevo:
cd /Users/umidev/Desktop/TRIVIA-IASD/backend
npm run seed
```

### Problema 3: "User Not Found" en los Logs

**Síntomas:**
```
❌ User not found for email: admin@trivia.com
```

**Solución:**
El usuario no existe. Verifica la base de datos:

```bash
docker exec trivia-postgres psql -U trivia_user -d trivia_db -c "SELECT email, role FROM users;"
```

Si no hay usuarios, ejecuta el seed:
```bash
cd /Users/umidev/Desktop/TRIVIA-IASD/backend
npm run seed
```

### Problema 4: Request No Llega al Backend

**Síntomas:**
- No ves NINGÚN log en el backend
- El frontend muestra error de conexión

**Solución 1 - Verificar Backend:**
```bash
curl http://localhost:3000/health
# Debe responder: {"status":"OK","message":"Trivia API is running"}
```

**Solución 2 - Verificar URL del Frontend:**
```bash
# Archivo: frontend/src/environments/environment.ts
# Debe tener:
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api'  // ← Verifica esto
};
```

**Solución 3 - Limpiar Caché del Navegador:**
```
Ctrl + Shift + R (Windows/Linux)
Cmd + Shift + R (Mac)
```

---

## 📝 REPORTE DE BUGS

Si el login sigue sin funcionar, por favor comparte:

1. **Logs del backend** (copia todo lo que aparezca al intentar login)
2. **Error en consola del navegador** (F12 → Consola)
3. **Network tab** (F12 → Network → petición a /api/auth/login)
   - Status code
   - Response body
   - Request headers

Con esta información podremos identificar el problema exactamente.

---

## ✅ VERIFICACIÓN RÁPIDA

Ejecuta estos comandos en orden:

```bash
# 1. Backend corriendo?
lsof -ti:3000 && echo "✅" || echo "❌"

# 2. Usuarios en BD?
docker exec trivia-postgres psql -U trivia_user -d trivia_db -c "SELECT COUNT(*) FROM users;"

# 3. Backend responde?
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@trivia.com","password":"admin123"}'

# 4. Frontend corriendo?
lsof -ti:4200 && echo "✅" || echo "❌"
```

Si todos responden ✅, el problema está en el navegador (caché, CORS, localStorage).

---

**Última actualización:** 7 de octubre de 2025 - 21:45  
**Backend con logs:** ✅ Running on http://localhost:3000  
**Estado:** Esperando reporte de logs del usuario
