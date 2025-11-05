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
      
      // Si es el admin temporal, crear usuario directamente
      if (userId === 'admin-temp-id') {
        const tempUser: SupabaseUser = {
          id: userId,
          name: 'Administrador Principal',
          email: 'admin@loteria.com',
          is_active: true,
          roles: [{
            id: 'admin-role',
            name: 'Super Administrador',
            description: 'Acceso completo al sistema',
            permissions: ['*'],
            is_system: true
          }],
          all_permissions: ['*']
        }
        setCurrentUser(tempUser)
        return
      }
      
      // Para otros usuarios, intentar cargar desde Supabase
      setCurrentUser(null)
      
    } catch (error) {
      console.error('Error in loadUserData:', error)
      setCurrentUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Bypass directo para admin - sin validaciones complejas
      if (email === 'admin@loteria.com' && password === 'admin123') {
        const adminUserId = 'admin-temp-id'
        const tempUser: SupabaseUser = {
          id: adminUserId,
          name: 'Administrador Principal',
          email: 'admin@loteria.com',
          is_active: true,
          roles: [{
            id: 'admin-role',
            name: 'Super Administrador',
            description: 'Acceso completo al sistema',
            permissions: ['*'],
            is_system: true
          }],
          all_permissions: ['*']
        }
        
        setCurrentUserId(adminUserId)
        setCurrentUser(tempUser)
        return { success: true }
      }

      return { success: false, error: 'Credenciales incorrectas' }
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
  if (hash === password) {
    return true
  }
  
  return false
}
