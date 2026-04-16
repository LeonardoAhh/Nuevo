-- Tabla para notificaciones de baja de empleados
create table if not exists public.baja_notifications (
  id uuid default gen_random_uuid() primary key,
  employee_name text not null,
  employee_numero text,
  motivo text,
  fecha_baja date not null,
  created_by uuid references auth.users(id),
  read boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS
alter table public.baja_notifications enable row level security;

create policy "Authenticated users can read baja_notifications"
  on public.baja_notifications for select
  to authenticated using (true);

create policy "Authenticated users can insert baja_notifications"
  on public.baja_notifications for insert
  to authenticated with check (true);

create policy "Authenticated users can update baja_notifications"
  on public.baja_notifications for update
  to authenticated using (true);

create policy "Authenticated users can delete baja_notifications"
  on public.baja_notifications for delete
  to authenticated using (true);
