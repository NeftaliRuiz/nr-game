# 🚀 Guía de Despliegue - Trivia Game

## Opciones de Despliegue

### 1. Backend - Render.com (Gratis)

#### Paso 1: Preparación

1. Crea una cuenta en [Render.com](https://render.com)
2. Conecta tu repositorio de GitHub

#### Paso 2: Configuración

1. **New Web Service**
2. **Build Command**: `cd backend && npm install && npm run build`
3. **Start Command**: `cd backend && npm start`
4. **Environment Variables**:
   ```
   PORT=3000
   NODE_ENV=production
   ```

#### Paso 3: CORS

Actualiza `backend/src/server.ts`:

```typescript
app.use(cors({
  origin: 'https://tu-frontend.vercel.app',
  credentials: true
}));
```

---

### 2. Frontend - Vercel (Gratis)

#### Paso 1: Preparación

1. Crea una cuenta en [Vercel.com](https://vercel.com)
2. Instala Vercel CLI: `npm i -g vercel`

#### Paso 2: Configuración

Crea `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist/trivia-frontend/browser",
  "framework": "angular",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

#### Paso 3: Variables de Entorno

En Vercel Dashboard → Project Settings → Environment Variables:

```
API_URL=https://tu-backend.render.com/api/trivia
```

Actualiza `frontend/src/app/services/trivia.service.ts`:

```typescript
private apiUrl = environment.apiUrl;
```

Y `frontend/src/environments/environment.prod.ts`:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://tu-backend.render.com/api/trivia'
};
```

#### Paso 4: Deploy

```bash
cd frontend
vercel --prod
```

---

### 3. Despliegue con Docker

#### Dockerfile Backend

Crea `backend/Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

#### Dockerfile Frontend

Crea `frontend/Dockerfile`:

```dockerfile
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/trivia-frontend /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
```

#### docker-compose.yml

Crea en la raíz:

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
    restart: unless-stopped
```

#### Ejecutar con Docker

```bash
docker-compose up -d
```

---

### 4. Railway.app (Backend alternativo)

1. Crea cuenta en [Railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub**
3. Selecciona el repositorio
4. **Root Directory**: `backend`
5. **Build Command**: `npm install && npm run build`
6. **Start Command**: `npm start`
7. **Variables**:
   ```
   PORT=${{RAILWAY_PUBLIC_PORT}}
   NODE_ENV=production
   ```

---

### 5. Netlify (Frontend alternativo)

1. Crea cuenta en [Netlify.com](https://netlify.com)
2. **New site from Git**
3. **Build command**: `cd frontend && npm run build`
4. **Publish directory**: `frontend/dist/trivia-frontend/browser`
5. **Environment variables**:
   ```
   API_URL=https://tu-backend.railway.app/api/trivia
   ```

---

## Checklist de Producción

### Backend

- [ ] Configurar CORS con dominios específicos
- [ ] Habilitar rate limiting (opcional)
- [ ] Configurar logs de producción
- [ ] Agregar health check endpoint (`/health`)
- [ ] Validar variables de entorno
- [ ] Considerar base de datos persistente (PostgreSQL, MongoDB)

### Frontend

- [ ] Actualizar `apiUrl` con URL de producción
- [ ] Minificar y optimizar assets
- [ ] Configurar Service Worker (PWA opcional)
- [ ] Habilitar HTTPS
- [ ] Comprimir respuestas (gzip)
- [ ] Configurar CDN para assets estáticos

---

## Monitoreo y Mantenimiento

### Logs

**Render**:
```bash
# Ver logs en tiempo real
render logs --app tu-app-backend
```

**Vercel**:
```bash
# Ver logs
vercel logs tu-app-frontend
```

### Health Checks

```bash
# Backend
curl https://tu-backend.render.com/health

# Frontend
curl https://tu-frontend.vercel.app
```

---

## Costos Estimados

| Servicio | Plan Gratuito | Límites |
|----------|---------------|---------|
| **Render** | Sí | 750 hrs/mes, sleep after inactivity |
| **Vercel** | Sí | 100GB bandwidth/mes |
| **Railway** | Sí | $5 crédito/mes |
| **Netlify** | Sí | 100GB bandwidth/mes |

---

## Solución de Problemas

### Backend no responde

1. Verificar logs: `render logs`
2. Confirmar que el puerto está correcto
3. Revisar CORS configuration

### Frontend no carga

1. Verificar build output en Vercel
2. Confirmar que `apiUrl` apunta al backend correcto
3. Revisar Network tab en DevTools

### Error 502 Bad Gateway

- Backend probablemente está en modo "sleep" (Render free tier)
- Primera request puede tardar 30-60 segundos
- Considerar upgrade o usar servicio alternativo

---

## URLs de Ejemplo

```
Backend:   https://trivia-api.onrender.com
Frontend:  https://trivia-game.vercel.app
Health:    https://trivia-api.onrender.com/health
API:       https://trivia-api.onrender.com/api/trivia/categories
```

---

## Recursos Adicionales

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [Railway Docs](https://docs.railway.app)
- [Docker Compose](https://docs.docker.com/compose/)

---

**¡Tu trivia estará lista para compartir con el mundo! 🌍🎮**
