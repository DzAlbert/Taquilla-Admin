# 🧪 GUÍA DE PRUEBAS - MÓDULO DE POTES

## 🎯 Objetivo
Probar todas las funcionalidades del módulo de potes integrado con Supabase + fallback localStorage.

## 🚀 PASO 1: Configurar Datos Iniciales

### Opción A: Usando la Consola del Navegador
1. Abre http://localhost:5000 en tu navegador
2. Presiona `F12` para abrir las herramientas de desarrollador
3. Ve a la pestaña **Console**
4. Copia y pega este código:

```javascript
// Configurar datos iniciales de potes
const initialPots = [
  {
    name: 'Pote de Premios',
    percentage: 70,
    balance: 5000, // $5,000 inicial
    color: '#10b981',
    description: 'Dinero disponible para pagar premios a los ganadores'
  },
  {
    name: 'Pote de Reserva',
    percentage: 20,
    balance: 2000, // $2,000 inicial
    color: '#f59e0b', 
    description: 'Fondo de reserva para contingencias'
  },
  {
    name: 'Pote de Ganancias',
    percentage: 10,
    balance: 1500, // $1,500 inicial
    color: '#ef4444',
    description: 'Ganancias netas del negocio'
  }
];

localStorage.setItem('pots', JSON.stringify(initialPots));
localStorage.setItem('transfers', JSON.stringify([]));
localStorage.setItem('withdrawals', JSON.stringify([]));
console.log('✅ Datos configurados. Recargando página...');
window.location.reload();
```

5. Presiona `Enter` para ejecutar
6. La página se recargará automáticamente

## 📋 PASO 2: Verificar Estado Inicial

### 2.1 Revisar Pestaña Potes
1. Ve a la pestaña **"Potes"** en la aplicación
2. Deberías ver:
   - 💰 **Pote de Premios**: $5,000.00 (70%)
   - 🛡️ **Pote de Reserva**: $2,000.00 (20%)
   - 💵 **Pote de Ganancias**: $1,500.00 (10%)

### 2.2 Verificar Total
- **Total en potes**: $8,500.00

## 🧪 PASO 3: Pruebas del Módulo

### 3.1 Prueba: Crear Apuesta (Distribución Automática)
**Objetivo:** Verificar que las apuestas se distribuyen correctamente a los potes

1. Ve a la pestaña **"Jugadas"**
2. Haz clic en **"Nueva Jugada"**
3. Completa el formulario:
   - **Lotería**: Selecciona cualquiera
   - **Animal**: Selecciona cualquiera  
   - **Monto**: $100
4. Haz clic en **"Guardar Jugada"**
5. Ve a la pestaña **"Potes"**
6. **Resultado esperado:**
   - Pote de Premios: $5,070.00 (+$70)
   - Pote de Reserva: $2,020.00 (+$20)
   - Pote de Ganancias: $1,510.00 (+$10)
   - Total: $8,600.00 (+$100)

### 3.2 Prueba: Transferencia entre Potes
**Objetivo:** Mover dinero entre potes

1. En la pestaña **"Potes"**, localiza el **Pote de Reserva**
2. Haz clic en **"Transferir"** (botón junto al Pote de Reserva)
3. En el diálogo que aparece:
   - **Hacia**: Selecciona "Pote de Ganancias"
   - **Monto**: $500
4. Haz clic en **"Confirmar Transferencia"**
5. **Resultado esperado:**
   - Pote de Reserva: $1,520.00 (-$500)
   - Pote de Ganancias: $2,010.00 (+$500)

### 3.3 Prueba: Ver Historial de Transferencias
1. Desplázate hacia abajo en la pestaña **"Potes"**
2. En la sección **"Transferencias"** deberías ver:
   - Una entrada con la transferencia recién realizada
   - Desde: "Pote de Reserva"
   - Hacia: "Pote de Ganancias"  
   - Monto: $500.00
   - Fecha y hora actual

### 3.4 Prueba: Retiro de Ganancias
**Objetivo:** Retirar dinero del pote de ganancias

1. Localiza el **Pote de Ganancias**
2. Haz clic en **"Retirar"**
3. En el diálogo:
   - **Monto**: $300
4. Haz clic en **"Confirmar Retiro"**
5. **Resultado esperado:**
   - Pote de Ganancias: $1,710.00 (-$300)

### 3.5 Prueba: Ver Historial de Retiros
1. En la sección **"Retiros"** deberías ver:
   - Una entrada con el retiro recién realizado
   - Desde: "Pote de Ganancias"
   - Monto: $300.00
   - Fecha y hora actual

### 3.6 Prueba: Sorteo con Ganadores (Deducción Automática)
**Objetivo:** Verificar que los premios se deducen del pote correcto

1. Ve a la pestaña **"Sorteos"**
2. Haz clic en **"Nuevo Sorteo"**
3. Completa:
   - **Lotería**: La misma que usaste para la apuesta
   - **Animal ganador**: El mismo animal de tu apuesta
   - **Número**: El número correspondiente
4. Haz clic en **"Realizar Sorteo"**
5. Ve a la pestaña **"Potes"**
6. **Resultado esperado:**
   - El Pote de Premios debería haberse reducido por el monto del premio pagado

## 📊 PASO 4: Verificación de Persistencia

### 4.1 Prueba de Recarga
1. Recarga la página completa (`Ctrl + F5` o `Cmd + R`)
2. **Resultado esperado:**
   - Todos los balances de potes se mantienen
   - El historial de transferencias persiste
   - El historial de retiros persiste

### 4.2 Verificar en localStorage
1. Abre la consola del navegador (`F12`)
2. Ve a la pestaña **Application** > **Local Storage**
3. Verifica que existen las claves:
   - `pots`: Con los balances actualizados
   - `transfers`: Con el historial de transferencias
   - `withdrawals`: Con el historial de retiros

## ✅ RESULTADOS ESPERADOS

### Después de todas las pruebas:
- ✅ **Distribución automática**: Las apuestas se distribuyen según porcentajes
- ✅ **Transferencias**: Funcionales entre todos los potes
- ✅ **Retiros**: Solo desde el pote de ganancias
- ✅ **Historial**: Se registran todas las operaciones
- ✅ **Persistencia**: Los datos se guardan correctamente
- ✅ **Integración**: Hook de Supabase funciona con fallback localStorage

## 🐛 Posibles Problemas y Soluciones

### Problema: Potes aparecen en $0
**Solución:** Ejecuta el script de configuración inicial en la consola

### Problema: Transferencias no aparecen
**Solución:** Verifica que los nombres de potes coincidan exactamente

### Problema: No se pueden hacer retiros
**Solución:** Asegúrate que el pote de ganancias tenga balance suficiente

## 🎉 ¡Módulo de Potes Funcionando!

Si todas las pruebas pasan correctamente, el módulo de potes está:
- ✅ Completamente integrado con Supabase
- ✅ Funcionando con localStorage como fallback  
- ✅ Manejando correctamente todas las operaciones
- ✅ Persistiendo datos entre sesiones

**¡El sistema está listo para uso en producción!** 🚀