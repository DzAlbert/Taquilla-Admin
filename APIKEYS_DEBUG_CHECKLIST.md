# 🔍 CHECKLIST DE VERIFICACIÓN - API KEYS

## Estado Actual

### ✅ Verificaciones Completadas

1. **Tabla en Supabase** ✅
   - Tabla `api_keys` existe
   - Estructura correcta
   - Test de insert directo funciona

2. **RLS Policies** ✅  
   - Policies actualizadas
   - Funcionan sin auth.uid()
   - Permiten INSERT/UPDATE/DELETE

3. **Hook TypeScript** ✅
   - Sin errores de compilación
   - Lógica correcta (verificado con simulación)
   - Removida dependencia de Supabase Auth

4. **Simulación** ✅
   - Script reproduce exactamente la lógica del hook
   - INSERT funciona correctamente
   - Se guarda en Supabase

### ❓ Por Verificar

1. **En el Navegador**
   - ¿Hay errores en Console?
   - ¿Se ejecuta el hook?
   - ¿Qué dice el log cuando creas una API Key?

2. **localStorage**
   - ¿Hay datos guardados?
   - ¿Cuándo se guardan?

3. **Estado de React**
   - ¿Se actualiza el estado apiKeys?
   - ¿Se renderiza la lista?

## 🧪 Pasos de Debugging

### Paso 1: Abrir DevTools
```
F12 o Click derecho → Inspeccionar
```

### Paso 2: Ir a Console
```
Pestaña "Console"
```

### Paso 3: Filtrar logs
```
Busca mensajes que contengan:
- "API Key"
- "Supabase"
- "localStorage"
- Errores (en rojo)
```

### Paso 4: Crear API Key
```
1. Click en "Nueva API Key"
2. Llenar formulario
3. Click en "Crear"
4. OBSERVAR los logs
```

### Paso 5: Verificar Network
```
1. Pestaña "Network"
2. Filtrar por "api_keys"
3. Ver si hay request a Supabase
4. Ver respuesta
```

### Paso 6: Verificar Application
```
1. Pestaña "Application" → "Local Storage"
2. Buscar key "apiKeys"
3. Ver si tiene datos
```

## 📊 Logs Esperados

Cuando creas una API Key DEBERÍAS ver:

```
💾 Intentando crear API Key en Supabase...
   Usuario creador: 3e188dd5-4cdc-483f-b705-d2034005e1f0
✅ API Key creada exitosamente en Supabase
✅ API Key "Nombre" creada exitosamente
🔑 Clave generada: sk_xxxx...
```

## ❌ Posibles Problemas

### Si NO ves logs:
- El hook no se está ejecutando
- Hay un error antes que interrumpe la ejecución
- El evento onSave no se está llamando

### Si ves "No hay createdBy":
- currentUserId no se está pasando correctamente
- Verificar en App.tsx línea ~493

### Si ves error de Supabase:
- Copiar el mensaje completo
- Ver código de error
- Verificar policies

### Si ves "Supabase no disponible":
- Problema de conexión
- Variables de entorno incorrectas
- CORS o Network issue

## 🛠️ Herramientas de Debug

1. **debug-apikeys.html**
   - Abre en navegador
   - Verifica localStorage y Supabase
   - Test de creación

2. **simulate-app-apikey-creation.mjs**
   ```bash
   node simulate-app-apikey-creation.mjs
   ```

3. **test-direct-insert-apikey.mjs**
   ```bash
   node test-direct-insert-apikey.mjs
   ```

## 📝 Información Necesaria

Para ayudarte mejor, necesito saber:

1. ¿Qué logs aparecen en Console cuando creas una API Key?
2. ¿Hay algún error en rojo?
3. ¿Se muestra el toast de "API Key creada exitosamente"?
4. ¿Aparece la API Key en la lista después de crearla?
5. ¿Qué hay en localStorage (Application → Local Storage → apiKeys)?
6. ¿Qué hay en Supabase (tabla api_keys)?

---

**Fecha:** $(date)
**Estado:** Diagnóstico en proceso
