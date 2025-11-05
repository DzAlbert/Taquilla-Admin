#!/bin/bash

# Script para configurar Supabase Database Schema
# Este script ejecuta el schema SQL en tu proyecto de Supabase

echo "🚀 Configurando Schema de Supabase..."

# Cargar variables de entorno desde .env
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | grep -v '^$' | xargs)
fi

# Verificar que las variables de entorno estén configuradas
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Las variables de entorno de Supabase no están configuradas."
    echo "Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env"
    exit 1
fi

echo "✅ Variables de entorno configuradas"
echo "📊 URL: $VITE_SUPABASE_URL"

echo ""
echo "📝 Instrucciones para ejecutar el schema:"
echo "1. Ve a tu Dashboard de Supabase: https://app.supabase.com"
echo "2. Selecciona tu proyecto"
echo "3. Ve a 'SQL Editor' en el menú lateral"
echo "4. Crea una nueva consulta"
echo "5. Copia y pega todo el contenido del archivo 'supabase-schema.sql'"
echo "6. Ejecuta el script (botón 'Run')"
echo ""
echo "📁 El archivo del schema se encuentra en: ./supabase-schema.sql"
echo ""
echo "🔐 Después de ejecutar el schema, crea tu primer usuario administrador con:"
echo "   Email: admin@loteria.com"
echo "   Contraseña: Admin123!"
echo ""

# Verificar conexión a Supabase
echo "🔍 Verificando conexión a Supabase..."

# Crear un archivo temporal para probar la conexión
cat > test_connection.js << 'EOF'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.argv[2]
const supabaseKey = process.argv[3]

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables de entorno no configuradas')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Probar conexión básica
supabase.from('users').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.log('❌ Error conectando a Supabase:', error.message)
      console.log('💡 Asegúrate de haber ejecutado el schema SQL en tu Dashboard de Supabase')
    } else {
      console.log('✅ Conexión a Supabase exitosa')
      console.log(`📊 Usuarios en la base de datos: ${count || 0}`)
    }
    process.exit(0)
  })
  .catch(err => {
    console.log('❌ Error:', err.message)
    process.exit(1)
  })
EOF

# Ejecutar test de conexión pasando las variables como argumentos
node test_connection.js "$VITE_SUPABASE_URL" "$VITE_SUPABASE_ANON_KEY"

# Limpiar archivo temporal
rm test_connection.js

echo ""
echo "🎉 Configuración completada!"
echo "🌐 Tu aplicación está corriendo en: http://localhost:5000"
echo ""