-- Elevantly — synlig profil: synlighet, handle och profiltext.
--
-- Lägger till möjligheten att göra sin profil offentlig och nåbar via ett
-- användarnamn (/u/handle). Default är PRIVAT — synlighet är ett uttryckligt
-- opt-in (CLAUDE.md 9.3). Kör i Supabase (SQL Editor) efter 0001.

alter table public.profiles
  add column if not exists visibility text not null default 'private',
  add column if not exists handle text,
  add column if not exists display_name text,
  add column if not exists headline text;

-- Bara giltiga synlighetsvärden.
alter table public.profiles
  drop constraint if exists profiles_visibility_check;
alter table public.profiles
  add constraint profiles_visibility_check
  check (visibility in ('private', 'public'));

-- Handle-format: 3–30 tecken, gemener/siffror/_/- (eller null tills det sätts).
alter table public.profiles
  drop constraint if exists profiles_handle_format_check;
alter table public.profiles
  add constraint profiles_handle_format_check
  check (handle is null or handle ~ '^[a-z0-9_-]{3,30}$');

-- Unikt handle (skiftlägesokänsligt), bara för satta handles.
create unique index if not exists profiles_handle_unique
  on public.profiles (lower(handle))
  where handle is not null;

-- RLS: vem som helst (även utloggad) får läsa en profil ENDAST om den är
-- offentlig. Privata profiler förblir bara ägarens (via policyn i 0001).
drop policy if exists "Läs offentlig profil" on public.profiles;
create policy "Läs offentlig profil"
  on public.profiles for select
  using (visibility = 'public');
