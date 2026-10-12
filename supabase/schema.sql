-- LEGACY Catalog v1.2 - configuración inicial de Supabase
-- Ejecutar una sola vez en Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  color_slug text not null check (color_slug in ('negro','blanco','arena','verde-militar')),
  front_url text not null default '',
  back_url text not null default '',
  sizes text[] not null default '{}',
  stock boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.catalog_products enable row level security;

drop policy if exists "catalog public read" on public.catalog_products;
create policy "catalog public read" on public.catalog_products for select to anon, authenticated using (true);

drop policy if exists "catalog admin insert" on public.catalog_products;
create policy "catalog admin insert" on public.catalog_products for insert to authenticated with check (true);

drop policy if exists "catalog admin update" on public.catalog_products;
create policy "catalog admin update" on public.catalog_products for update to authenticated using (true) with check (true);

drop policy if exists "catalog admin delete" on public.catalog_products;
create policy "catalog admin delete" on public.catalog_products for delete to authenticated using (true);

insert into storage.buckets (id, name, public)
values ('catalog-products','catalog-products',true)
on conflict (id) do update set public = true;

drop policy if exists "catalog storage public read" on storage.objects;
create policy "catalog storage public read" on storage.objects for select to anon, authenticated using (bucket_id = 'catalog-products');

drop policy if exists "catalog storage admin insert" on storage.objects;
create policy "catalog storage admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'catalog-products');

drop policy if exists "catalog storage admin update" on storage.objects;
create policy "catalog storage admin update" on storage.objects for update to authenticated using (bucket_id = 'catalog-products') with check (bucket_id = 'catalog-products');

drop policy if exists "catalog storage admin delete" on storage.objects;
create policy "catalog storage admin delete" on storage.objects for delete to authenticated using (bucket_id = 'catalog-products');
