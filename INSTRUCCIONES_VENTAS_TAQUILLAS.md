# Instrucciones para Activar Ventas por Taquilla

Para que el sistema pueda mostrar las ventas por taquilla, es necesario actualizar la base de datos para que cada jugada guarde quién la vendió.

## Paso 1: Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra en la sección **SQL Editor** (icono de terminal en la barra lateral izquierda).
3. Crea una **New Query**.
4. Copia y pega el siguiente código SQL:

```sql
-- Agregar columna user_id a la tabla bets para rastrear quién vendió la jugada
alter table public.bets 
add column if not exists user_id uuid references auth.users(id);

-- Crear índice para búsquedas rápidas
create index if not exists bets_user_id_idx on public.bets(user_id);

-- Trigger para asignar user_id automáticamente si no viene
create or replace function public.set_bet_user_id()
returns trigger as $$
begin
  if new.user_id is null then
    new.user_id := auth.uid();
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_bet_insert_set_user on public.bets;
create trigger on_bet_insert_set_user
before insert on public.bets
for each row execute procedure public.set_bet_user_id();
```

5. Haz clic en **Run** para ejecutarlo.

## Paso 2: Verificar

Una vez ejecutado, las **nuevas jugadas** que se realicen se asociarán automáticamente al usuario (Taquilla) que las creó.

En la sección **Taquillas** del panel administrativo, ahora verás una columna **Ventas** que mostrará el total vendido por cada taquilla.

> **Nota:** Las jugadas anteriores a este cambio no tienen asociado un usuario, por lo que no sumarán al total de ventas históricas. Solo se contarán las jugadas nuevas.
