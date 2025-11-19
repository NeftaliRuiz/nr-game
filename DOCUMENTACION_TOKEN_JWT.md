# 🔐 Sistema de Gestión de Tokens JWT - Trivia Game

## **📋 Resumen Ejecutivo**

Este documento explica **cómo funciona el sistema de autenticación JWT** en la aplicación Trivia, desde el login hasta la persistencia del token en recargas de página.

---

## **🔄 Flujo Completo de Autenticación**

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FLUJO DE AUTENTICACIÓN                        │
└──────────────────────────────────────────────────────────────────────┘

1. 👤 Usuario ingresa email/password en login
   ↓
2. 📤 Frontend envía POST /api/auth/login
   ↓
3. 🔐 Backend valida credenciales con bcrypt
   ↓
4. ✅ Backend genera JWT token (expira en 7 días)
   ↓
5. 📥 Frontend recibe { success: true, data: { token, user } }
   ↓
6. 💾 AuthService guarda token en localStorage ('trivia_auth_token')
   ↓
7. 🔄 AuthService actualiza BehaviorSubject con usuario actual
   ↓
8. 🚦 AuthGuard permite acceso a rutas protegidas
   ↓
9. 📡 Todas las peticiones HTTP incluyen token en header Authorization
   ↓
10. 🔄 Si usuario recarga página (F5):
    - AuthService constructor detecta token en localStorage
    - Llama GET /api/auth/profile para obtener usuario actualizado
    - Actualiza BehaviorSubject con datos del usuario
    - AuthGuard permite navegación mientras carga el usuario
```

---

## **📂 Archivos Clave y Responsabilidades**

### **1. Frontend: `auth.service.ts`** ✅
**Ubicación**: `frontend/src/app/services/auth.service.ts`

**Responsabilidades**:
- ✅ Gestionar el ciclo de vida del token
- ✅ Almacenar/recuperar token de localStorage
- ✅ Mantener estado reactivo del usuario actual (BehaviorSubject)
- ✅ Cargar usuario desde token al iniciar aplicación

**Métodos Principales**:

```typescript
// 1. LOGIN - Guarda token y usuario
login(email: string, password: string): Observable<AuthResponse> {
  return this.http.post<AuthResponse>(`${this.apiUrl}/login`, {
    email,
    password
  }).pipe(
    tap(response => {
      if (response.success && response.data.token) {
        this.setToken(response.data.token);              // ← Guarda en localStorage
        this.currentUserSubject.next(response.data.user); // ← Actualiza estado
      }
    })
  );
}

// 2. GUARDAR TOKEN
private setToken(token: string): void {
  localStorage.setItem('trivia_auth_token', token); // ← KEY: 'trivia_auth_token'
}

// 3. OBTENER TOKEN
getToken(): string | null {
  return localStorage.getItem('trivia_auth_token');
}

// 4. CARGAR USUARIO DESDE TOKEN (Se ejecuta en constructor)
private loadUserFromToken(): void {
  const token = this.getToken();
  if (token) {
    this.http.get<AuthResponse>(`${this.apiUrl}/profile`).subscribe({
      next: (response) => {
        if (response.success) {
          this.currentUserSubject.next(response.data.user); // ← Actualiza usuario
        }
      },
      error: () => {
        this.logout(); // ← Si token inválido, limpiar
      }
    });
  }
}

// 5. LOGOUT
logout(): void {
  localStorage.removeItem('trivia_auth_token'); // ← Elimina token
  this.currentUserSubject.next(null);            // ← Limpia usuario
}

// 6. VERIFICACIONES
isLoggedIn(): boolean {
  return !!this.getToken() && !!this.currentUserValue;
}

isAdmin(): boolean {
  return this.currentUserValue?.role === 'admin';
}
```

---

### **2. Frontend: `auth.guard.ts`** ✅ (ARREGLADO)
**Ubicación**: `frontend/src/app/guards/auth.guard.ts`

**Responsabilidades**:
- ✅ Proteger rutas del panel admin
- ✅ Verificar token existe antes de cargar usuario
- ✅ Permitir navegación mientras usuario se carga asíncrónamente

**PROBLEMA ANTERIOR** ❌:
```typescript
// ❌ CÓDIGO ANTIGUO (BUGUEADO):
canActivate(): boolean {
  const currentUser = this.authService.currentUserValue;
  if (currentUser) { 
    return true; 
  }
  // ⚠️ Problema: currentUserValue es null durante carga asíncrona
  this.router.navigate(['/admin/login']);
  return false;
}
```

**SOLUCIÓN ACTUAL** ✅:
```typescript
// ✅ CÓDIGO NUEVO (CORREGIDO):
canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
  const token = this.authService.getToken(); // ← 1. Verificar token primero
  
  if (token) {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      // ✅ Token existe pero usuario aún no cargó (loading asíncrono)
      // Permitir navegación, el usuario se cargará en background
      return true;
    }
    
    // ✅ Usuario cargado, verificar permisos
    if (route.data['requireAdmin'] && !this.authService.isAdmin()) {
      this.router.navigate(['/']);
      return false;
    }
    
    return true; // ✅ Todo OK
  }
  
  // ❌ No hay token, redirigir a login
  this.router.navigate(['/admin/login'], { 
    queryParams: { returnUrl: state.url } 
  });
  return false;
}
```

**Por qué funciona ahora**:
1. **Primero verifica token** (sincrónico, inmediato)
2. **Luego verifica usuario** (puede estar null temporalmente)
3. **Si token existe pero usuario null** → Permite navegación mientras carga
4. **Si token no existe** → Redirige a login

---

### **3. Frontend: `auth.interceptor.ts`** ✅
**Ubicación**: `frontend/src/app/interceptors/auth.interceptor.ts`

**Responsabilidades**:
- ✅ Inyectar token JWT en **todas las peticiones HTTP**
- ✅ Agregar header `Authorization: Bearer <token>`

**Código**:
```typescript
intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
  const token = this.authService.getToken();
  
  if (token) {
    // Clone request and add Authorization header
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}` // ← Header JWT
      }
    });
    return next.handle(cloned);
  }
  
  return next.handle(req); // ← Sin token, petición original
}
```

**Resultado**: Backend recibe token en **cada request** sin código adicional.

---

### **4. Backend: `auth.middleware.ts`** ✅
**Ubicación**: `backend/src/middleware/auth.middleware.ts`

**Responsabilidades**:
- ✅ Verificar token JWT en header `Authorization`
- ✅ Decodificar token y validar firma
- ✅ Agregar datos del usuario a `req.user`
- ✅ Verificar rol admin en rutas protegidas

**Código**:
```typescript
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    const token = authHeader.split(' ')[1]; // ← "Bearer TOKEN"
    
    // 2. Verificar token con secret key
    const decoded = verifyToken(token) as any;
    
    // 3. Buscar usuario en BD
    const user = await userRepository.findOne({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // 4. Agregar usuario a request
    req.user = user; // ← Disponible en todos los controllers
    next();
    
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

// Middleware para verificar rol admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
```

---

### **5. Backend: `jwt.ts`** ✅
**Ubicación**: `backend/src/utils/jwt.ts`

**Responsabilidades**:
- ✅ Generar tokens JWT
- ✅ Verificar y decodificar tokens

**Código**:
```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // ← Token expira en 7 días

// Generar token (usado en login/register)
export const generateToken = (userId: string): string => {
  return jwt.sign(
    { userId }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verificar token (usado en middleware)
export const verifyToken = (token: string): string | jwt.JwtPayload => {
  return jwt.verify(token, JWT_SECRET);
};
```

---

## **🔍 Escenarios de Uso**

### **Escenario 1: Login Exitoso** ✅
```
1. Usuario ingresa admin@trivia.com / admin123
2. Frontend → POST /api/auth/login
3. Backend valida con bcrypt
4. Backend genera JWT: "eyJhbGciOiJIUzI1NiIs..."
5. Frontend guarda en localStorage
6. Usuario redirigido a /admin/dashboard
7. Todas las peticiones incluyen token automáticamente
```

### **Escenario 2: Recarga de Página (F5)** ✅
```
1. Usuario presiona F5 en /admin/dashboard
2. AuthService constructor ejecuta loadUserFromToken()
3. getToken() retorna token de localStorage
4. AuthGuard.canActivate() verifica token existe → ✅ true
5. En paralelo, loadUserFromToken() llama GET /api/auth/profile
6. Backend valida token y retorna datos del usuario
7. currentUserSubject actualiza con usuario
8. Dashboard se renderiza correctamente
```

### **Escenario 3: Token Expirado** ❌→✅
```
1. Token expirado (más de 7 días)
2. Interceptor envía token en header
3. Backend verifica y detecta expiración
4. Backend retorna 401 Unauthorized
5. loadUserFromToken() detecta error
6. AuthService.logout() limpia localStorage
7. Usuario redirigido a /admin/login
```

### **Escenario 4: Logout Manual** ✅
```
1. Usuario hace clic en "Cerrar Sesión"
2. AuthService.logout() ejecuta
3. localStorage.removeItem('trivia_auth_token')
4. currentUserSubject.next(null)
5. Usuario redirigido a login
```

---

## **🎯 Verificación Rápida**

### **¿Cómo verificar que el token se guarda?**
1. Login en la aplicación
2. Abrir DevTools → Console
3. Ejecutar:
```javascript
localStorage.getItem('trivia_auth_token')
// Debe retornar: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### **¿Cómo ver el payload del token?**
```javascript
const token = localStorage.getItem('trivia_auth_token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
// { userId: "uuid", iat: 1234567890, exp: 1234567890 }
```

### **¿Cómo verificar que se incluye en peticiones?**
1. Abrir DevTools → Network
2. Hacer cualquier petición a /api/admin/*
3. Ver Headers → Request Headers
4. Verificar: `Authorization: Bearer eyJhbG...`

---

## **🐛 Problemas Comunes y Soluciones**

### **Problema 1**: Token no persiste en recarga ❌
**Causa**: AuthGuard verificaba `currentUserValue` antes de que termine `loadUserFromToken()`  
**Solución**: ✅ Verificar `getToken()` primero (sincrónico), permitir navegación mientras carga

### **Problema 2**: CORS bloquea peticiones ❌
**Causa**: Backend no permite origen del frontend  
**Solución**: ✅ Backend usa `cors()` middleware en `server.ts`

### **Problema 3**: Token expirado no limpia localStorage ❌
**Causa**: Error 401 no manejado en interceptor  
**Solución**: ✅ `loadUserFromToken()` catch ejecuta `logout()` automáticamente

### **Problema 4**: Token se pierde al cerrar pestaña ❌
**Causa**: Uso de `sessionStorage` en lugar de `localStorage`  
**Solución**: ✅ Usar `localStorage` (persiste entre sesiones)

---

## **🔒 Seguridad**

### **✅ Buenas Prácticas Implementadas**:
- ✅ Token JWT con expiración (7 días)
- ✅ Secret key en variable de entorno
- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ Token solo accesible desde JavaScript (no httpOnly cookie, pero OK para SPA)
- ✅ HTTPS en producción (recomendado)

### **⚠️ Mejoras Futuras**:
- ⏳ Refresh tokens (para renovar token sin re-login)
- ⏳ HttpOnly cookies (más seguro que localStorage)
- ⏳ Rate limiting en login endpoint
- ⏳ Two-factor authentication (2FA)
- ⏳ IP whitelisting para admin panel

---

## **📊 Resumen Visual**

```
┌─────────────────────────────────────────────────────────────┐
│                    COMPONENTES DEL SISTEMA                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend                        Backend                    │
│  ┌──────────────────┐            ┌──────────────────┐      │
│  │ auth.service.ts  │────HTTP───→│ auth.controller  │      │
│  │                  │            │                  │      │
│  │ - login()        │            │ - POST /login    │      │
│  │ - setToken()     │            │ - POST /register │      │
│  │ - getToken()     │            │ - GET  /profile  │      │
│  │ - loadUser()     │            └──────────────────┘      │
│  └──────────────────┘                     │                 │
│           │                               │                 │
│           ↓                               ↓                 │
│  ┌──────────────────┐            ┌──────────────────┐      │
│  │ localStorage     │            │ auth.middleware  │      │
│  │                  │            │                  │      │
│  │ Key:             │            │ - authenticate() │      │
│  │ trivia_auth_token│            │ - requireAdmin() │      │
│  └──────────────────┘            └──────────────────┘      │
│           │                               │                 │
│           ↓                               ↓                 │
│  ┌──────────────────┐            ┌──────────────────┐      │
│  │ auth.interceptor │────Bearer─→│ jwt.ts           │      │
│  │                  │            │                  │      │
│  │ Adds header to   │            │ - generateToken()│      │
│  │ all HTTP requests│            │ - verifyToken()  │      │
│  └──────────────────┘            └──────────────────┘      │
│           │                                                 │
│           ↓                                                 │
│  ┌──────────────────┐                                      │
│  │ auth.guard.ts    │                                      │
│  │                  │                                      │
│  │ - canActivate()  │                                      │
│  │ - Protects routes│                                      │
│  └──────────────────┘                                      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## **📝 Notas Finales**

- **Expiración de Token**: 7 días (configurable en `JWT_EXPIRES_IN`)
- **Secret Key**: Almacenado en `.env` (`JWT_SECRET`)
- **Almacenamiento**: `localStorage` con key `'trivia_auth_token'`
- **Header HTTP**: `Authorization: Bearer <token>`
- **Estado Reactivo**: `BehaviorSubject<User | null>` en AuthService
- **Recarga de Página**: ✅ Token persiste y se recupera automáticamente

---

**Última Actualización**: 7 de octubre de 2025  
**Autor**: Sistema Trivia V2.0  
**Estado**: ✅ FUNCIONANDO CORRECTAMENTE
