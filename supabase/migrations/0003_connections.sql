-- Elevantly — kontakter (connections): relationslagret.
--
-- En rad per relation mellan två användare. En skickar en förfrågan
-- (`requester_id`), den andra accepterar (`addressee_id`). Ömsesidigt samtycke —
-- inga påtvingade följare (CLAUDE.md 6.5). Kör i Supabase (SQL Editor) efter 0002.

create table if not exists public.connections (
  requester_id uuid not null references auth.users (id) on delete cascade,
  addressee_id uuid not null references auth.users (id) on delete cascade,
  status       text not null default 'pending',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (requester_id, addressee_id),
  constraint connections_status_check check (status in ('pending', 'accepted')),
  constraint connections_no_self check (requester_id <> addressee_id)
);

-- Exakt en relation per par, oavsett riktning: (a→b) och (b→a) kan inte samexistera.
create unique index if not exists connections_unique_pair
  on public.connections (
    least(requester_id, addressee_id),
    greatest(requester_id, addressee_id)
  );

-- Snabb uppslagning av en användares kopplingar.
create index if not exists connections_addressee_idx
  on public.connections (addressee_id);

-- Row-level security: en kopplingsrad är privat för de två parterna.
alter table public.connections enable row level security;

-- Se en koppling bara om du är en av parterna.
create policy "Se egna kopplingar"
  on public.connections for select
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Skapa en förfrågan endast som avsändare (aldrig i någon annans namn).
create policy "Skapa förfrågan"
  on public.connections for insert
  with check (auth.uid() = requester_id);

-- Acceptera (uppdatera) endast som mottagare av förfrågan.
create policy "Acceptera förfrågan"
  on public.connections for update
  using (auth.uid() = addressee_id)
  with check (auth.uid() = addressee_id);

-- Ta bort (avböj förfrågan eller ta bort kontakt) om du är part.
create policy "Ta bort koppling"
  on public.connections for delete
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Not: `on delete cascade` gör att radering av en auth-användare tar bort deras
-- kopplingar (rätt till radering, GDPR).
