# 🔑 PROBLEMA CON API KEYS EN SUPABASE - DIAGNÓSTICO Y SOLUCIÓN

## 📋 Problema Identificado

Las API Keys **NO se están guardando en Supabase**, solo en localStorage.

### Causa Raíz

1. ❌ **Incompatibilidad entre sistemas de autenticación:**
   - La aplicación usa un sistema de login personalizado (no Supabase Auth)
   - Los usuarios se guardan en tabla `users` pero NO en Supabase Auth
   - Las RLS policies de `api_keys` requieren `auth.uid()` que no existe

2. ❌ **Flujo actual:**
   ```
   Usuario crea API Key → Hook verifica auth → No hay auth.uid() 
   → Guarda solo en localStorage ❌
   ```

3. ✅ **Flujo esperado:**
   ```
   Usuario crea API Key → Hook verifica user_id en tabla users 
   → Guarda en Supabase ✅
   ```

## 🔍 Diagnóstico Completo

### Estado Actual (Ejecuta: `node diagnose-apikeys-supabase.mjs`)

```
✅ Tabla api_keys existe
✅ Estructura correcta
✅ Funciones RPC disponibles
✅ Vista de estadísticas funcional
⚠️ 0 API Keys en Supabase (todas en localStorage)
❌ No hay usuario autenticado (auth.uid() = null)
```

### Usuarios en Sistema

- ✅ Tabla `users`: 1 usuario (admin@loteria.com)
- ❌ Supabase Auth: 0 usuarios
- ℹ️ Esto es normal, la app no usa Supabase Auth

## 🛠️ SOLUCIÓN

### Opción 1: Actualizar RLS Policies (RECOMENDADO)

Modificar las policies para que funcionen sin `auth.uid()`:

**Ejecutar manualmente en Supabase SQL Editor:**

1. Ir a: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
2. Copiar y pegar el contenido de `fix-apikeys-policies.sql`
3. Ejecutar

**Archivo: `fix-apikeys-policies.sql`**

```sql
-- Desactivar RLS temporalmente
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;

-- Eliminar policies existentes
DROP POLICY IF EXISTS "Users can view api_keys with proper permissions" ON api_keys;
DROP POLICY IF EXISTS "Users can create api_keys with permissions" ON api_keys;
DROP POLICY IF EXISTS "Users can update their api_keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete their api_keys" ON api_keys;

-- Reactivar RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Nuevas policies permisivas
CREATE POLICY "Allow read api_keys" ON api_keys
  FOR SELECT USING (true);

CREATE POLICY "Allow insert api_keys" ON api_keys
  FOR INSERT
  WITH CHECK (created_by IN (SELECT id FROM users WHERE is_active = true));

CREATE POLICY "Allow update api_keys" ON api_keys
  FOR UPDATE
  USING (created_by IN (SELECT id FROM users WHERE is_active = true));

CREATE POLICY "Allow delete api_keys" ON api_keys
  FOR DELETE
  USING (created_by IN (SELECT id FROM users WHERE is_active = true));
```

### Opción 2: Deshabilitar RLS completamente (MENOS SEGURO)

Si solo necesitas que funcione rápido para desarrollo:

```sql
ALTER TABLE api_keys DISABLE ROW LEVEL SECURITY;
```

⚠️ **ADVERTENCIA:** Esto permite acceso sin restricciones a la tabla.

## ✅ Verificación Post-Fix

Después de aplicar el fix, ejecutar:

```bash
node diagnose-apikeys-supabase.mjs
```

Deberías ver:
```
✅ Conexión exitosa a Supabase
✅ Tabla api_keys existe y es accesible
✅ RLS policies permiten operaciones
```

Luego desde la aplicación:
1. Crear una nueva API Key
2. Verificar que aparezca en Supabase (tabla api_keys)
3. Verificar que también se guarde en localStorage como backup

## 📊 Resumen

| Aspecto | Antes | Después |
|---------|-------|---------|
| API Keys en Supabase | ❌ 0 | ✅ Todas |
| API Keys en localStorage | ✅ Todas | ✅ Backup |
| Requiere auth.uid() | ❌ Sí | ✅ No |
| Funciona sin Supabase Auth | ❌ No | ✅ Sí |
| RLS activo | ⚠️ Bloqueante | ✅ Permisivo |

## 🔧 Comandos Útiles

```bash
# Diagnosticar estado actual
node diagnose-apikeys-supabase.mjs

# Listar usuarios
node list-supabase-users.mjs

# Test de creación (después del fix)
node test-apikeys-create.mjs
```

## 📝 Notas Importantes

1. **El hook ya está preparado para funcionar con ambos sistemas:**
   - Intenta guardar en Supabase
   - Si falla, guarda en localStorage
   - Sincroniza automáticamente

2. **No necesitas cambiar código de la aplicación:**
   - Solo ajustar las policies en Supabase
   - El hook detectará automáticamente y empezará a usar Supabase

3. **Backward compatible:**
   - API Keys existentes en localStorage se mantienen
   - Se pueden sincronizar manualmente después

## 🎯 Próximos Pasos

1. ✅ Ejecutar `fix-apikeys-policies.sql` en Supabase
2. ✅ Verificar con `node diagnose-apikeys-supabase.mjs`
3. ✅ Crear una API Key de prueba desde la app
4. ✅ Confirmar que aparece en Supabase
5. ✅ Commit de los scripts de diagnóstico

---

**Fecha:** ${new Date().toISOString()}
**Estado:** Diagnosticado, solución lista para aplicar
