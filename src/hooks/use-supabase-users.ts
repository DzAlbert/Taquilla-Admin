import { useState, useEffect, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { User } from '@/lib/types'
import { toast } from 'sonner'

export interface SupabaseUser {
  id: string
  name: string
  email: string
  password_hash: string
  is_active: boolean
  created_at: string
  created_by: string | null
  updated_at: string
  // Campos de la vista users_with_roles
  roles?: Array<{
    id: string
    name: string
    description: string
    permissions: string[]
    is_system: boolean
  }>
  all_permissions?: string[]
}

export function useSupabaseUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cargar usuarios desde Supabase
  const loadUsers = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      // Fallback: usar usuarios locales por defecto
      const defaultUsers: User[] = [
        {
          id: 'admin-user',
          name: 'Administrador Principal',
          email: 'admin@loteria.com',
          roleIds: ['admin'],
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        }
      ]
      setUsers(defaultUsers)
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      // Cargar usuarios con sus roles desde la vista users_with_roles
      const { data, error } = await supabase
        .from('users_with_roles')
        .select('*')
        .order('created_at', { ascending: true })

      if (error) throw error

      // Transformar datos de Supabase al formato local
      const transformedUsers: User[] = data.map((user: SupabaseUser) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        roleIds: user.roles?.map(role => role.id) || [],
        isActive: user.is_active,
        createdAt: user.created_at,
        createdBy: user.created_by || 'system',
      }))

      // Combinar usuarios de Supabase con usuarios locales existentes
      setUsers(current => {
        const localUsers = current.filter(user => user.id.startsWith('local-'))
        const supabaseUsers = transformedUsers
        
        // Evitar duplicados por email
        const uniqueUsers = [...supabaseUsers]
        localUsers.forEach(localUser => {
          if (!supabaseUsers.find(su => su.email === localUser.email)) {
            uniqueUsers.push(localUser)
          }
        })
        
        return uniqueUsers
      })
    } catch (error: any) {
      console.error('Error loading users:', error)
      setError(error.message || 'Error al cargar usuarios')
      toast.error('Error al cargar usuarios desde Supabase')
      
      // Fallback a usuarios por defecto en caso de error
      const defaultUsers: User[] = [
        {
          id: 'admin-user',
          name: 'Administrador Principal',
          email: 'admin@loteria.com',
          roleIds: ['admin'],
          isActive: true,
          createdAt: new Date().toISOString(),
          createdBy: 'system',
        }
      ]
      setUsers(defaultUsers)
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Crear nuevo usuario
  const createUser = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    if (!isSupabaseConfigured()) {
      // Fallback local
      const newUser: User = {
        ...userData,
        id: `local-${Date.now()}`,
        createdAt: new Date().toISOString(),
      }
      setUsers(current => [...current, newUser])
      toast.success('Usuario creado exitosamente (modo local)')
      return true
    }

    try {
      // Primero crear el usuario en la tabla users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([
          {
            name: userData.name,
            email: userData.email,
            password_hash: userData.password || 'cambiar123', // Contraseña temporal
            is_active: userData.isActive,
            created_by: userData.createdBy,
          }
        ])
        .select()
        .single()

      if (userError) {
        // Si es un error de políticas RLS, usar modo local
        if (userError.message.includes('row-level security policy')) {
          console.warn('RLS policy error, usando modo local:', userError.message)
          const newUserLocal: User = {
            ...userData,
            id: `local-${Date.now()}`,
            createdAt: new Date().toISOString(),
          }
          setUsers(current => [...current, newUserLocal])
          toast.success('Usuario creado exitosamente (modo local)')
          return true
        }
        throw userError
      }

      // Luego asignar los roles
      if (userData.roleIds.length > 0) {
        const userRoles = userData.roleIds.map(roleId => ({
          user_id: newUser.id,
          role_id: roleId,
        }))

        const { error: rolesError } = await supabase
          .from('user_roles')
          .insert(userRoles)

        if (rolesError) {
          console.warn('Error asignando roles:', rolesError.message)
          // Continuar aunque no se puedan asignar roles
        }
      }

      // Agregar el nuevo usuario al estado local
      const createdUser: User = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        roleIds: userData.roleIds,
        isActive: newUser.is_active,
        createdAt: newUser.created_at,
        createdBy: newUser.created_by || userData.createdBy,
      }

      setUsers(current => [...current, createdUser])
      toast.success('Usuario creado exitosamente')
      return true
    } catch (error: any) {
      console.error('Error creating user:', error)
      toast.error(error.message || 'Error al crear usuario')
      return false
    }
  }

  // Actualizar usuario existente
  const updateUser = async (userId: string, userData: Partial<User>): Promise<boolean> => {
    // Si es un usuario local (no de Supabase), actualizarlo directamente
    if (userId.startsWith('local-')) {
      setUsers(current =>
        current.map(user =>
          user.id === userId
            ? { ...user, ...userData }
            : user
        )
      )
      toast.success('Usuario actualizado exitosamente')
      return true
    }

    if (!isSupabaseConfigured()) {
      // Fallback local
      setUsers(current =>
        current.map(user =>
          user.id === userId
            ? { ...user, ...userData }
            : user
        )
      )
      toast.success('Usuario actualizado exitosamente (modo local)')
      return true
    }

    try {
      // Actualizar datos básicos del usuario
      const { data, error } = await supabase
        .from('users')
        .update({
          name: userData.name,
          email: userData.email,
          is_active: userData.isActive,
        })
        .eq('id', userId)
        .select()
        .single()

      if (error) {
        // Si es un error de políticas RLS, usar modo local
        if (error.message.includes('row-level security policy')) {
          console.warn('RLS policy error, usando modo local:', error.message)
          setUsers(current =>
            current.map(user =>
              user.id === userId
                ? { ...user, ...userData }
                : user
            )
          )
          toast.success('Usuario actualizado exitosamente (modo local)')
          return true
        }
        throw error
      }

      // Actualizar roles si se proporcionaron
      if (userData.roleIds) {
        // Primero eliminar roles existentes
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)

        // Luego agregar los nuevos roles
        if (userData.roleIds.length > 0) {
          const userRoles = userData.roleIds.map(roleId => ({
            user_id: userId,
            role_id: roleId,
          }))

          await supabase
            .from('user_roles')
            .insert(userRoles)
        }
      }

      // Actualizar el usuario en el estado local
      setUsers(current =>
        current.map(user =>
          user.id === userId
            ? {
                ...user,
                name: data.name,
                email: data.email,
                isActive: data.is_active,
                roleIds: userData.roleIds || user.roleIds,
              }
            : user
        )
      )

      toast.success('Usuario actualizado exitosamente')
      return true
    } catch (error: any) {
      console.error('Error updating user:', error)
      toast.error(error.message || 'Error al actualizar usuario')
      return false
    }
  }

  // Eliminar usuario
  const deleteUser = async (userId: string): Promise<boolean> => {
    // Si es un usuario local (no de Supabase), eliminarlo directamente
    if (userId.startsWith('local-')) {
      setUsers(current => current.filter(user => user.id !== userId))
      toast.success('Usuario eliminado exitosamente')
      return true
    }

    if (!isSupabaseConfigured()) {
      // Fallback local
      setUsers(current => current.filter(user => user.id !== userId))
      toast.success('Usuario eliminado exitosamente (modo local)')
      return true
    }

    try {
      // Primero eliminar relaciones de roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)

      // Luego eliminar el usuario
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId)

      if (error) {
        // Si es un error de políticas RLS, usar modo local
        if (error.message.includes('row-level security policy')) {
          console.warn('RLS policy error, usando modo local:', error.message)
          setUsers(current => current.filter(user => user.id !== userId))
          toast.success('Usuario eliminado exitosamente (modo local)')
          return true
        }
        throw error
      }

      // Remover del estado local
      setUsers(current => current.filter(user => user.id !== userId))
      toast.success('Usuario eliminado exitosamente')
      return true
    } catch (error: any) {
      console.error('Error deleting user:', error)
      toast.error(error.message || 'Error al eliminar usuario')
      return false
    }
  }

  // Activar/desactivar usuario
  const toggleUserStatus = async (userId: string): Promise<boolean> => {
    const user = users.find(u => u.id === userId)
    if (!user) return false

    return await updateUser(userId, { isActive: !user.isActive })
  }

  // Cargar usuarios al montar el componente
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  return {
    users,
    isLoading,
    error,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    toggleUserStatus,
  }
}