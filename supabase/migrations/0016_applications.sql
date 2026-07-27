-- Elevantly — ansökningar (roadmap pelare 6, fas 6c).
--
-- Den grundade profilen ÄR ansökan: vid ansökan lagras en SAMTYCKT ögonblicksbild
-- av kandidatens beslut (+ namn/headline) direkt på raden. Så ser arbetsgivaren
-- exakt vad kandidaten sökte med, utan att läsa kandidatens (kanske privata)
-- live-profil (CLAUDE.md 9.3). Kör efter 0015.

create table if not exists public.applications (
  id                 uuid primary key default gen_random_uuid(),
  job_id             uuid not null references public.jobs (id) on delete cascade,
  company_id         uuid not null references public.companies (id) on delete cascade,
  job_title          text,
  company            text,
  candidate_id       uuid not null default auth.uid() references auth.users (id) on delete cascade,
  candidate_name     text,
  candidate_headline text,
  decisions          jsonb not null default '[]',
  message            text,
  status             text not null default 'submitted',
  created_at         timestamptz not null default now(),
  unique (job_id, candidate_id),
  constraint applications_status_check
    check (status in ('submitted', 'reviewing', 'accepted', 'declined')),
  constraint applications_message_len check (message is null or char_length(message) <= 2000)
);

create index if not exists applications_job_created_idx
  on public.applications (job_id, created_at desc);
create index if not exists applications_candidate_idx
  on public.applications (candidate_id, created_at desc);

alter table public.applications enable row level security;

-- Kandidaten ser sina egna ansökningar; ett företags medlemmar ser ansökningar
-- till företaget (återanvänder `is_company_member`).
drop policy if exists "Se ansökningar" on public.applications;
create policy "Se ansökningar"
  on public.applications for select
  using (candidate_id = auth.uid() or public.is_company_member(company_id));

-- Söka: som sig själv, på ett PUBLICERAT jobb, med `company_id` bundet till jobbet.
drop policy if exists "Söka jobb" on public.applications;
create policy "Söka jobb"
  on public.applications for insert
  with check (
    candidate_id = auth.uid()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.company_id = company_id and j.status = 'published'
    )
  );

-- Statusbeslut (granska/acceptera/avböj): bara företagets medlemmar.
drop policy if exists "Hantera ansökningar" on public.applications;
create policy "Hantera ansökningar"
  on public.applications for update
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

-- Trust & safety: tillåt att rapportera även ett jobb (flödar in i granskningskön).
alter table public.reports drop constraint if exists reports_subject_type_check;
alter table public.reports add constraint reports_subject_type_check
  check (subject_type in ('profile', 'post', 'message', 'job'));
