create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'client' check (role in ('admin', 'client')),
  phone text,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  instagram text,
  company text,
  rut text,
  notes text,
  status text not null default 'activo' check (status in ('activo', 'inactivo')),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  method text not null check (method in ('Prex', 'Mercado Pago', 'efectivo', 'Abitab', 'Redpagos', 'transferencia', 'otro')),
  amount numeric(12,2) not null default 0,
  concept text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'confirmado', 'rechazado')),
  proof_url text,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  title text not null,
  type text,
  description text,
  amount numeric(12,2) default 0,
  status text not null default 'pendiente' check (status in ('pendiente', 'en proceso', 'entregado', 'cobrado', 'cancelado')),
  start_date date,
  due_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  invoice_number text not null unique,
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  status text not null default 'pendiente' check (status in ('pendiente', 'pagada', 'anulada')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.payments enable row level security;
alter table public.services enable row level security;
alter table public.invoices enable row level security;
alter table public.settings enable row level security;

drop policy if exists "profiles_select_self_or_admin" on public.profiles;
create policy "profiles_select_self_or_admin"
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_self_or_admin" on public.profiles;
create policy "profiles_update_self_or_admin"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "admin_all_clients" on public.clients;
create policy "admin_all_clients"
on public.clients for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "client_select_own_client" on public.clients;
create policy "client_select_own_client"
on public.clients for select
using (user_id = auth.uid());

drop policy if exists "admin_all_payments" on public.payments;
create policy "admin_all_payments"
on public.payments for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "client_select_own_payments" on public.payments;
create policy "client_select_own_payments"
on public.payments for select
using (
  exists (
    select 1 from public.clients c
    where c.id = payments.client_id and c.user_id = auth.uid()
  )
);

drop policy if exists "admin_all_services" on public.services;
create policy "admin_all_services"
on public.services for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "client_select_own_services" on public.services;
create policy "client_select_own_services"
on public.services for select
using (
  exists (
    select 1 from public.clients c
    where c.id = services.client_id and c.user_id = auth.uid()
  )
);

drop policy if exists "admin_all_invoices" on public.invoices;
create policy "admin_all_invoices"
on public.invoices for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "client_select_own_invoices" on public.invoices;
create policy "client_select_own_invoices"
on public.invoices for select
using (
  exists (
    select 1 from public.clients c
    where c.id = invoices.client_id and c.user_id = auth.uid()
  )
);

drop policy if exists "admin_all_settings" on public.settings;
create policy "admin_all_settings"
on public.settings for all
using (public.is_admin())
with check (public.is_admin());
