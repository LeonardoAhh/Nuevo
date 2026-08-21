-- Tabla para suscripciones push de navegador
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

alter table public.push_subscriptions enable row level security;

create policy "Users can manage own push_subscriptions"
  on public.push_subscriptions for all
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Agregar columna tipo a baja_notifications para categorizar
alter table public.baja_notifications
  add column if not exists tipo text default 'manual';
-- tipo: 'manual' | 'scheduled'

-- Tabla de preferencias de notificación (si no existe)
create table if not exists public.notification_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade unique,
  push_bajas boolean default true,
  push_bajas_warning boolean default true,
  email_bajas boolean default false,
  push_comments boolean default true,
  push_mentions boolean default true,
  push_direct_messages boolean default true,
  email_product_updates boolean default false,
  email_comments boolean default true,
  email_mentions boolean default true,
  email_marketing boolean default false,
  updated_at timestamptz default now()
);

alter table public.notification_preferences enable row level security;

create policy "Users can manage own notification_preferences"
  on public.notification_preferences for all
  to authenticated using (user_id = auth.uid())
  with check (user_id = auth.uid());
