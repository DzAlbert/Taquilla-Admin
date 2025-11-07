import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/pot-utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, Warning, Bank, CurrencyCircleDollar } from "@phosphor-icons/react"
import { Pot } from "@/lib/types"

interface WithdrawDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  pots: Pot[]
  onWithdraw: (pot: Pot, amount: number) => void
  isLoading?: boolean
}

export function WithdrawDialog({
  open,
  onOpenChange,
  pots,
  onWithdraw,
  isLoading = false
}: WithdrawDialogProps) {
  const [selectedPotId, setSelectedPotId] = useState<string>("")
  const [amount, setAmount] = useState("")
  const [quickAmount, setQuickAmount] = useState<number | null>(null)

  // Resetear valores al abrir el diálogo
  useEffect(() => {
    if (open) {
      setSelectedPotId("")
      setAmount("")
      setQuickAmount(null)
    }
  }, [open])

  // Obtener pote seleccionado
  const selectedPot = pots.find(p => p.name === selectedPotId)
  
  // Solo mostrar potes con balance positivo
  const availablePots = pots.filter(p => p.balance > 0)

  const handleWithdraw = async () => {
    if (!selectedPot) {
      toast.error("Seleccione un pote")
      return
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Ingrese un monto válido")
      return
    }

    const withdrawAmount = Number(amount)
    if (withdrawAmount > selectedPot.balance) {
      toast.error("Saldo insuficiente")
      return
    }

    try {
      await onWithdraw(selectedPot, withdrawAmount)
      setAmount("")
      setSelectedPotId("")
      setQuickAmount(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Error en retiro:', error)
    }
  }

  // Establecer montos rápidos
  const setQuickWithdraw = (percentage: number) => {
    if (selectedPot) {
      const quickValue = (selectedPot.balance * percentage / 100)
      setAmount(quickValue.toFixed(2))
      setQuickAmount(quickValue)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Retiro de Fondos</DialogTitle>
          <DialogDescription>
            Retire fondos de cualquier pote disponible en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selección de Pote */}
          <div className="space-y-2">
            <Label htmlFor="pot-select">Seleccionar Pote</Label>
            <Select value={selectedPotId} onValueChange={setSelectedPotId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccione un pote para retirar" />
              </SelectTrigger>
              <SelectContent>
                {availablePots.map((pot) => (
                  <SelectItem key={pot.name} value={pot.name}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: pot.color }}
                      />
                      <span>{pot.name}</span>
                      <span className="text-muted-foreground text-sm">
                        (Bs. {pot.balance.toFixed(2)})
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Información del pote seleccionado */}
          {selectedPot && (
            <Alert>
              <Bank className="h-4 w-4" />
              <AlertDescription>
                <div className="flex justify-between items-center">
                  <span>Saldo disponible:</span>
                  <strong>{formatCurrency(selectedPot.balance)}</strong>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Botones de monto rápido */}
          {selectedPot && selectedPot.balance > 0 && (
            <div className="space-y-2">
              <Label>Retiros Rápidos</Label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdraw(25)}
                  className="text-xs"
                >
                  25%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdraw(50)}
                  className="text-xs"
                >
                  50%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdraw(75)}
                  className="text-xs"
                >
                  75%
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setQuickWithdraw(100)}
                  className="text-xs"
                >
                  Todo
                </Button>
              </div>
            </div>
          )}

          {/* Monto personalizado */}
          <div className="space-y-2">
            <Label htmlFor="withdraw-amount">Monto a Retirar (Bs.)</Label>
            <Input
              id="withdraw-amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={!selectedPot}
            />
          </div>

          {/* Vista previa del retiro */}
          {selectedPot && amount && Number(amount) > 0 && (
            <div className="p-4 bg-accent/10 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CurrencyCircleDollar className="h-4 w-4 text-accent" />
                <span className="text-sm font-medium">Vista Previa del Retiro</span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Monto a retirar</p>
                  <p className="font-semibold text-lg">{formatCurrency(Number(amount))}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Saldo restante</p>
                  <p className="font-semibold text-lg">
                    {formatCurrency(selectedPot.balance - Number(amount))}
                  </p>
                </div>
              </div>
              
              {Number(amount) > selectedPot.balance && (
                <Alert className="mt-3">
                  <Warning className="h-4 w-4" />
                  <AlertDescription className="text-red-600">
                    El monto excede el saldo disponible
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Advertencia si no hay potes disponibles */}
          {availablePots.length === 0 && (
            <Alert>
              <Warning className="h-4 w-4" />
              <AlertDescription>
                No hay potes con saldo disponible para retiro.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleWithdraw} 
            className="bg-accent hover:bg-accent/90"
            disabled={
              !selectedPot || 
              !amount || 
              Number(amount) <= 0 || 
              Number(amount) > selectedPot?.balance || 
              isLoading
            }
          >
            {isLoading ? 'Procesando...' : 'Confirmar Retiro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
