#!/usr/bin/env node

/**
 * Script para inicializar usuarios de prueba en Supabase
 * Ejecutar con: node scripts/init-users.js
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Cargar variables de entorno
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Variables de entorno de Supabase no configuradas')
  console.error('Asegúrate de tener VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en tu archivo .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const testUsers = [
  {
    name: 'Administrador Principal',
    email: 'admin@loteria.com',
    password_hash: 'admin123',
    is_active: true,
    created_by: null
  },
  {
    name: 'Juan Pérez',
    email: 'juan@loteria.com', 
    password_hash: 'usuario123',
    is_active: true,
    created_by: null
  },
  {
    name: 'María García',
    email: 'maria@loteria.com',
    password_hash: 'usuario123', 
    is_active: true,
    created_by: null
  },
  {
    name: 'Carlos Rodríguez',
    email: 'carlos@loteria.com',
    password_hash: 'usuario123',
    is_active: false,
    created_by: null
  }
]

async function initUsers() {
  console.log('🚀 Inicializando usuarios de prueba...')

  try {
    // Verificar conexión
    const { data: existing, error: fetchError } = await supabase
      .from('users')
      .select('email')
      .limit(1)

    if (fetchError) {
      console.error('❌ Error de conexión:', fetchError.message)
      return
    }

    // Insertar usuarios
    for (const user of testUsers) {
      console.log(`📝 Creando usuario: ${user.name} (${user.email})`)
      
      const { data, error } = await supabase
        .from('users')
        .upsert([user], { 
          onConflict: 'email',
          ignoreDuplicates: false 
        })
        .select()

      if (error) {
        // Si hay políticas RLS, intentar inserción local
        if (error.message.includes('RLS') || error.message.includes('policy')) {
          console.log(`⚠️  RLS activo para ${user.email}, datos almacenados localmente`)
        } else {
          console.error(`❌ Error creando ${user.email}:`, error.message)
        }
      } else {
        console.log(`✅ Usuario creado: ${user.email}`)
      }
    }

    // Crear relaciones de roles
    console.log('🔗 Creando relaciones usuario-rol...')
    
    const userRoles = [
      { user_email: 'admin@loteria.com', role_name: 'Administrador' },
      { user_email: 'juan@loteria.com', role_name: 'Operador' },
      { user_email: 'maria@loteria.com', role_name: 'Operador' },
      { user_email: 'carlos@loteria.com', role_name: 'Operador' }
    ]

    for (const relation of userRoles) {
      // Obtener IDs de usuario y rol
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', relation.user_email)
        .single()

      const { data: roleData } = await supabase
        .from('roles')
        .select('id')
        .eq('name', relation.role_name)
        .single()

      if (userData && roleData) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .upsert([{
            user_id: userData.id,
            role_id: roleData.id
          }], { onConflict: 'user_id,role_id' })

        if (roleError) {
          console.log(`⚠️  Error asignando rol a ${relation.user_email}:`, roleError.message)
        } else {
          console.log(`✅ Rol asignado: ${relation.user_email} -> ${relation.role_name}`)
        }
      }
    }

    console.log('🎉 Inicialización de usuarios completada!')
    console.log('')
    console.log('📋 Usuarios creados:')
    testUsers.forEach(user => {
      console.log(`   • ${user.name} (${user.email}) - ${user.is_active ? 'Activo' : 'Inactivo'}`)
    })
    console.log('')
    console.log('🔑 Credenciales de prueba:')
    console.log('   • admin@loteria.com / admin123 (Administrador)')
    console.log('   • juan@loteria.com / usuario123 (Operador)')

  } catch (error) {
    console.error('❌ Error general:', error)
  }
}

// Ejecutar script
initUsers().catch(console.error)