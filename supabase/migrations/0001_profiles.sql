-- Elevantly — konton & persistens: profiler.
--
-- En rad per användare som äger sina Decision-poster (den strukturerade kärnan).
-- Dataminimering: vi lagrar bara besluten, inte AI:ns tolkningar (CLAUDE.md 7 & 9).
-- Kör i Supabase (SQL editor eller `supabase db push`) när projektet är kopplat.

create table if not exists public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  decisions  jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Row-level security: en användare når ENDAST sin egen rad. Detta är den
-- avgörande spärren — utan den kan vem som helst läsa alla profiler.
alter table public.profiles enable row level security;

create policy "Läs egen profil"
  on public.profiles for select
  using (auth.uid() = user_id);

create policy "Skapa egen profil"
  on public.profiles for insert
  with check (auth.uid() = user_id);

create policy "Uppdatera egen profil"
  on public.profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Radera egen profil"
  on public.profiles for delete
  using (auth.uid() = user_id);

-- Not: `on delete cascade` gör att radering av auth-användaren tar bort profilen
-- (rätt till radering, GDPR).
