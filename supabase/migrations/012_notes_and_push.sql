-- ============================================================
-- 012: Notas colaborativas + suscripciones push
-- Migración idempotente: funciona tanto si la tabla existe
-- como si es la primera vez que se ejecuta.
-- ============================================================

-- Función auxiliar para auto-actualizar updated_at
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Crear tabla base si no existe ───────────────────────────────────────────
create table if not exists notes (
  id         uuid        primary key default gen_random_uuid(),
  content    text        not null default '',
  type       text        not null default 'text',
  created_by uuid,
  created_at timestamptz not null default now()
);

-- ─── Agregar columnas nuevas (seguro si ya existen) ──────────────────────────
alter table notes add column if not exists created_by_name text;
alter table notes add column if not exists updated_at      timestamptz not null default now();
alter table notes add column if not exists attachment_url  text;
alter table notes add column if not exists attachment_name text;
alter table notes add column if not exists pinned          boolean     not null default false;
alter table notes add column if not exists color           text        not null default 'default';

-- ─── Migrar checklist_items de text[] a jsonb ────────────────────────────────
do $$
begin
  -- Si la columna existe como text[] la convierte a jsonb vacío
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'notes'
      and column_name  = 'checklist_items'
      and data_type    = 'ARRAY'
  ) then
    alter table notes
      alter column checklist_items type jsonb
      using '[]'::jsonb;
    alter table notes
      alter column checklist_items set default '[]'::jsonb;
    alter table notes
      alter column checklist_items set not null;
  end if;

  -- Si la columna no existe todavía, la crea
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name   = 'notes'
      and column_name  = 'checklist_items'
  ) then
    alter table notes
      add column checklist_items jsonb not null default '[]'::jsonb;
  end if;
end
$$;

-- ─── Eliminar FK antigua a profiles(id) si existe ────────────────────────────
-- (created_by ahora almacena auth.uid() directamente)
do $$
declare
  fk_name text;
begin
  select tc.constraint_name into fk_name
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
  where tc.table_schema    = 'public'
    and tc.table_name      = 'notes'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name    = 'created_by'
  limit 1;

  if fk_name is not null then
    execute 'alter table notes drop constraint ' || quote_ident(fk_name);
  end if;
end
$$;

-- ─── Constraints CHECK (solo agrega si no existen) ───────────────────────────
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema   = 'public'
      and table_name     = 'notes'
      and constraint_name = 'notes_type_check'
  ) then
    alter table notes
      add constraint notes_type_check
      check (type in ('text','checklist','attachment'));
  end if;

  if not exists (
    select 1 from information_schema.table_constraints
    where table_schema   = 'public'
      and table_name     = 'notes'
      and constraint_name = 'notes_color_check'
  ) then
    alter table notes
      add constraint notes_color_check
      check (color in ('default','red','yellow','green','blue','purple'));
  end if;
end
$$;

-- ─── Índice para ordenamiento ─────────────────────────────────────────────────
create index if not exists notes_pinned_created_idx
  on notes (pinned desc, created_at desc);

-- ─── Trigger updated_at (reemplaza si ya existía) ────────────────────────────
drop trigger if exists notes_set_updated_at on notes;
create trigger notes_set_updated_at
  before update on notes
  for each row execute function set_updated_at();

-- ─── Row Level Security ───────────────────────────────────────────────────────
alter table notes enable row level security;

drop policy if exists "notes_select" on notes;
drop policy if exists "notes_insert" on notes;
drop policy if exists "notes_update" on notes;
drop policy if exists "notes_delete" on notes;

create policy "notes_select" on notes
  for select using (auth.uid() is not null);

create policy "notes_insert" on notes
  for insert with check (auth.uid() = created_by);

create policy "notes_update" on notes
  for update using (auth.uid() is not null);

create policy "notes_delete" on notes
  for delete using (auth.uid() = created_by);

-- ─── Push subscriptions ───────────────────────────────────────────────────────
create table if not exists push_subscriptions (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        references profiles(id) on delete cascade,
  endpoint   text        not null,
  p256dh     text        not null,
  auth       text        not null,
  created_at timestamptz not null default now(),
  unique (user_id, endpoint)
);

alter table push_subscriptions enable row level security;

drop policy if exists "push_select_own" on push_subscriptions;
drop policy if exists "push_insert_own" on push_subscriptions;
drop policy if exists "push_delete_own" on push_subscriptions;

create policy "push_select_own" on push_subscriptions
  for select using (auth.uid() = user_id);

create policy "push_insert_own" on push_subscriptions
  for insert with check (auth.uid() = user_id);

create policy "push_delete_own" on push_subscriptions
  for delete using (auth.uid() = user_id);
