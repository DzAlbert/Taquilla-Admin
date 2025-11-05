import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { User, Role } from "@/lib/types"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface UserDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  user?: User
  roles: Role[]
  currentUserId: string
  onSave: (user: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>
}

export function UserDialog({ open, onOpenChange, user, roles, currentUserId, onSave }: UserDialogProps) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([])
  const [isActive, setIsActive] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setName(user?.name || "")
      setEmail(user?.email || "")
      setPassword(user?.password || "")
      setSelectedRoleIds(user?.roleIds || [])
      setIsActive(user?.isActive ?? true)
    }
  }, [open, user])

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Por favor complete todos los campos obligatorios")
      return
    }

    if (selectedRoleIds.length === 0) {
      toast.error("Seleccione al menos un rol")
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Por favor ingrese un email válido")
      return
    }

    setIsLoading(true)

    try {
      const userData = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password.trim() || undefined,
        roleIds: selectedRoleIds,
        isActive,
        createdBy: currentUserId,
      }

      const success = await onSave(userData)
      
      if (success) {
        onOpenChange(false)
        setName("")
        setEmail("")
        setPassword("")
        setSelectedRoleIds([])
        setIsActive(true)
      }
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error('Error al guardar el usuario')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((current) =>
      current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{user ? "Editar Usuario" : "Nuevo Usuario"}</DialogTitle>
          <DialogDescription>
            Configure la información del usuario y asigne los roles apropiados
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">Nombre Completo *</Label>
              <Input
                id="user-name"
                placeholder="Ej: Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-email">Email *</Label>
              <Input
                id="user-email"
                type="email"
                placeholder="usuario@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-password">
              Contraseña {user ? "(dejar vacío para mantener actual)" : "*"}
            </Label>
            <Input
              id="user-password"
              type="password"
              placeholder={user ? "Nueva contraseña (opcional)" : "Contraseña temporal"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            {!user && (
              <p className="text-sm text-muted-foreground">
                Se asignará una contraseña temporal que el usuario debe cambiar
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label>Roles Asignados *</Label>
            <div className="space-y-3 border rounded-lg p-4 max-h-48 overflow-y-auto">
              {roles.map((role) => (
                <div key={role.id} className="flex items-start space-x-3">
                  <Checkbox
                    id={role.id}
                    checked={selectedRoleIds.includes(role.id)}
                    onCheckedChange={() => toggleRole(role.id)}
                    disabled={isLoading}
                  />
                  <div className="space-y-1 flex-1">
                    <Label
                      htmlFor={role.id}
                      className="font-medium cursor-pointer flex items-center gap-2"
                    >
                      {role.name}
                      {role.isSystem && (
                        <Badge variant="secondary" className="text-xs">
                          Sistema
                        </Badge>
                      )}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {role.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="outline" className="text-xs">
                          {permission}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{role.permissions.length - 3} más
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedRoleIds.length > 0 && (
              <div className="text-sm text-green-600">
                ✓ {selectedRoleIds.length} rol(es) seleccionado(s)
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="user-active"
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isLoading}
            />
            <Label htmlFor="user-active" className="cursor-pointer">
              Usuario activo
            </Label>
          </div>
          {!isActive && (
            <p className="text-sm text-muted-foreground">
              Los usuarios inactivos no pueden iniciar sesión en el sistema
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
