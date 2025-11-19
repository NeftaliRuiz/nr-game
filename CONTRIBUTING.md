# 🤝 Guía de Contribución - Trivia Game

¡Gracias por tu interés en contribuir al proyecto! Esta guía te ayudará a comenzar.

## 📋 Tabla de Contenidos

- [Código de Conducta](#código-de-conducta)
- [Cómo Contribuir](#cómo-contribuir)
- [Configuración del Entorno](#configuración-del-entorno)
- [Flujo de Trabajo](#flujo-de-trabajo)
- [Estándares de Código](#estándares-de-código)
- [Agregar Preguntas](#agregar-preguntas)
- [Reportar Bugs](#reportar-bugs)
- [Sugerir Mejoras](#sugerir-mejoras)

## 🌟 Código de Conducta

Este proyecto se adhiere a un código de conducta simple:

- Sé respetuoso y profesional
- Acepta críticas constructivas
- Enfócate en lo que es mejor para la comunidad
- Muestra empatía hacia otros miembros

## 🚀 Cómo Contribuir

Hay varias formas de contribuir:

1. **Reportar bugs**: Encontraste un error? Abre un issue
2. **Sugerir funcionalidades**: Tienes una idea? Compártela
3. **Escribir código**: Implementa nuevas características o arregla bugs
4. **Mejorar documentación**: Ayuda a otros a entender el proyecto
5. **Agregar preguntas**: Expande el banco de preguntas

## 🛠️ Configuración del Entorno

### 1. Fork y Clone

```bash
# Fork el repositorio en GitHub
# Luego clona tu fork
git clone https://github.com/TU_USUARIO/TRIVIA-IASD.git
cd TRIVIA-IASD

# Agrega el repositorio original como upstream
git remote add upstream https://github.com/ORIGINAL_USUARIO/TRIVIA-IASD.git
```

### 2. Instalar Dependencias

```bash
# Método rápido
./setup.sh  # Linux/Mac
# o
setup.bat   # Windows

# Método manual
npm run install-all
```

### 3. Crear Branch de Trabajo

```bash
git checkout -b feature/mi-nueva-caracteristica
# o
git checkout -b fix/correccion-de-bug
```

## 📝 Flujo de Trabajo

### 1. Actualiza tu Fork

```bash
git fetch upstream
git checkout main
git merge upstream/main
```

### 2. Desarrolla tu Contribución

```bash
# Inicia los servidores
npm run dev

# Haz tus cambios
# Backend: backend/src/
# Frontend: frontend/src/
```

### 3. Prueba tus Cambios

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

### 4. Commit y Push

```bash
git add .
git commit -m "feat: descripción breve de tu cambio"
git push origin feature/mi-nueva-caracteristica
```

### 5. Crea un Pull Request

1. Ve a GitHub y abre un Pull Request
2. Describe tus cambios claramente
3. Enlaza issues relacionados si los hay
4. Espera la revisión

## 📏 Estándares de Código

### Convenciones de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: nueva característica
fix: corrección de bug
docs: cambios en documentación
style: formateo, punto y coma faltante, etc
refactor: refactorización de código
test: agregar tests
chore: actualizar dependencias, etc
```

Ejemplos:
```bash
git commit -m "feat: agregar categoría de geografía"
git commit -m "fix: corregir cálculo de puntos en racha"
git commit -m "docs: actualizar guía de instalación"
```

### TypeScript

```typescript
// ✅ Bueno
interface Question {
  id: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// ❌ Evitar
const question: any = { ... };
```

### Angular

```typescript
// ✅ Bueno - Usa OnPush change detection cuando sea posible
@Component({
  selector: 'app-my-component',
  changeDetection: ChangeDetectionStrategy.OnPush
})

// ✅ Bueno - Desuscribe de observables
ngOnDestroy(): void {
  this.subscription?.unsubscribe();
}
```

### Estilos (TailwindCSS)

```html
<!-- ✅ Bueno - Usa clases de Tailwind -->
<div class="flex items-center gap-4 p-4 rounded-xl bg-white/10">

<!-- ❌ Evitar - Estilos inline -->
<div style="display: flex; padding: 16px;">
```

## ➕ Agregar Preguntas

### Estructura de Pregunta

Edita `backend/src/data/questions.json`:

```json
{
  "id": 19,
  "category": "nombre-categoria",
  "difficulty": "easy" | "medium" | "hard",
  "points": 100 | 200 | 300,
  "question": "Tu pregunta aquí?",
  "options": [
    "Opción A",
    "Opción B",
    "Opción C",
    "Opción D"
  ],
  "correctAnswer": 0,  // Índice de la respuesta correcta (0-3)
  "timeLimit": 20      // Segundos
}
```

### Checklist para Preguntas

- [ ] ID único (número consecutivo)
- [ ] Categoría existente o nueva válida
- [ ] Dificultad apropiada
- [ ] Puntos según dificultad (100/200/300)
- [ ] Pregunta clara y sin ambigüedades
- [ ] 4 opciones de respuesta
- [ ] Una respuesta correcta claramente identificada
- [ ] Tiempo límite razonable (normalmente 20 segundos)
- [ ] Verificar ortografía y gramática

### Agregar Nueva Categoría

1. Agrega la categoría en `questions.json`:

```json
{
  "id": "tecnologia",
  "name": "Tecnología",
  "icon": "💻",
  "color": "#06B6D4"
}
```

2. Agrega preguntas con `"category": "tecnologia"`

## 🐛 Reportar Bugs

### Antes de Reportar

1. Busca si el bug ya fue reportado
2. Verifica que puedes reproducirlo
3. Recopila información del sistema

### Template de Bug Report

```markdown
**Descripción del Bug**
Una descripción clara del problema.

**Pasos para Reproducir**
1. Ve a '...'
2. Haz clic en '....'
3. Desplázate hacia '....'
4. Ver error

**Comportamiento Esperado**
Lo que debería ocurrir.

**Comportamiento Actual**
Lo que ocurre en realidad.

**Screenshots**
Si aplica, agrega capturas.

**Entorno:**
- OS: [e.g. macOS 13.0]
- Browser: [e.g. Chrome 120]
- Node.js: [e.g. 20.10]

**Información Adicional**
Contexto adicional sobre el problema.
```

## 💡 Sugerir Mejoras

### Template de Feature Request

```markdown
**¿Tu sugerencia está relacionada con un problema?**
Una descripción clara del problema. Ej. "Siempre me frustra cuando..."

**Describe la solución que te gustaría**
Una descripción clara de lo que quieres que ocurra.

**Describe alternativas consideradas**
Otras soluciones o características que consideraste.

**Contexto Adicional**
Capturas, mockups, o contexto sobre la sugerencia.
```

## 🔍 Revisión de Pull Requests

Los PRs serán revisados considerando:

- ✅ Cumple los estándares de código
- ✅ Tests pasan correctamente
- ✅ Documentación actualizada si es necesario
- ✅ No rompe funcionalidad existente
- ✅ Commit messages siguen convenciones

## 📞 Contacto

¿Preguntas? Abre un issue con la etiqueta `question`.

---

**¡Gracias por contribuir! 🎉**
