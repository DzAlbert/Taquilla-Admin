# Instrucciones para Activar Registro Manual de Ventas

Has decidido que las ventas no se calculen automáticamente desde las jugadas, sino que se registren manualmente. Para esto, necesitamos crear una tabla nueva en la base de datos.

## Paso 1: Ejecutar Script SQL en Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2. Entra en la sección **SQL Editor** (icono de terminal en la barra lateral izquierda).
3. Crea una **New Query**.
4. Copia y pega el siguiente código SQL:

```sql
-- Tabla para registrar ventas manuales de taquillas
create table if not exists public.taquilla_sales (
  id uuid primary key default gen_random_uuid(),
  taquilla_id uuid references public.taquillas(id) on delete cascade,
  amount numeric not null check (amount >= 0),
  sale_date date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- Índices
create index if not exists taquilla_sales_taquilla_id_idx on public.taquilla_sales(taquilla_id);
create index if not exists taquilla_sales_date_idx on public.taquilla_sales(sale_date);

-- RLS (Seguridad)
alter table public.taquilla_sales enable row level security;

create policy "Enable read access for all users" on public.taquilla_sales
  for select using (true);

create policy "Enable insert for authenticated users" on public.taquilla_sales
  for insert with check (auth.role() = 'authenticated');

create policy "Enable update for authenticated users" on public.taquilla_sales
  for update using (auth.role() = 'authenticated');

create policy "Enable delete for authenticated users" on public.taquilla_sales
  for delete using (auth.role() = 'authenticated');
```

5. Haz clic en **Run** para ejecutarlo.

## Paso 2: Cómo usarlo

1. Ve a la pestaña **Taquillas**.
2. Verás un nuevo botón con el icono de una tienda (🏪) al lado de cada taquilla.
3. Haz clic en ese botón para **Registrar Venta**.
4. Ingresa el monto y la fecha.
5. La columna "Ventas" ahora mostrará la suma de estos registros manuales, ignorando las jugadas individuales.
