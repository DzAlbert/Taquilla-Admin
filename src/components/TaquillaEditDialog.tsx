import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import type { Taquilla } from '@/lib/types'

interface Props {
  open: boolean
  taquilla?: Taquilla
  onOpenChange: (v: boolean) => void
  onSave: (updates: { id: string; fullName: string; address: string; telefono: string; email: string }) => Promise<boolean>
}

export function TaquillaEditDialog({ open, taquilla, onOpenChange, onSave }: Props) {
  const [fullName, setFullName] = useState('')
  const [address, setAddress] = useState('')
  const [telefono, setTelefono] = useState('')
  const [email, setEmail] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && taquilla) {
      setFullName(taquilla.fullName)
      setAddress(taquilla.address)
      setTelefono(taquilla.telefono || '')
      setEmail(taquilla.email)
    }
  }, [open, taquilla])

  const handleSave = async () => {
    if (!taquilla) return
    setSaving(true)
    const ok = await onSave({ id: taquilla.id, fullName, address, telefono, email })
    setSaving(false)
    if (ok) onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Taquilla</DialogTitle>
          <DialogDescription>Actualiza los datos de la taquilla seleccionada.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>Nombre completo</Label>
            <Input 
              value={fullName} 
              onChange={e => setFullName(e.target.value)} 
              placeholder="Ej: Taquilla Centro"
            />
          </div>
          <div className="grid gap-2">
            <Label>Dirección</Label>
            <Input 
              value={address} 
              onChange={e => setAddress(e.target.value)} 
              placeholder="Ej: Av. Bolívar, Local 5"
            />
          </div>
          <div className="grid gap-2">
            <Label>Teléfono</Label>
            <Input 
              value={telefono} 
              onChange={e => setTelefono(e.target.value)} 
              placeholder="Ej: 0414-1234567"
            />
          </div>
          <div className="grid gap-2">
            <Label>Correo</Label>
            <Input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              placeholder="correo@ejemplo.com"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || !fullName || !email}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
