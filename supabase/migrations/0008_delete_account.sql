-- Elevantly — GDPR: rätten att radera hela sitt konto (CLAUDE.md 9.2).
--
-- En inloggad användare ska kunna radera ALL sin data. Alla tabeller
-- (profiles, connections, posts, messages, reports, blocks) refererar
-- `auth.users(id)` med `on delete cascade` (0001–0007) — så att radera
-- användarens auth-rad kaskaderar bort allt.
--
-- Att radera en rad i `auth.users` kräver dock privilegier som den inloggade
-- anon/session-rollen inte har. I stället för att exponera en service-role-
-- nyckel (den används ALDRIG, CLAUDE.md 14) kapslar vi in raderingen i en
-- `security definer`-funktion som bara kan radera ANROPARENS EGEN rad
-- (`auth.uid()`). En användare kan alltså aldrig radera någon annans konto.
-- Kör i Supabase efter 0007.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Ingen inloggad användare.';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

-- Bara inloggade användare får anropa den; ingen anonym åtkomst.
revoke all on function public.delete_my_account() from public;
grant execute on function public.delete_my_account() to authenticated;
