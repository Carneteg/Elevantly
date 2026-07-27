-- Elevantly — upptäckbarhet för rekryterare (roadmap Fas 7, Del 4).
--
-- Ett SEPARAT, informerat opt-in (§9.3): en offentlig profil listas i
-- rekryterarsöket bara om användaren aktivt valt det. "Offentlig" (vem som helst
-- med länken) är inte samma sak som "sökbar i ett rekryteringsverktyg" — att bli
-- upptäckbar är ett eget, uttryckligt val. Default false.
--
-- Medvetet val: INGEN ny RLS. Policyn "Läs offentlig profil" (0002) gör redan
-- alla `visibility='public'`-rader världsläsbara — en offentlig profil är per
-- definition läsbar för vem som helst. `discoverable_by_recruiters` styr
-- LISTNING i verktyget, inte läsåtkomst, och upprätthålls därför i app-lagret
-- (repo + /api/profile). Att lägga filtret i RLS skulle vilseleda: det ger inget
-- verkligt skydd och rör en säkerhetskritisk policy i onödan. Kör efter 0017.

alter table public.profiles
  add column if not exists discoverable_by_recruiters boolean not null default false;

comment on column public.profiles.discoverable_by_recruiters is
  'Opt-in för rekryterarsök (§9.3). App-lager-filter, meningsfullt bara när visibility=public. Ingen RLS — offentliga rader är redan läsbara.';
