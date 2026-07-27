-- Elevantly — arbetsgivare: företag + medlemskap (roadmap pelare 6, fas 6b-1).
--
-- En ny aktör: företaget. Självbetjänat (CLAUDE.md-beslut) — vilken inloggad
-- användare som helst kan skapa ett företag och blir dess första medlem. Flera
-- medlemmar kan dela ett företag. Skapandet går genom `create_company`
-- (security definer) som lägger företaget OCH medlemskapet atomiskt — så det finns
-- ingen direkt INSERT-policy att missbruka (ingen kan gå med i någon annans företag).
-- Kör i Supabase efter 0013.

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  summary    text,
  created_by uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint companies_name_len check (char_length(name) between 1 and 100),
  constraint companies_summary_len check (summary is null or char_length(summary) <= 500)
);

create table if not exists public.company_members (
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (company_id, user_id),
  constraint company_members_role_check check (role in ('owner', 'member'))
);
create index if not exists company_members_user_idx on public.company_members (user_id);

alter table public.companies enable row level security;
alter table public.company_members enable row level security;

-- Medlemskapskoll utan rekursiv RLS mellan companies och company_members.
create or replace function public.is_company_member(company uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from public.company_members m
      where m.company_id = company and m.user_id = auth.uid()
    )
  end;
$$;
revoke all on function public.is_company_member(uuid) from public;
grant execute on function public.is_company_member(uuid) to authenticated;

-- En medlem ser sitt företag. (Publik företagsvy kan läggas till senare.)
drop policy if exists "Medlem ser företag" on public.companies;
create policy "Medlem ser företag"
  on public.companies for select
  using (public.is_company_member(id));

-- En användare ser sina egna medlemskap.
drop policy if exists "Se egna medlemskap" on public.company_members;
create policy "Se egna medlemskap"
  on public.company_members for select
  using (user_id = auth.uid());

-- Självbetjänat skapande: företag + första medlemskap atomiskt. Ägaren är den
-- inloggade användaren (auth.uid()), aldrig en parameter.
create or replace function public.create_company(p_name text, p_summary text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Ingen inloggad användare.';
  end if;
  if p_name is null or char_length(btrim(p_name)) = 0 then
    raise exception 'Företagsnamn krävs.';
  end if;
  insert into public.companies (name, summary, created_by)
    values (btrim(p_name), nullif(btrim(coalesce(p_summary, '')), ''), auth.uid())
    returning id into new_id;
  insert into public.company_members (company_id, user_id, role)
    values (new_id, auth.uid(), 'owner');
  return new_id;
end;
$$;
revoke all on function public.create_company(text, text) from public;
grant execute on function public.create_company(text, text) to authenticated;

-- Not: `on delete cascade` gör att radering av en auth-användare tar bort deras
-- medlemskap; företag de skapat tas bort via `created_by`-kaskaden (GDPR).
