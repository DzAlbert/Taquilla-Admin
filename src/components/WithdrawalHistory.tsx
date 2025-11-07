import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  CalendarBlank, 
  MagnifyingGlass, 
  CurrencyCircleDollar, 
  Export,
  Funnel,
  Clock,
  Bank,
  DownloadSimple
} from "@phosphor-icons/react"
import { formatCurrency } from "@/lib/pot-utils"
import { Withdrawal, Pot } from "@/lib/types"
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns"
import { es } from "date-fns/locale"

interface WithdrawalHistoryProps {
  withdrawals: Withdrawal[]
  pots: Pot[]
  isLoading?: boolean
  onExport?: () => void
}

interface WithdrawalFilters {
  search: string
  potName: string
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  sortBy: 'date' | 'amount' | 'pot'
  sortOrder: 'asc' | 'desc'
}

export function WithdrawalHistory({ 
  withdrawals, 
  pots, 
  isLoading = false,
  onExport 
}: WithdrawalHistoryProps) {
  const [filters, setFilters] = useState<WithdrawalFilters>({
    search: '',
    potName: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    sortBy: 'date',
    sortOrder: 'desc'
  })

  const [showFilters, setShowFilters] = useState(false)

  // Filtrar y ordenar retiros
  const filteredWithdrawals = useMemo(() => {
    let filtered = withdrawals

    // Filtro por búsqueda (nombre de pote)
    if (filters.search) {
      filtered = filtered.filter(w => 
        w.fromPot.toLowerCase().includes(filters.search.toLowerCase()) ||
        w.id.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Filtro por pote específico
    if (filters.potName) {
      filtered = filtered.filter(w => w.fromPot === filters.potName)
    }

    // Filtro por rango de fechas
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(w => {
        const withdrawalDate = parseISO(w.timestamp)
        const fromDate = filters.dateFrom ? startOfDay(parseISO(filters.dateFrom)) : new Date(0)
        const toDate = filters.dateTo ? endOfDay(parseISO(filters.dateTo)) : new Date()
        
        return isWithinInterval(withdrawalDate, { start: fromDate, end: toDate })
      })
    }

    // Filtro por monto
    if (filters.amountMin || filters.amountMax) {
      filtered = filtered.filter(w => {
        const min = filters.amountMin ? Number(filters.amountMin) : 0
        const max = filters.amountMax ? Number(filters.amountMax) : Infinity
        return w.amount >= min && w.amount <= max
      })
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0
      
      switch (filters.sortBy) {
        case 'date':
          comparison = new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          break
        case 'amount':
          comparison = a.amount - b.amount
          break
        case 'pot':
          comparison = a.fromPot.localeCompare(b.fromPot)
          break
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison
    })

    return sorted
  }, [withdrawals, filters])

  // Estadísticas calculadas
  const stats = useMemo(() => {
    const totalAmount = filteredWithdrawals.reduce((sum, w) => sum + w.amount, 0)
    const averageAmount = filteredWithdrawals.length > 0 ? totalAmount / filteredWithdrawals.length : 0
    
    // Agrupar por pote
    const byPot = filteredWithdrawals.reduce((acc, w) => {
      acc[w.fromPot] = (acc[w.fromPot] || 0) + w.amount
      return acc
    }, {} as Record<string, number>)

    return {
      totalAmount,
      averageAmount,
      count: filteredWithdrawals.length,
      byPot
    }
  }, [filteredWithdrawals])

  // Limpiar filtros
  const clearFilters = () => {
    setFilters({
      search: '',
      potName: '',
      dateFrom: '',
      dateTo: '',
      amountMin: '',
      amountMax: '',
      sortBy: 'date',
      sortOrder: 'desc'
    })
  }

  // Obtener color del pote
  const getPotColor = (potName: string) => {
    const pot = pots.find(p => p.name === potName)
    return pot?.color || '#6b7280'
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CurrencyCircleDollar className="h-5 w-5" />
              Historial de Retiros
            </CardTitle>
            <CardDescription>
              Registro completo de todos los retiros realizados
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Funnel className="h-4 w-4" />
              Filtros
            </Button>
            
            {onExport && (
              <Button variant="outline" size="sm" onClick={onExport}>
                <Export className="h-4 w-4" />
                Exportar
              </Button>
            )}
          </div>
        </div>

        {/* Estadísticas rápidas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-accent/10 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Total Retirado</p>
            <p className="text-xl font-semibold text-accent">
              {formatCurrency(stats.totalAmount)}
            </p>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Cantidad</p>
            <p className="text-xl font-semibold text-blue-600">
              {stats.count} retiros
            </p>
          </div>
          
          <div className="bg-green-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Promedio</p>
            <p className="text-xl font-semibold text-green-600">
              {formatCurrency(stats.averageAmount)}
            </p>
          </div>
          
          <div className="bg-purple-50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">Potes Únicos</p>
            <p className="text-xl font-semibold text-purple-600">
              {Object.keys(stats.byPot).length}
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Panel de filtros */}
        {showFilters && (
          <div className="border rounded-lg p-4 space-y-4 bg-muted/30">
            <div className="flex items-center justify-between">
              <Label className="font-medium">Filtros de Búsqueda</Label>
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpiar
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Búsqueda general */}
              <div className="space-y-2">
                <Label>Buscar</Label>
                <div className="relative">
                  <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="ID o nombre de pote..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Filtro por pote */}
              <div className="space-y-2">
                <Label>Pote</Label>
                <Select 
                  value={filters.potName} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, potName: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todos los potes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Todos los potes</SelectItem>
                    {pots.map((pot) => (
                      <SelectItem key={pot.name} value={pot.name}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: pot.color }}
                          />
                          {pot.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fecha desde */}
              <div className="space-y-2">
                <Label>Desde</Label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>

              {/* Fecha hasta */}
              <div className="space-y-2">
                <Label>Hasta</Label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>

              {/* Monto mínimo */}
              <div className="space-y-2">
                <Label>Monto Mínimo</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={filters.amountMin}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                />
              </div>

              {/* Monto máximo */}
              <div className="space-y-2">
                <Label>Monto Máximo</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Sin límite"
                  value={filters.amountMax}
                  onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                />
              </div>
            </div>

            {/* Ordenamiento */}
            <div className="flex items-center gap-4">
              <div className="space-y-2">
                <Label>Ordenar por</Label>
                <Select 
                  value={filters.sortBy} 
                  onValueChange={(value: 'date' | 'amount' | 'pot') => 
                    setFilters(prev => ({ ...prev, sortBy: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Fecha</SelectItem>
                    <SelectItem value="amount">Monto</SelectItem>
                    <SelectItem value="pot">Pote</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Orden</Label>
                <Select 
                  value={filters.sortOrder} 
                  onValueChange={(value: 'asc' | 'desc') => 
                    setFilters(prev => ({ ...prev, sortOrder: value }))
                  }
                >
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="desc">Descendente</SelectItem>
                    <SelectItem value="asc">Ascendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Lista de retiros */}
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Cargando retiros...
          </div>
        ) : filteredWithdrawals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {withdrawals.length === 0 
              ? "No hay retiros registrados" 
              : "No se encontraron retiros con los filtros aplicados"
            }
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-3">
              {filteredWithdrawals.map((withdrawal, index) => (
                <div key={withdrawal.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    {/* Información del retiro */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: getPotColor(withdrawal.fromPot) }}
                        />
                        <div>
                          <p className="font-medium">{withdrawal.fromPot}</p>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(parseISO(withdrawal.timestamp), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right">
                      <p className="text-lg font-semibold text-red-600">
                        -{formatCurrency(withdrawal.amount)}
                      </p>
                      <Badge variant="outline" className="text-xs">
                        ID: {withdrawal.id.substring(0, 8)}...
                      </Badge>
                    </div>
                  </div>

                  {index < filteredWithdrawals.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Resumen por pote */}
        {Object.keys(stats.byPot).length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <Bank className="h-4 w-4" />
              Resumen por Pote
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(stats.byPot).map(([potName, amount]) => (
                <div key={potName} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getPotColor(potName) }}
                    />
                    <span className="text-sm font-medium">{potName}</span>
                  </div>
                  <span className="text-sm font-semibold text-red-600">
                    -{formatCurrency(amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
