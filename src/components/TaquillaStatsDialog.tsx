import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Taquilla } from "@/lib/types"
import { formatCurrency } from "@/lib/pot-utils"
import { format } from "date-fns"
import { ChartBar, Ticket, X, Check, GameController, Bird, MagnifyingGlass, Spinner } from "@phosphor-icons/react"
import { supabase, isSupabaseConfigured } from "@/lib/supabase"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  taquilla: Taquilla | null
}

interface BetStats {
  totalSales: number
  activeTickets: number
  cancelledTickets: number
  mikaelaActive: number
  mikaelaCancelled: number
  polloLlenoActive: number
  polloLlenoCancelled: number
}

export function TaquillaStatsDialog({ open, onOpenChange, taquilla }: Props) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(today)
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<BetStats | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    if (!taquilla || !isSupabaseConfigured()) {
      setError('Configuración no disponible')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Consultar bets filtradas por user_id y rango de fechas
      const { data: bets, error: queryError } = await supabase
        .from('bets')
        .select('amount, status, games')
        .eq('user_id', taquilla.id)
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)

      if (queryError) throw queryError

      if (!bets || bets.length === 0) {
        setStats({
          totalSales: 0,
          activeTickets: 0,
          cancelledTickets: 0,
          mikaelaActive: 0,
          mikaelaCancelled: 0,
          polloLlenoActive: 0,
          polloLlenoCancelled: 0
        })
        return
      }

      // Calcular estadísticas
      const totalSales = bets
        .filter(b => b.status === 'active')
        .reduce((sum, b) => sum + (Number(b.amount) || 0), 0)

      const activeTickets = bets.filter(b => b.status === 'active').length
      const cancelledTickets = bets.filter(b => b.status === 'cancelled').length

      // Contar tickets por tipo de juego y estado
      const mikaelaBets = bets.filter(b =>
        b.games && Array.isArray(b.games) && b.games.includes('clasic')
      )
      const mikaelaActive = mikaelaBets.filter(b => b.status === 'active').length
      const mikaelaCancelled = mikaelaBets.filter(b => b.status === 'cancelled').length

      const polloLlenoBets = bets.filter(b =>
        b.games && Array.isArray(b.games) && b.games.includes('pollolleno')
      )
      const polloLlenoActive = polloLlenoBets.filter(b => b.status === 'active').length
      const polloLlenoCancelled = polloLlenoBets.filter(b => b.status === 'cancelled').length

      setStats({
        totalSales,
        activeTickets,
        cancelledTickets,
        mikaelaActive,
        mikaelaCancelled,
        polloLlenoActive,
        polloLlenoCancelled
      })
    } catch (err: any) {
      console.error('Error fetching stats:', err)
      setError(err.message || 'Error al cargar estadísticas')
    } finally {
      setLoading(false)
    }
  }

  // Cargar stats cuando se abre el diálogo
  useEffect(() => {
    if (open && taquilla) {
      fetchStats()
    }
  }, [open, taquilla])

  if (!taquilla) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Estadísticas de Taquilla</DialogTitle>
          <DialogDescription>
            Resumen de ventas para {taquilla.fullName}
          </DialogDescription>
        </DialogHeader>

        {/* Selector de rango de fechas */}
        <div className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-muted/50">
          <div className="flex-1 grid gap-2">
            <Label htmlFor="start-date">Fecha Inicio</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex-1 grid gap-2">
            <Label htmlFor="end-date">Fecha Fin</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={fetchStats} disabled={loading}>
              {loading ? (
                <Spinner className="h-4 w-4 animate-spin" />
              ) : (
                <MagnifyingGlass className="h-4 w-4" />
              )}
              <span className="ml-2">Buscar</span>
            </Button>
          </div>
        </div>

        {error && (
          <div className="p-4 text-center text-destructive bg-destructive/10 rounded-lg">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-muted-foreground">
            <Spinner className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p>Cargando estadísticas...</p>
          </div>
        ) : stats ? (
          <div className="grid gap-4 py-4">
            {/* Ventas Totales */}
            <Card className="bg-primary/5 border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ventas Totales
                </CardTitle>
                <ChartBar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">{formatCurrency(stats.totalSales)}</div>
              </CardContent>
            </Card>

            {/* Tickets por Estado */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tickets Activos
                  </CardTitle>
                  <Check className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.activeTickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Tickets Cancelados
                  </CardTitle>
                  <X className="h-4 w-4 text-red-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.cancelledTickets}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tickets por Tipo de Juego */}
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Juegos Mikaela
                  </CardTitle>
                  <GameController className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">{stats.mikaelaActive + stats.mikaelaCancelled}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.mikaelaActive} activos / {stats.mikaelaCancelled} cancelados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Juegos Pollo Lleno
                  </CardTitle>
                  <Bird className="h-4 w-4 text-orange-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.polloLlenoActive + stats.polloLlenoCancelled}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.polloLlenoActive} activos / {stats.polloLlenoCancelled} cancelados
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Resumen Total */}
            <div className="rounded-md border p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium">Total de Tickets</span>
                </div>
                <span className="text-xl font-bold">{stats.activeTickets + stats.cancelledTickets}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No hay datos disponibles para el rango seleccionado.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
