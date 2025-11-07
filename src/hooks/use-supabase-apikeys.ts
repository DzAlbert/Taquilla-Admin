/**
 * 🔑 HOOK PARA GESTIÓN DE API KEYS CON SUPABASE + LOCALSTORAGE
 * Módulo 10: Integración completa con fallback a localStorage
 */

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { ApiKey, ApiKeyPermission } from '@/lib/types'

// Configuración de Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

// Tipos específicos para el hook
interface ApiKeyStats {
  totalKeys: number
  activeKeys: number
  inactiveKeys: number
  usedToday: number
  usedThisWeek: number
  createdThisMonth: number
  avgPermissionsPerKey: number
  mostRecentUsage: string | null
}

interface UseSupabaseApiKeysReturn {
  apiKeys: ApiKey[]
  isLoading: boolean
  error: string | null
  stats: ApiKeyStats | null
  
  // CRUD Operations
  createApiKey: (apiKeyData: Omit<ApiKey, 'id' | 'createdAt' | 'key'>) => Promise<{ key: string; success: boolean }>
  updateApiKey: (id: string, updates: Partial<ApiKey>) => Promise<boolean>
  deleteApiKey: (id: string) => Promise<boolean>
  revokeApiKey: (id: string) => Promise<boolean>
  
  // Utilities
  verifyApiKey: (keyHash: string) => Promise<{ isValid: boolean; permissions: ApiKeyPermission[]; keyInfo?: any }>
  generateSecureApiKey: () => string
  refreshApiKeys: () => Promise<void>
  testConnection: () => Promise<boolean>
}

/**
 * Hook para gestionar API Keys con integración Supabase + localStorage fallback
 */
export function useSupabaseApiKeys(): UseSupabaseApiKeysReturn {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<ApiKeyStats | null>(null)

  // Función para generar API Key segura
  const generateSecureApiKey = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    let key = "sk_"
    
    // Agregar timestamp para unicidad
    const timestamp = Date.now().toString(36)
    key += timestamp.slice(-4) + "_"
    
    // Generar 40 caracteres aleatorios adicionales
    for (let i = 0; i < 40; i++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return key
  }

  // Función para crear hash SHA-256 de la API key
  const createKeyHash = async (apiKey: string): Promise<string> => {
    const encoder = new TextEncoder()
    const data = encoder.encode(apiKey)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Función para obtener el prefijo de la key
  const getKeyPrefix = (key: string): string => {
    return key.substring(0, 7) // sk_xxxx
  }

  // Test connection to Supabase
  const testConnection = async (): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .select('count')
        .limit(1)
      
      return !error
    } catch (err) {
      console.warn('Supabase no disponible, usando localStorage:', err)
      return false
    }
  }

  // Cargar API Keys desde Supabase o localStorage
  const loadApiKeys = async (): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const isConnected = await testConnection()
      
      if (isConnected) {
        console.log('🔑 Cargando API Keys desde Supabase...')
        
        const { data, error: supabaseError } = await supabase
          .from('api_keys')
          .select(`
            id,
            name,
            key_prefix,
            description,
            is_active,
            permissions,
            created_at,
            created_by,
            last_used_at,
            updated_at
          `)
          .order('created_at', { ascending: false })

        if (supabaseError) {
          throw new Error(`Error Supabase: ${supabaseError.message}`)
        }

        // Transformar datos de Supabase al formato local
        const transformedKeys: ApiKey[] = (data || []).map(item => ({
          id: item.id,
          name: item.name,
          key: `${item.key_prefix}••••••••••••••••••••••••••••••••••••••••••••••`,
          description: item.description,
          isActive: item.is_active,
          permissions: Array.isArray(item.permissions) ? item.permissions : [],
          createdAt: item.created_at,
          createdBy: item.created_by,
          lastUsed: item.last_used_at
        }))

        setApiKeys(transformedKeys)
        
        // Cargar estadísticas si están disponibles
        await loadStats()
        
        console.log(`✅ ${transformedKeys.length} API Keys cargadas desde Supabase`)
      } else {
        // Fallback a localStorage
        console.log('📱 Usando localStorage para API Keys...')
        const localKeys = localStorage.getItem('apiKeys')
        if (localKeys) {
          const parsedKeys = JSON.parse(localKeys)
          setApiKeys(Array.isArray(parsedKeys) ? parsedKeys : [])
          console.log(`✅ ${parsedKeys.length || 0} API Keys cargadas desde localStorage`)
        } else {
          setApiKeys([])
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido'
      console.error('❌ Error cargando API Keys:', errorMessage)
      setError(errorMessage)
      
      // Fallback a localStorage en caso de error
      try {
        const localKeys = localStorage.getItem('apiKeys')
        if (localKeys) {
          setApiKeys(JSON.parse(localKeys))
          console.log('🔄 Datos cargados desde localStorage como respaldo')
        }
      } catch (localError) {
        console.error('❌ Error también en localStorage:', localError)
        setApiKeys([])
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Cargar estadísticas
  const loadStats = async (): Promise<void> => {
    try {
      const { data, error } = await supabase
        .from('api_keys_stats')
        .select('*')
        .single()

      if (!error && data) {
        setStats({
          totalKeys: data.total_keys || 0,
          activeKeys: data.active_keys || 0,
          inactiveKeys: data.inactive_keys || 0,
          usedToday: data.used_today || 0,
          usedThisWeek: data.used_this_week || 0,
          createdThisMonth: data.created_this_month || 0,
          avgPermissionsPerKey: data.avg_permissions_per_key || 0,
          mostRecentUsage: data.most_recent_usage
        })
      }
    } catch (err) {
      console.warn('No se pudieron cargar las estadísticas:', err)
    }
  }

  // Crear nueva API Key
  const createApiKey = async (apiKeyData: Omit<ApiKey, 'id' | 'createdAt' | 'key'>): Promise<{ key: string; success: boolean }> => {
    try {
      const isConnected = await testConnection()
      const newKey = generateSecureApiKey()
      const keyHash = await createKeyHash(newKey)
      const keyPrefix = getKeyPrefix(newKey)
      
      const newApiKey: ApiKey = {
        id: crypto.randomUUID(),
        key: newKey,
        createdAt: new Date().toISOString(),
        ...apiKeyData
      }

      if (isConnected) {
        console.log('💾 Creando API Key en Supabase...')
        
        const { error } = await supabase
          .from('api_keys')
          .insert({
            id: newApiKey.id,
            name: apiKeyData.name,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            description: apiKeyData.description,
            is_active: apiKeyData.isActive,
            permissions: apiKeyData.permissions,
            created_by: apiKeyData.createdBy
          })

        if (error) {
          throw new Error(`Error creando API Key: ${error.message}`)
        }

        console.log('✅ API Key creada en Supabase')
      } else {
        console.log('💾 Guardando API Key en localStorage...')
      }

      // Actualizar estado local
      const updatedKeys = [newApiKey, ...apiKeys]
      setApiKeys(updatedKeys)
      
      // Guardar en localStorage siempre como respaldo
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys))
      
      // Recargar para obtener datos actualizados
      await loadApiKeys()
      
      return { key: newKey, success: true }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error creando API Key'
      console.error('❌ Error:', errorMessage)
      setError(errorMessage)
      return { key: '', success: false }
    }
  }

  // Actualizar API Key
  const updateApiKey = async (id: string, updates: Partial<ApiKey>): Promise<boolean> => {
    try {
      const isConnected = await testConnection()
      
      if (isConnected) {
        console.log('🔄 Actualizando API Key en Supabase...')
        
        // Preparar datos para Supabase
        const supabaseUpdates: any = {}
        if (updates.name !== undefined) supabaseUpdates.name = updates.name
        if (updates.description !== undefined) supabaseUpdates.description = updates.description
        if (updates.isActive !== undefined) supabaseUpdates.is_active = updates.isActive
        if (updates.permissions !== undefined) supabaseUpdates.permissions = updates.permissions

        const { error } = await supabase
          .from('api_keys')
          .update(supabaseUpdates)
          .eq('id', id)

        if (error) {
          throw new Error(`Error actualizando API Key: ${error.message}`)
        }

        console.log('✅ API Key actualizada en Supabase')
      }

      // Actualizar estado local
      const updatedKeys = apiKeys.map(key => 
        key.id === id ? { ...key, ...updates } : key
      )
      setApiKeys(updatedKeys)
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys))
      
      // Recargar datos
      await loadApiKeys()
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error actualizando API Key'
      console.error('❌ Error:', errorMessage)
      setError(errorMessage)
      return false
    }
  }

  // Eliminar API Key
  const deleteApiKey = async (id: string): Promise<boolean> => {
    try {
      const isConnected = await testConnection()
      
      if (isConnected) {
        console.log('🗑️ Eliminando API Key de Supabase...')
        
        const { error } = await supabase
          .from('api_keys')
          .delete()
          .eq('id', id)

        if (error) {
          throw new Error(`Error eliminando API Key: ${error.message}`)
        }

        console.log('✅ API Key eliminada de Supabase')
      }

      // Actualizar estado local
      const updatedKeys = apiKeys.filter(key => key.id !== id)
      setApiKeys(updatedKeys)
      localStorage.setItem('apiKeys', JSON.stringify(updatedKeys))
      
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error eliminando API Key'
      console.error('❌ Error:', errorMessage)
      setError(errorMessage)
      return false
    }
  }

  // Revocar API Key (desactivar)
  const revokeApiKey = async (id: string): Promise<boolean> => {
    return await updateApiKey(id, { isActive: false })
  }

  // Verificar API Key
  const verifyApiKey = async (keyHash: string): Promise<{ isValid: boolean; permissions: ApiKeyPermission[]; keyInfo?: any }> => {
    try {
      const isConnected = await testConnection()
      
      if (isConnected) {
        const { data, error } = await supabase
          .rpc('verify_api_key', { api_key_hash: keyHash })

        if (error) {
          throw new Error(`Error verificando API Key: ${error.message}`)
        }

        if (data && data.length > 0) {
          const result = data[0]
          return {
            isValid: result.is_valid,
            permissions: Array.isArray(result.permissions) ? result.permissions : [],
            keyInfo: result
          }
        }
      }

      // Fallback local (búsqueda por hash simulado)
      const localKey = apiKeys.find(key => key.key.includes(keyHash.substring(0, 8)))
      if (localKey && localKey.isActive) {
        return {
          isValid: true,
          permissions: localKey.permissions,
          keyInfo: localKey
        }
      }

      return { isValid: false, permissions: [] }
      
    } catch (err) {
      console.error('❌ Error verificando API Key:', err)
      return { isValid: false, permissions: [] }
    }
  }

  // Refresh manual de los datos
  const refreshApiKeys = async (): Promise<void> => {
    await loadApiKeys()
  }

  // Cargar datos al montar el componente
  useEffect(() => {
    loadApiKeys()
  }, [])

  return {
    apiKeys,
    isLoading,
    error,
    stats,
    createApiKey,
    updateApiKey,
    deleteApiKey,
    revokeApiKey,
    verifyApiKey,
    generateSecureApiKey,
    refreshApiKeys,
    testConnection
  }
}