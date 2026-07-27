-- Elevantly — synlighet i steg: `contacts` (CLAUDE.md 9.3).
--
-- Utöver privat och offentlig kan en profil nu vara synlig för sina ACCEPTERADE
-- kontakter. Användaren styr synligheten i steg, alltid som ett uttryckligt val.
-- Kör i Supabase efter 0011.

-- Tillåt det nya synlighetsvärdet.
alter table public.profiles
  drop constraint if exists profiles_visibility_check;
alter table public.profiles
  add constraint profiles_visibility_check
  check (visibility in ('private', 'contacts', 'public'));

-- Row-level security (permissiva SELECT-policys OR:as ihop): en `contacts`-profil
-- får läsas av en accepterad kontakt. Ägaren når sin egen (0001) och offentliga
-- når alla (0002) sedan tidigare. En icke-kontakt ser aldrig en `contacts`-profil.
drop policy if exists "Läs profil för kontakt" on public.profiles;
create policy "Läs profil för kontakt"
  on public.profiles for select
  using (
    visibility = 'contacts'
    and exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = auth.uid() and c.addressee_id = profiles.user_id)
          or (c.addressee_id = auth.uid() and c.requester_id = profiles.user_id)
        )
    )
  );
