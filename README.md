# 🎮 Trivia Game - Juego de Preguntas y Respuestas

Una aplicación web interactiva de trivia con soporte para equipos, múltiples categorías, sistema de puntuación dinámico y tabla de posiciones en tiempo real.

![Angular](https://img.shields.io/badge/Angular-17-DD0031?logo=angular)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2-3178C6?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.3-38B2AC?logo=tailwind-css)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.18-000000?logo=express)

## ✨ Características

### 🎯 Funcionalidades Principales

- **Modos de Juego**: Individual o por equipos
- **Múltiples Categorías**: Cultura general, Ciencia, Biblia, Historia, Deportes, Música
- **Sistema de Puntuación Dinámico**:
  - Puntos base por dificultad (100, 200, 300)
  - Bonificación por velocidad de respuesta
  - Racha de respuestas correctas (+50 puntos cada 3 aciertos consecutivos)
- **Temporizador Visual**: 20 segundos por pregunta con indicador circular
- **Tabla de Posiciones en Tiempo Real**: Rankings, estadísticas y porcentajes de efectividad
- **Interfaz Moderna**: Diseño responsivo con animaciones suaves y efectos visuales

### 🎨 Diseño

- **Frontend**: Angular 17 + TailwindCSS
- **Backend**: Node.js + Express + TypeScript
- **Animaciones**: Angular Animations con efectos fade-in, slide y bounce
- **Estilos**: Tema oscuro con gradientes y efectos glassmorphism
- **Iconos**: Emojis nativos para máxima compatibilidad

## 📁 Estructura del Proyecto

```
📦 TRIVIA-IASD/
┣ 📂 backend/
┃ ┣ 📂 src/
┃ ┃ ┣ 📂 controllers/
┃ ┃ ┃ ┗ trivia.controller.ts     # Lógica de negocio de la API
┃ ┃ ┣ 📂 routes/
┃ ┃ ┃ ┗ trivia.routes.ts         # Definición de endpoints REST
┃ ┃ ┣ 📂 data/
┃ ┃ ┃ ┗ questions.json           # Base de datos de preguntas
┃ ┃ ┗ server.ts                  # Servidor Express
┃ ┣ package.json
┃ ┗ tsconfig.json
┣ 📂 frontend/
┃ ┣ 📂 src/
┃ ┃ ┣ 📂 app/
┃ ┃ ┃ ┣ 📂 components/
┃ ┃ ┃ ┃ ┣ game-board/            # Componente principal del juego
┃ ┃ ┃ ┃ ┣ question-card/         # Tarjeta de pregunta con opciones
┃ ┃ ┃ ┃ ┣ scoreboard/            # Tabla de posiciones
┃ ┃ ┃ ┃ ┗ timer/                 # Temporizador circular
┃ ┃ ┃ ┣ 📂 models/
┃ ┃ ┃ ┃ ┣ question.model.ts      # Interfaces de preguntas
┃ ┃ ┃ ┃ ┗ team.model.ts          # Interfaces de equipos
┃ ┃ ┃ ┣ 📂 services/
┃ ┃ ┃ ┃ ┗ trivia.service.ts      # Servicio API y gestión de estado
┃ ┃ ┃ ┗ app.module.ts
┃ ┃ ┣ styles.css                 # Estilos globales con Tailwind
┃ ┃ ┗ index.html
┃ ┣ angular.json
┃ ┣ package.json
┃ ┣ tailwind.config.js
┃ ┗ tsconfig.json
┗ README.md
```

## 🚀 Instalación y Ejecución

### Requisitos Previos

- **Node.js** >= 18.x
- **npm** >= 9.x

### 1️⃣ Clonar o Descargar el Proyecto

```bash
cd TRIVIA-IASD
```

### 2️⃣ Configurar el Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo de configuración (opcional)
cp .env.example .env

# Ejecutar en modo desarrollo
npm run dev

# O construir para producción
npm run build
npm start
```

El backend estará disponible en: **http://localhost:3000**

### 3️⃣ Configurar el Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# O construir para producción
npm run build
```

El frontend estará disponible en: **http://localhost:4200**

### 4️⃣ Verificar la Conexión

1. Abre **http://localhost:3000/health** (debería mostrar `{"status":"OK"}`)
2. Abre **http://localhost:4200** (verás la pantalla de inicio del juego)

## 🎮 Cómo Jugar

### Paso 1: Configuración Inicial

1. Selecciona el modo de juego: **Individual** o **Equipos**
2. Agrega jugadores/equipos:
   - Elige un ícono representativo
   - Asigna un nombre
   - Selecciona un color distintivo
3. Revisa las categorías disponibles
4. Haz clic en **"🎮 Iniciar Juego"**

### Paso 2: Durante el Juego

1. **Turno del jugador/equipo**: se muestra en la parte superior
2. **Lee la pregunta** y las 4 opciones (A, B, C, D)
3. **Selecciona una respuesta** antes de que termine el tiempo (20 segundos)
4. **Confirma tu respuesta** haciendo clic en el botón
5. **Recibe retroalimentación inmediata**:
   - ✅ Respuesta correcta → Suma de puntos + bonificación por tiempo
   - ❌ Respuesta incorrecta → Sin puntos, se muestra la respuesta correcta
6. El turno pasa al siguiente jugador/equipo automáticamente

### Paso 3: Puntuación

- **Puntos base**: 100 (fácil), 200 (medio), 300 (difícil)
- **Bonificación por velocidad**: hasta +50 puntos según tiempo restante
- **Racha**: +50 puntos adicionales cada 3 respuestas correctas consecutivas
- **Tabla de posiciones**: se actualiza en tiempo real en el panel lateral

### Paso 4: Final del Juego

1. Después de 10 preguntas, se muestra la **pantalla de resultados**
2. Se anuncia al **ganador** con su puntuación final
3. Se muestra la **tabla completa de posiciones**
4. Opción para **"🔄 Nueva Partida"**

## 🔧 API Endpoints

### Categorías

- `GET /api/trivia/categories` - Obtener todas las categorías

### Preguntas

- `GET /api/trivia/questions/category/:category` - Preguntas por categoría
- `GET /api/trivia/questions/random?category=X&exclude=1,2,3` - Pregunta aleatoria

### Validación

- `POST /api/trivia/validate` - Validar respuesta
  ```json
  {
    "questionId": 1,
    "answer": 2,
    "timeRemaining": 15
  }
  ```

### Sesiones de Juego

- `POST /api/trivia/sessions` - Crear sesión
- `GET /api/trivia/sessions/:sessionId` - Obtener sesión
- `PUT /api/trivia/sessions/:sessionId/score` - Actualizar puntuación
- `GET /api/trivia/sessions/:sessionId/leaderboard` - Obtener ranking

## 🎨 Personalización

### Agregar Nuevas Preguntas

Edita `backend/src/data/questions.json`:

```json
{
  "id": 19,
  "category": "ciencia",
  "difficulty": "medium",
  "points": 200,
  "question": "¿Cuál es la velocidad de la luz?",
  "options": [
    "299,792 km/s",
    "150,000 km/s",
    "1,000,000 km/s",
    "500,000 km/s"
  ],
  "correctAnswer": 0,
  "timeLimit": 20
}
```

### Agregar Nuevas Categorías

En el mismo archivo `questions.json`, añade en la sección `categories`:

```json
{
  "id": "tecnologia",
  "name": "Tecnología",
  "icon": "💻",
  "color": "#06B6D4"
}
```

### Modificar Estilos

Edita `frontend/src/styles.css` para cambiar colores, animaciones o efectos visuales. Utiliza las clases de Tailwind o define las tuyas propias.

### Ajustar Configuración del Juego

En `frontend/src/app/components/game-board/game-board.component.ts`:

```typescript
totalQuestions: number = 10; // Cambiar número de preguntas por partida
```

## 📦 Despliegue

### Backend (Render / Railway / Fly.io)

1. Configura las variables de entorno:
   ```
   PORT=3000
   NODE_ENV=production
   ```
2. Comando de inicio: `npm start`
3. Configura CORS para permitir tu dominio frontend

### Frontend (Vercel / Netlify)

1. Construye el proyecto: `npm run build`
2. Despliega la carpeta `dist/trivia-frontend`
3. Configura la variable de entorno `API_URL` apuntando a tu backend

### Despliegue Completo

Puedes usar **Docker** para contenedorizar ambos servicios:

```dockerfile
# Ejemplo Dockerfile para backend
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🧪 Testing

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama: `git checkout -b feature/nueva-funcionalidad`
3. Commit: `git commit -m 'Agregar nueva funcionalidad'`
4. Push: `git push origin feature/nueva-funcionalidad`
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia ISC.

## 👨‍💻 Autor

Desarrollado con ❤️ para eventos, clases y competencias de trivia.

---

## 🐛 Solución de Problemas

### Error de CORS

Si el frontend no puede conectarse al backend:

1. Verifica que el backend esté corriendo en `http://localhost:3000`
2. Asegúrate de que CORS esté habilitado en `backend/src/server.ts`

### Dependencias no instaladas

```bash
# Limpiar caché y reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Puerto en uso

Si el puerto 3000 o 4200 está ocupado:

```bash
# Backend - cambiar puerto
PORT=3001 npm run dev

# Frontend - usar puerto diferente
ng serve --port 4201
```

## 📚 Recursos Adicionales

- [Documentación de Angular](https://angular.io/docs)
- [Documentación de TailwindCSS](https://tailwindcss.com/docs)
- [Documentación de Express](https://expressjs.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**¡Disfruta jugando! 🎉🎮**
