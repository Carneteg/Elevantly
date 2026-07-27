-- Elevantly — trust & safety: granskningskö för rapporter (admin).
--
-- Rapporter har hittills bara kunnat SKAPAS (0006, envägssignal) — ingen har
-- kunnat läsa dem via anon/auth-nyckeln. Detta ger en granskare läsåtkomst, men
-- snävt: en uttrycklig admin-roll, upprätthållen i RLS. Ingen service-role-nyckel
-- (CLAUDE.md 14). Kör i Supabase efter 0009.

-- Vilka användare som är granskare. Medvetet minimal: medlemskap hanteras
-- out-of-band (SQL av produktägaren) — det finns ingen policy för insert/delete,
-- så ingen kan ge sig själv admin via API:t.
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- `is_admin()`: är den inloggade användaren granskare? `security definer` så att
-- den kan läsa `admins` oavsett anroparens RLS — annars skulle policyer som
-- refererar tabellen aldrig kunna utvärderas av en vanlig användare.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    else exists (select 1 from public.admins a where a.user_id = auth.uid())
  end;
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- En admin får se admin-listan (för en framtida hanteringsvy); ingen annan.
drop policy if exists "Admins ser admins" on public.admins;
create policy "Admins ser admins"
  on public.admins for select
  using (public.is_admin());

-- Granskare får LÄSA rapporter. Skapa-policyn från 0006 står kvar oförändrad;
-- fortfarande ingen update/delete för vanliga användare.
drop policy if exists "Granska rapporter" on public.reports;
create policy "Granska rapporter"
  on public.reports for select
  using (public.is_admin());
