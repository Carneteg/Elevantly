-- Elevantly — jobbannonser (roadmap pelare 6, fas 6b-2).
--
-- Ett företags medlemmar postar och hanterar jobb. Kraven lagras som kanoniska
-- skill-id (från taxonomin) — inte fritext, så matchningen förblir på begrepp
-- (anti-djungeln). Företagsnamnet denormaliseras in på annonsen så `/jobs` kan visa
-- arbetsgivaren utan att läsa den medlems-skyddade `companies`-tabellen. Kör efter 0014.

create table if not exists public.jobs (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies (id) on delete cascade,
  company             text not null,
  title               text not null,
  summary             text not null default '',
  required_skill_ids  text[] not null default '{}',
  preferred_skill_ids text[] not null default '{}',
  responsibility      text not null default 'unknown',
  location            text,
  remote              boolean,
  status              text not null default 'draft',
  created_by          uuid default auth.uid() references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  constraint jobs_status_check check (status in ('draft', 'published', 'closed')),
  constraint jobs_title_len check (char_length(title) between 1 and 120),
  constraint jobs_responsibility_check
    check (responsibility in ('participated', 'contributed', 'led', 'owned', 'unknown'))
);

create index if not exists jobs_company_created_idx
  on public.jobs (company_id, created_at desc);
create index if not exists jobs_published_created_idx
  on public.jobs (created_at desc) where status = 'published';

alter table public.jobs enable row level security;

-- Alla inloggade ser PUBLICERADE jobb; ett företags medlemmar ser även egna
-- utkast/stängda (återanvänder `is_company_member` från 0014).
drop policy if exists "Se jobb" on public.jobs;
create policy "Se jobb"
  on public.jobs for select
  using (status = 'published' or public.is_company_member(company_id));

-- Bara medlemmar postar för sitt företag; created_by sätts av DB-default auth.uid().
drop policy if exists "Posta jobb" on public.jobs;
create policy "Posta jobb"
  on public.jobs for insert
  with check (public.is_company_member(company_id));

-- Bara medlemmar ändrar (t.ex. status) sitt företags jobb.
drop policy if exists "Hantera jobb" on public.jobs;
create policy "Hantera jobb"
  on public.jobs for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- Not: `on delete cascade` från companies gör att ett borttaget företags jobb
-- försvinner; created_by nollställs om skaparens konto raderas (jobbet ägs av företaget).
