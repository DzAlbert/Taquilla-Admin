# Solución Definitiva para Borrar Usuarios

El error que ves en el Dashboard de Supabase ("Database error loading user" o "Failed to delete") ocurre porque hay datos (como jugadas o roles) conectados al usuario que intentas borrar, y la base de datos protege esa información impidiendo el borrado.

Para solucionar esto tanto en el Dashboard como en tu App, debemos configurar el "Borrado en Cascada".

## Paso Único: Ejecutar Script de Corrección

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra en la sección **SQL Editor**.
3. Crea una **New Query**.
4. Copia y pega TODO el contenido del archivo `FIX_PERMISOS_BORRADO.sql` que he creado en tu escritorio.
5. Haz clic en **Run**.

## ¿Qué hace este script?

1. **Autoriza el borrado manual**: Modifica las conexiones de la base de datos para que, si borras un usuario (desde el Dashboard o la App), se borren automáticamente sus datos relacionados (roles, historial, etc.) sin dar error.
2. **Reactiva la función de la App**: Asegura que el botón de borrar en tu aplicación funcione correctamente.

Una vez ejecutado, podrás borrar usuarios desde donde prefieras sin errores.
