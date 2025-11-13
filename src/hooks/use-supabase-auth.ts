import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useKV } from '@github/spark/hooks'

export interface SupabaseUser {
  id: string
  name: string
  email: string
  is_active: boolean
  roles: Array<{
    id: string
    name: string
    description: string
    permissions: string[]
    is_system: boolean
  }>
  all_permissions: string[]
}

export function useSupabaseAuth() {
  const [currentUserId, setCurrentUserId] = useKV<string>('currentUserId', '')
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Solo cargar datos si hay un currentUserId válido
    if (currentUserId) {
      loadUserData(currentUserId)
    } else {
      setCurrentUser(null)
      setIsLoading(false)
    }
  }, [currentUserId])

  const loadUserData = async (userId: string) => {
    console.log('Loading user data for:', userId)
    
    try {
      setIsLoading(true)
      
      // Verificar si es un UUID válido
      const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)
      
      if (!isValidUUID) {
        console.error('Invalid UUID format:', userId)
        setCurrentUser(null)
        setIsLoading(false)
        return
      }

      // Intentar cargar desde Supabase primero
      if (isSupabaseConfigured()) {
        try {
          const { data: userData, error } = await supabase
            .from('users_with_roles')
            .select('*')
            .eq('id', userId)
            .single()

          if (!error && userData) {
            // Obtener roles completos con permisos
            const { data: userRolesData, error: rolesError } = await supabase
              .from('user_roles')
              .select('*, roles(*)')
              .eq('user_id', userId)

            const roles = (userRolesData || []).map((ur: any) => ({
              id: ur.roles.id,
              name: ur.roles.name,
              description: ur.roles.description || '',
              permissions: ur.roles.permissions || [],
              is_system: ur.roles.is_system || false
            }))

            // Combinar todos los permisos de todos los roles
            const allPermissions = roles.reduce((acc: string[], role: any) => {
              return [...acc, ...role.permissions]
            }, [])

            // Usuario real de Supabase con permisos correctos
            const user: SupabaseUser = {
              id: userData.id,
              name: userData.name,
              email: userData.email,
              is_active: userData.is_active,
              roles: roles,
              all_permissions: [...new Set(allPermissions)] // Eliminar duplicados
            }
            console.log('Usuario cargado desde Supabase:', user.email, 'Permisos:', user.all_permissions)
            setCurrentUser(user)
            setIsLoading(false)
            return
          }
        } catch (supabaseError) {
          console.log('Usuario no encontrado en Supabase, creando usuario temporal')
        }
      }

      // Si no se encontró en Supabase, crear uno temporal
      const tempUser: SupabaseUser = {
        id: userId,
        name: 'Usuario Temporal',
        email: 'temp@loteria.com',
        is_active: true,
        roles: [{
          id: crypto.randomUUID ? crypto.randomUUID() : 'temp-role-uuid',
          name: 'Usuario Temporal',
          description: 'Acceso temporal',
          permissions: ['*'],
          is_system: false
        }],
        all_permissions: ['*']
      }
      setCurrentUser(tempUser)
      
    } catch (error) {
      console.error('Error in loadUserData:', error)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Para todos los usuarios, intentar autenticación real con Supabase
      if (!isSupabaseConfigured()) {
        return { success: false, error: 'Sistema no configurado. Contacte al administrador' }
      }

      const { data: user, error } = await supabase
        .from('users')
        .select('id, password_hash, is_active, email')
        .eq('email', email)
        .single()

      if (error || !user) {
        return { success: false, error: 'Credenciales incorrectas' }
      }

      if (!user.is_active) {
        return { success: false, error: 'Usuario inactivo. Contacte al administrador' }
      }

      // Verificar contraseña (simple comparación por ahora)
      const passwordMatch = await verifyPassword(password, user.password_hash)
      
      if (!passwordMatch) {
        return { success: false, error: 'Credenciales incorrectas' }
      }

      // Usuario autenticado correctamente - cargar datos completos
      console.log('Usuario autenticado:', user.email)
      setCurrentUserId(user.id)
      
      // Los datos del usuario se cargarán automáticamente por el useEffect
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      return { success: false, error: 'Error al iniciar sesión' }
    }
  }

  const logout = () => {
    setCurrentUserId('')
    setCurrentUser(null)
  }

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false
    // Si el usuario tiene el permiso universal '*', tiene acceso a todo
    if (currentUser.all_permissions.includes('*')) return true
    return currentUser.all_permissions.includes(permission)
  }

  return {
    currentUser,
    currentUserId,
    isLoading,
    login,
    logout,
    hasPermission,
  }
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Si el hash contiene "hashed_" es un hash simple del formato: hashed_{password}_{timestamp}
  if (hash.startsWith('hashed_')) {
    const parts = hash.split('_')
    if (parts.length >= 2) {
      const storedPassword = parts.slice(1, -1).join('_') // Todo excepto "hashed" y el timestamp
      return password === storedPassword
    }
  }
  
  // Comparación directa como fallback
  return hash === password
}
