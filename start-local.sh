#!/bin/bash

# 🌐 Script para exponer la aplicación en red local
# Uso: ./start-local.sh

echo "🚀 Iniciando aplicación en red local..."
echo ""

# Detectar IP local automáticamente
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -n 1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    # Windows (Git Bash)
    LOCAL_IP=$(ipconfig | grep "IPv4" | awk '{print $NF}' | head -n 1)
fi

# Validar que se obtuvo la IP
if [ -z "$LOCAL_IP" ]; then
    echo "❌ No se pudo detectar la IP local automáticamente"
    echo "Por favor ingresa tu IP manualmente:"
    read -p "IP Local: " LOCAL_IP
fi

echo "📍 Tu IP local es: $LOCAL_IP"
echo ""

# Verificar que PostgreSQL esté corriendo
echo "🔍 Verificando PostgreSQL..."
if command -v psql &> /dev/null; then
    if pg_isready &> /dev/null; then
        echo "✅ PostgreSQL está corriendo"
    else
        echo "⚠️  PostgreSQL no está corriendo. Iniciando..."
        if command -v brew &> /dev/null; then
            brew services start postgresql
            sleep 2
        else
            echo "❌ Por favor inicia PostgreSQL manualmente"
            exit 1
        fi
    fi
else
    echo "⚠️  PostgreSQL no encontrado, asegúrate de que esté instalado"
fi
echo ""

# Actualizar environment.ts si es necesario
CURRENT_IP=$(grep "apiUrl" frontend/src/environments/environment.ts | grep -oE '[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}')

if [ "$CURRENT_IP" != "$LOCAL_IP" ]; then
    echo "🔧 Actualizando IP en environment.ts..."
    sed -i.bak "s/$CURRENT_IP/$LOCAL_IP/g" frontend/src/environments/environment.ts
    echo "✅ IP actualizada de $CURRENT_IP a $LOCAL_IP"
    echo ""
fi

echo "📦 Verificando dependencias..."
if [ ! -d "backend/node_modules" ]; then
    echo "Instalando dependencias del backend..."
    cd backend && npm install && cd ..
fi

if [ ! -d "frontend/node_modules" ]; then
    echo "Instalando dependencias del frontend..."
    cd frontend && npm install && cd ..
fi
echo ""

echo "✅ Todo listo para iniciar!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Accede desde cualquier dispositivo en tu red:"
echo ""
echo "   Frontend: http://$LOCAL_IP:4200"
echo "   Backend:  http://$LOCAL_IP:3001"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 Abre http://$LOCAL_IP:4200 en tu celular o tablet"
echo ""
echo "🛑 Para detener: Ctrl+C en ambas terminales"
echo ""

# Preguntar si desea continuar
read -p "¿Iniciar servicios? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🚀 Iniciando servicios..."
    echo ""
    
    # Verificar si ya hay procesos corriendo en los puertos
    if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Puerto 3001 ya está en uso. Deteniendo proceso..."
        lsof -ti:3001 | xargs kill -9
    fi
    
    if lsof -Pi :4200 -sTCP:LISTEN -t >/dev/null ; then
        echo "⚠️  Puerto 4200 ya está en uso. Deteniendo proceso..."
        lsof -ti:4200 | xargs kill -9
    fi
    
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📌 Abriendo terminales..."
    echo "   - Terminal 1: Backend (puerto 3001)"
    echo "   - Terminal 2: Frontend (puerto 4200)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    # Abrir terminales según el sistema operativo
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS - Abrir en iTerm o Terminal
        if command -v osascript &> /dev/null; then
            # Backend
            osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/backend && echo '🔧 BACKEND - http://$LOCAL_IP:3001' && npm run dev\""
            
            # Esperar 2 segundos
            sleep 2
            
            # Frontend
            osascript -e "tell application \"Terminal\" to do script \"cd $(pwd)/frontend && echo '🎨 FRONTEND - http://$LOCAL_IP:4200' && npm start\""
            
            echo "✅ Servicios iniciados en nuevas terminales"
        fi
    else
        echo "⚠️  Inicia manualmente en dos terminales:"
        echo ""
        echo "Terminal 1:"
        echo "  cd backend && npm run dev"
        echo ""
        echo "Terminal 2:"
        echo "  cd frontend && npm start"
    fi
    
    echo ""
    echo "🎉 ¡Aplicación lista!"
    echo ""
    echo "📱 Comparte este enlace con otros dispositivos:"
    echo "   http://$LOCAL_IP:4200"
    
else
    echo ""
    echo "❌ Inicio cancelado"
    echo ""
    echo "Para iniciar manualmente:"
    echo "  Terminal 1: cd backend && npm run dev"
    echo "  Terminal 2: cd frontend && npm start"
fi

echo ""
