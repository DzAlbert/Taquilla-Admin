import { useState, useCallback, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { toast } from 'sonner'
import { Withdrawal, Pot } from '@/lib/types'

// Configuración Supabase
const supabaseUrl = 'https://dxfivioylmbpumzcpwtu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR4Zml2aW95bG1icHVtemNwd3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNTI0MTksImV4cCI6MjA3NzgyODQxOX0.QlDhKclyo55RHIlz4sQC2G7yBy-L4KsZiaMBpWhXs-w'

const supabase = createClient(supabaseUrl, supabaseKey)

interface SupabaseWithdrawal {
  id: string
  from_pot: string
  amount: number
  created_at: string
  created_by?: string
}

interface WithdrawalStats {
  totalAmount: number
  count: number
  lastWithdrawal?: Withdrawal
  averageAmount: number
}

interface WithdrawalFilters {
  potName?: string
  dateFrom?: string
  dateTo?: string
  amountMin?: number
  amountMax?: number
}

export function useSupabaseWithdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [withdrawalStats, setWithdrawalStats] = useState<WithdrawalStats>({
    totalAmount: 0,
    count: 0,
    averageAmount: 0
  })

  // Mapear datos de Supabase a nuestro formato
  const mapSupabaseWithdrawal = (supabaseWithdrawal: SupabaseWithdrawal): Withdrawal => ({
    id: supabaseWithdrawal.id,
    fromPot: supabaseWithdrawal.from_pot,
    amount: supabaseWithdrawal.amount,
    timestamp: supabaseWithdrawal.created_at
  })

  // Test de conexión
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('withdrawals')
        .select('id')
        .limit(1)

      if (error) {
        console.log('❌ Error conexión withdrawals:', error.message)
        setIsConnected(false)
        return false
      }

      console.log('✅ Conexión withdrawals OK')
      setIsConnected(true)
      return true
    } catch (err) {
      console.log('💥 Error test conexión:', err)
      setIsConnected(false)
      return false
    }
  }, [])

  // Cargar retiros
  const loadWithdrawals = useCallback(async (filters?: WithdrawalFilters) => {
    try {
      setIsLoading(true)
      
      if (!await testConnection()) {
        // Cargar desde localStorage como fallback
        const localWithdrawals = JSON.parse(localStorage.getItem('supabase_withdrawals_backup_v2') || '[]')
        setWithdrawals(localWithdrawals)
        calculateStats(localWithdrawals)
        return localWithdrawals
      }

      let query = supabase
        .from('withdrawals')
        .select('*')
        .order('created_at', { ascending: false })

      // Aplicar filtros si están presentes
      if (filters) {
        if (filters.potName) {
          query = query.eq('from_pot', filters.potName)
        }
        if (filters.dateFrom) {
          query = query.gte('created_at', filters.dateFrom)
        }
        if (filters.dateTo) {
          query = query.lte('created_at', filters.dateTo)
        }
        if (filters.amountMin) {
          query = query.gte('amount', filters.amountMin)
        }
        if (filters.amountMax) {
          query = query.lte('amount', filters.amountMax)
        }
      }

      const { data: supabaseWithdrawals, error } = await query

      if (error) {
        console.log('❌ Error cargando retiros:', error.message)
        const localWithdrawals = JSON.parse(localStorage.getItem('supabase_withdrawals_backup_v2') || '[]')
        setWithdrawals(localWithdrawals)
        calculateStats(localWithdrawals)
        return localWithdrawals
      }

      const mappedWithdrawals = supabaseWithdrawals.map(mapSupabaseWithdrawal)
      setWithdrawals(mappedWithdrawals)
      localStorage.setItem('supabase_withdrawals_backup_v2', JSON.stringify(mappedWithdrawals))
      calculateStats(mappedWithdrawals)
      
      console.log(`✅ ${mappedWithdrawals.length} retiros cargados`)
      return mappedWithdrawals

    } catch (err) {
      console.log('💥 Error cargando retiros:', err)
      const localWithdrawals = JSON.parse(localStorage.getItem('supabase_withdrawals_backup_v2') || '[]')
      setWithdrawals(localWithdrawals)
      calculateStats(localWithdrawals)
      return localWithdrawals
    } finally {
      setIsLoading(false)
    }
  }, [testConnection])

  // Calcular estadísticas
  const calculateStats = useCallback((withdrawalsList: Withdrawal[]) => {
    const totalAmount = withdrawalsList.reduce((sum, w) => sum + w.amount, 0)
    const count = withdrawalsList.length
    const averageAmount = count > 0 ? totalAmount / count : 0
    const lastWithdrawal = withdrawalsList[0] // Ya están ordenados por fecha desc

    setWithdrawalStats({
      totalAmount,
      count,
      averageAmount,
      lastWithdrawal
    })
  }, [])

  // Crear retiro
  const createWithdrawal = useCallback(async (
    fromPot: Pot, 
    amount: number, 
    updatePotBalance?: (potName: string, newBalance: number) => Promise<void>
  ): Promise<boolean> => {
    try {
      console.log(`💸 Creando retiro: Bs. ${amount} de ${fromPot.name}`)

      // Validar balance suficiente
      if (fromPot.balance < amount) {
        console.log(`❌ Balance insuficiente: ${fromPot.balance} < ${amount}`)
        toast.error('Balance insuficiente para el retiro')
        return false
      }

      const connectionOK = await testConnection()
      let withdrawalId = `local-${Date.now()}`
      let supabaseSuccess = false

      if (connectionOK) {
        console.log('🔗 Registrando retiro en Supabase...')
        
        const withdrawalData = {
          from_pot: fromPot.name,
          amount: amount,
          created_at: new Date().toISOString()
        }
        
        const { data: createdWithdrawal, error } = await supabase
          .from('withdrawals')
          .insert(withdrawalData)
          .select()
          .single()

        if (error) {
          console.log('❌ Error creando retiro:', error.message)
          toast.error(`Error: ${error.message}`)
          return false
        } else {
          withdrawalId = createdWithdrawal.id
          supabaseSuccess = true
          console.log('✅ Retiro registrado en Supabase:', withdrawalId)
        }
      }

      // Actualizar balance del pote si se proporciona la función
      if (updatePotBalance) {
        const newBalance = fromPot.balance - amount
        await updatePotBalance(fromPot.name, newBalance)
        console.log(`📊 Balance actualizado: ${fromPot.name} = Bs. ${newBalance}`)
      }

      // Agregar retiro a la lista local
      const newWithdrawal: Withdrawal = {
        id: withdrawalId,
        fromPot: fromPot.name,
        amount: amount,
        timestamp: new Date().toISOString()
      }

      const updatedWithdrawals = [newWithdrawal, ...withdrawals]
      setWithdrawals(updatedWithdrawals)
      localStorage.setItem('supabase_withdrawals_backup_v2', JSON.stringify(updatedWithdrawals))
      calculateStats(updatedWithdrawals)

      if (supabaseSuccess) {
        toast.success(`Retiro de Bs. ${amount} realizado exitosamente`)
      } else {
        toast.warning('Retiro guardado localmente (sin conexión)')
      }
      
      return true

    } catch (err) {
      console.log('💥 Error creando retiro:', err)
      toast.error('Error al realizar retiro')
      return false
    }
  }, [withdrawals, testConnection, calculateStats])

  // Eliminar retiro (solo para casos especiales)
  const deleteWithdrawal = useCallback(async (withdrawalId: string): Promise<boolean> => {
    try {
      console.log(`🗑️ Eliminando retiro: ${withdrawalId}`)

      const connectionOK = await testConnection()
      
      if (connectionOK) {
        const { error } = await supabase
          .from('withdrawals')
          .delete()
          .eq('id', withdrawalId)

        if (error) {
          console.log('❌ Error eliminando retiro:', error.message)
          toast.error(`Error: ${error.message}`)
          return false
        }

        console.log('✅ Retiro eliminado de Supabase')
      }

      // Actualizar lista local
      const updatedWithdrawals = withdrawals.filter(w => w.id !== withdrawalId)
      setWithdrawals(updatedWithdrawals)
      localStorage.setItem('supabase_withdrawals_backup_v2', JSON.stringify(updatedWithdrawals))
      calculateStats(updatedWithdrawals)

      toast.success('Retiro eliminado exitosamente')
      return true

    } catch (err) {
      console.log('💥 Error eliminando retiro:', err)
      toast.error('Error al eliminar retiro')
      return false
    }
  }, [withdrawals, testConnection, calculateStats])

  // Obtener retiros por pote
  const getWithdrawalsByPot = useCallback((potName: string) => {
    return withdrawals.filter(w => w.fromPot === potName)
  }, [withdrawals])

  // Obtener retiros por rango de fechas
  const getWithdrawalsByDateRange = useCallback((from: Date, to: Date) => {
    return withdrawals.filter(w => {
      const withdrawalDate = new Date(w.timestamp)
      return withdrawalDate >= from && withdrawalDate <= to
    })
  }, [withdrawals])

  // Sincronizar datos offline
  const syncOfflineWithdrawals = useCallback(async () => {
    try {
      const offlineQueue = JSON.parse(localStorage.getItem('withdrawals_offline_queue') || '[]')
      
      if (offlineQueue.length === 0) {
        console.log('📭 No hay retiros offline para sincronizar')
        return true
      }

      const connectionOK = await testConnection()
      if (!connectionOK) {
        console.log('❌ Sin conexión para sincronizar')
        return false
      }

      console.log(`🔄 Sincronizando ${offlineQueue.length} retiros offline...`)

      for (const item of offlineQueue) {
        if (item.type === 'withdrawal') {
          const { data, error } = await supabase
            .from('withdrawals')
            .insert({
              from_pot: item.data.from_pot,
              amount: item.data.amount,
              created_at: item.data.created_at
            })
            .select()
            .single()

          if (error) {
            console.log('❌ Error sincronizando retiro:', error.message)
          } else {
            console.log('✅ Retiro sincronizado:', data.id)
          }
        }
      }

      // Limpiar cola después de sincronizar
      localStorage.removeItem('withdrawals_offline_queue')
      
      // Recargar datos actualizados
      await loadWithdrawals()
      
      toast.success('Retiros sincronizados exitosamente')
      return true

    } catch (err) {
      console.log('💥 Error sincronizando retiros offline:', err)
      return false
    }
  }, [testConnection, loadWithdrawals])

  // Cargar datos al inicializar
  useEffect(() => {
    loadWithdrawals()
  }, [loadWithdrawals])

  return {
    // Estado
    withdrawals,
    isLoading,
    isConnected,
    withdrawalStats,
    
    // Funciones principales
    loadWithdrawals,
    createWithdrawal,
    deleteWithdrawal,
    testConnection,
    
    // Utilidades
    getWithdrawalsByPot,
    getWithdrawalsByDateRange,
    syncOfflineWithdrawals
  }
}