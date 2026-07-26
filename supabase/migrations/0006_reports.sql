-- Elevantly — trust & safety: rapporter.
--
-- En användare kan flagga en profil, ett inlägg eller ett meddelande för
-- granskning. Ingen automatisk åtgärd — signalen fångas för mänsklig granskning
-- (CLAUDE.md 11: förtroende är produkten). Kör i Supabase (SQL Editor) efter 0005.

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references auth.users (id) on delete cascade,
  subject_type text not null,
  subject_id   text not null,
  reason       text not null default '',
  created_at   timestamptz not null default now(),
  constraint reports_subject_type_check
    check (subject_type in ('profile', 'post', 'message')),
  constraint reports_reason_len check (char_length(reason) <= 1000)
);

create index if not exists reports_created_idx
  on public.reports (created_at desc);

-- Row-level security: vem som helst inloggad kan SKAPA en rapport i eget namn.
-- Ingen vanlig användare kan LÄSA rapporter — granskning sker med service-role
-- (ingen select-policy = ingen läsning via anon/auth-nyckeln).
alter table public.reports enable row level security;

create policy "Skapa egen rapport"
  on public.reports for insert
  with check (reporter_id = auth.uid());

-- Not: medvetet ingen select/update/delete-policy för vanliga användare.
-- Rapporter är en envägssignal in till granskning.
