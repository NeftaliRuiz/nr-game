# 🚀 Guía de Inicio Rápido - Trivia Game

## ⚡ Comandos para Comenzar

### Instalación Rápida

```bash
# En el directorio raíz del proyecto
npm run install-all
```

Este comando instala todas las dependencias del backend y frontend automáticamente.

### Ejecutar el Proyecto

**Opción 1: Ambos servidores a la vez (Recomendado)**

```bash
npm run dev
```

**Opción 2: Servidores separados**

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm start
```

### Verificar que Funciona

1. **Backend**: Abre http://localhost:3000/health
   - Deberías ver: `{"status":"OK","message":"Trivia API is running"}`

2. **Frontend**: Abre http://localhost:4200
   - Deberías ver la pantalla de configuración del juego

## 🎮 Flujo Básico del Juego

1. **Configuración**:
   - Selecciona modo (Individual/Equipos)
   - Agrega al menos 2 equipos/jugadores
   - Personaliza íconos, nombres y colores
   - Clic en "Iniciar Juego"

2. **Jugando**:
   - Lee la pregunta
   - Selecciona una opción (A, B, C, D)
   - Confirma antes de que termine el tiempo
   - Observa tu puntuación

3. **Final**:
   - Después de 10 preguntas, se muestra el ganador
   - Revisa la tabla de posiciones completa
   - Juega de nuevo

## 📝 Personalización Rápida

### Agregar Preguntas

Edita `backend/src/data/questions.json`:

```json
{
  "id": 19,
  "category": "ciencia",
  "difficulty": "hard",
  "points": 300,
  "question": "Tu pregunta aquí",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correctAnswer": 0,
  "timeLimit": 20
}
```

### Cambiar Número de Preguntas

Edita `frontend/src/app/components/game-board/game-board.component.ts`:

```typescript
totalQuestions: number = 15; // Cambia de 10 a 15 preguntas
```

### Modificar Colores del Tema

Edita `frontend/tailwind.config.js`:

```javascript
colors: {
  primary: '#YOUR_COLOR',
  secondary: '#YOUR_COLOR',
  // ... más colores
}
```

## 🐛 Solución Rápida de Problemas

### Error: "Cannot GET /"
- **Causa**: El backend no está corriendo
- **Solución**: `cd backend && npm run dev`

### Error: CORS
- **Causa**: Backend y frontend en puertos diferentes
- **Solución**: Verifica que ambos estén corriendo (3000 y 4200)

### Error: Port Already in Use
```bash
# Backend
PORT=3001 npm run dev

# Frontend
ng serve --port 4201
```

### Dependencias Faltantes
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules package-lock.json
npm install
```

## 📦 Estructura de Archivos Clave

```
TRIVIA-IASD/
├── backend/
│   ├── src/
│   │   ├── server.ts              # Punto de entrada
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── routes/                # Rutas de API
│   │   └── data/questions.json    # Base de datos
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── components/        # Componentes UI
│   │   │   ├── services/          # Servicios API
│   │   │   └── models/            # Interfaces TypeScript
│   │   └── styles.css             # Estilos globales
│   └── package.json
├── README.md                      # Documentación completa
└── package.json                   # Scripts raíz
```

## 🎯 Siguiente Paso

¡Abre http://localhost:4200 y empieza a jugar! 🎮
