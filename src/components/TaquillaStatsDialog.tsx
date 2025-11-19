import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Taquilla, Bet, User } from "@/lib/types"
import { formatCurrency } from "@/lib/pot-utils"
import { useMemo } from "react"
import { startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns"
import { ChartBar, TrendUp, Calendar, Ticket } from "@phosphor-icons/react"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  taquilla: Taquilla | null
  bets: Bet[]
  user?: User
}

export function TaquillaStatsDialog({ open, onOpenChange, taquilla, bets, user }: Props) {
  const stats = useMemo(() => {
    if (!taquilla || !user) return null

    const userBets = bets.filter(b => b.userId === user.id)
    const now = new Date()
    const today = startOfDay(now)
    const week = startOfWeek(now, { weekStartsOn: 1 })
    const month = startOfMonth(now)

    const salesToday = userBets
      .filter(b => isAfter(new Date(b.timestamp), today))
      .reduce((sum, b) => sum + b.amount, 0)

    const salesWeek = userBets
      .filter(b => isAfter(new Date(b.timestamp), week))
      .reduce((sum, b) => sum + b.amount, 0)

    const salesMonth = userBets
      .filter(b => isAfter(new Date(b.timestamp), month))
      .reduce((sum, b) => sum + b.amount, 0)

    const totalSales = userBets.reduce((sum, b) => sum + b.amount, 0)
    const totalBets = userBets.length

    return {
      salesToday,
      salesWeek,
      salesMonth,
      totalSales,
      totalBets
    }
  }, [taquilla, user, bets])

  if (!taquilla) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Estadísticas de Taquilla</DialogTitle>
          <DialogDescription>
            Resumen de ventas para {taquilla.fullName}
          </DialogDescription>
        </DialogHeader>

        {stats ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ventas Hoy
                  </CardTitle>
                  <TrendUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.salesToday)}</div>
                  <p className="text-xs text-muted-foreground">
                    Desde las 00:00
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ventas Semana
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.salesWeek)}</div>
                  <p className="text-xs text-muted-foreground">
                    Desde el lunes
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ventas Mes
                  </CardTitle>
                  <ChartBar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatCurrency(stats.salesMonth)}</div>
                  <p className="text-xs text-muted-foreground">
                    Mes actual
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Jugadas
                  </CardTitle>
                  <Ticket className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalBets}</div>
                  <p className="text-xs text-muted-foreground">
                    Tickets generados
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="rounded-md border p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Total Histórico</span>
                <span className="text-xl font-bold text-primary">{formatCurrency(stats.totalSales)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            No hay datos disponibles o el usuario no está vinculado correctamente.
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
