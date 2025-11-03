import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from "@/lib/pot-utils"
import { Bet, DrawResult, Lottery } from "@/lib/types"
import { format, startOfDay, startOfWeek, startOfMonth, isWithinInterval } from "date-fns"
import { es } from "date-fns/locale"
import { TrendUp, TrendDown, Minus, Calendar, Ticket, Trophy, ChartBar } from "@phosphor-icons/react"

interface ReportsCardProps {
  bets: Bet[]
  draws: DrawResult[]
  lotteries: Lottery[]
}

interface SalesStats {
  totalSales: number
  totalBets: number
  averageBet: number
  totalPayout: number
  netProfit: number
  winners: number
}

interface TimeSeriesData {
  date: string
  sales: number
  bets: number
  winners: number
  payout: number
}

export function ReportsCard({ bets, draws, lotteries }: ReportsCardProps) {
  const now = new Date()
  const todayStart = startOfDay(now)
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  const monthStart = startOfMonth(now)

  const calculateStats = (filteredBets: Bet[], filteredDraws: DrawResult[]): SalesStats => {
    const totalSales = filteredBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalBets = filteredBets.length
    const averageBet = totalBets > 0 ? totalSales / totalBets : 0
    const totalPayout = filteredDraws.reduce((sum, draw) => sum + draw.totalPayout, 0)
    const netProfit = totalSales - totalPayout
    const winners = filteredBets.filter((b) => b.isWinner).length

    return { totalSales, totalBets, averageBet, totalPayout, netProfit, winners }
  }

  const todayBets = bets.filter((b) => new Date(b.timestamp) >= todayStart)
  const todayDraws = draws.filter((d) => new Date(d.drawTime) >= todayStart)
  const todayStats = calculateStats(todayBets, todayDraws)

  const weekBets = bets.filter((b) => new Date(b.timestamp) >= weekStart)
  const weekDraws = draws.filter((d) => new Date(d.drawTime) >= weekStart)
  const weekStats = calculateStats(weekBets, weekDraws)

  const monthBets = bets.filter((b) => new Date(b.timestamp) >= monthStart)
  const monthDraws = draws.filter((d) => new Date(d.drawTime) >= monthStart)
  const monthStats = calculateStats(monthBets, monthDraws)

  const allTimeStats = calculateStats(bets, draws)

  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) return <TrendUp className="text-accent" weight="bold" />
    if (current < previous) return <TrendDown className="text-destructive" weight="bold" />
    return <Minus className="text-muted-foreground" />
  }

  const getTopLotteries = () => {
    const lotteryStats = new Map<string, { name: string; sales: number; bets: number }>()

    bets.forEach((bet) => {
      const current = lotteryStats.get(bet.lotteryId) || { name: bet.lotteryName, sales: 0, bets: 0 }
      lotteryStats.set(bet.lotteryId, {
        name: bet.lotteryName,
        sales: current.sales + bet.amount,
        bets: current.bets + 1,
      })
    })

    return Array.from(lotteryStats.values())
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5)
  }

  const getTopAnimals = () => {
    const animalStats = new Map<string, { name: string; bets: number; amount: number }>()

    bets.forEach((bet) => {
      const key = `${bet.animalNumber}-${bet.animalName}`
      const current = animalStats.get(key) || { name: bet.animalName, bets: 0, amount: 0 }
      animalStats.set(key, {
        name: bet.animalName,
        bets: current.bets + 1,
        amount: current.amount + bet.amount,
      })
    })

    return Array.from(animalStats.entries())
      .sort((a, b) => b[1].bets - a[1].bets)
      .slice(0, 10)
      .map(([key, value]) => ({ number: key.split("-")[0], ...value }))
  }

  const getHourlyData = () => {
    const hourlyData = new Map<number, { bets: number; sales: number }>()

    todayBets.forEach((bet) => {
      const hour = new Date(bet.timestamp).getHours()
      const current = hourlyData.get(hour) || { bets: 0, sales: 0 }
      hourlyData.set(hour, {
        bets: current.bets + 1,
        sales: current.sales + bet.amount,
      })
    })

    return Array.from(hourlyData.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([hour, data]) => ({
        hour: `${hour.toString().padStart(2, "0")}:00`,
        ...data,
      }))
  }

  const topLotteries = getTopLotteries()
  const topAnimals = getTopAnimals()
  const hourlyData = getHourlyData()

  const peakHour = hourlyData.length > 0 ? hourlyData.reduce((max, curr) => (curr.bets > max.bets ? curr : max)) : null

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ventas de Hoy</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatCurrency(todayStats.totalSales)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon(todayStats.totalSales, weekStats.totalSales / 7)}
              <span className="text-muted-foreground">
                vs promedio semanal ({formatCurrency(weekStats.totalSales / 7)})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Jugadas de Hoy</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{todayStats.totalBets}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              {getTrendIcon(todayStats.totalBets, weekStats.totalBets / 7)}
              <span className="text-muted-foreground">
                vs promedio semanal ({Math.round(weekStats.totalBets / 7)})
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Premios Pagados Hoy</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatCurrency(todayStats.totalPayout)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">{todayStats.winners} ganadores</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Ganancia Neta Hoy</CardDescription>
            <CardTitle className="text-3xl tabular-nums">{formatCurrency(todayStats.netProfit)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                Margen: {todayStats.totalSales > 0 ? ((todayStats.netProfit / todayStats.totalSales) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Resumen por Período</CardTitle>
            <CardDescription>Comparativa de ventas y premios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Hoy</span>
                  <Badge>{todayStats.totalBets} jugadas</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(todayStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premios:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(todayStats.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Neto:</span>
                    <span className="font-semibold tabular-nums text-accent">
                      {formatCurrency(todayStats.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Esta Semana</span>
                  <Badge variant="secondary">{weekStats.totalBets} jugadas</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(weekStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premios:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(weekStats.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Neto:</span>
                    <span className="font-semibold tabular-nums text-accent">
                      {formatCurrency(weekStats.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Este Mes</span>
                  <Badge variant="outline">{monthStats.totalBets} jugadas</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(monthStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premios:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(monthStats.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Neto:</span>
                    <span className="font-semibold tabular-nums text-accent">
                      {formatCurrency(monthStats.netProfit)}
                    </span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Acumulado</span>
                  <Badge variant="outline">{allTimeStats.totalBets} jugadas</Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ventas:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(allTimeStats.totalSales)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Premios:</span>
                    <span className="font-medium tabular-nums">{formatCurrency(allTimeStats.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Neto:</span>
                    <span className="font-semibold tabular-nums text-accent">
                      {formatCurrency(allTimeStats.netProfit)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loterías Más Vendidas</CardTitle>
            <CardDescription>Ranking por volumen de ventas</CardDescription>
          </CardHeader>
          <CardContent>
            {topLotteries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos de ventas</p>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-3">
                  {topLotteries.map((lottery, index) => (
                    <div key={lottery.name} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                        {index + 1}
                      </div>
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{lottery.name}</p>
                        <p className="text-xs text-muted-foreground">{lottery.bets} jugadas</p>
                      </div>
                      <p className="font-semibold tabular-nums">{formatCurrency(lottery.sales)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Animalitos Más Jugados</CardTitle>
            <CardDescription>Top 10 por cantidad de jugadas</CardDescription>
          </CardHeader>
          <CardContent>
            {topAnimals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos de jugadas</p>
            ) : (
              <ScrollArea className="h-[350px]">
                <div className="space-y-2">
                  {topAnimals.map((animal, index) => (
                    <div key={animal.number} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {animal.number}
                        </Badge>
                        <div>
                          <p className="text-sm font-medium">{animal.name}</p>
                          <p className="text-xs text-muted-foreground">{animal.bets} jugadas</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold tabular-nums">{formatCurrency(animal.amount)}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad por Hora (Hoy)</CardTitle>
            <CardDescription>Distribución de jugadas durante el día</CardDescription>
          </CardHeader>
          <CardContent>
            {hourlyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No hay datos de hoy</p>
            ) : (
              <div className="space-y-4">
                {peakHour && (
                  <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg">
                    <ChartBar className="text-accent" weight="bold" size={20} />
                    <div className="text-sm">
                      <p className="font-medium">Hora pico: {peakHour.hour}</p>
                      <p className="text-muted-foreground">
                        {peakHour.bets} jugadas · {formatCurrency(peakHour.sales)}
                      </p>
                    </div>
                  </div>
                )}
                <ScrollArea className="h-[280px]">
                  <div className="space-y-2">
                    {hourlyData.map((data) => (
                      <div key={data.hour} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-mono">{data.hour}</span>
                          <div className="flex items-center gap-3">
                            <span className="text-muted-foreground">{data.bets} jugadas</span>
                            <span className="font-medium tabular-nums">{formatCurrency(data.sales)}</span>
                          </div>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-accent transition-all"
                            style={{
                              width: `${peakHour ? (data.bets / peakHour.bets) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
