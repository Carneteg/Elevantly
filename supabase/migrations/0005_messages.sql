-- Elevantly — meddelanden (messages): det privata 1:1-lagret.
--
-- Ett meddelande går mellan två användare som är accepterade kontakter. Strikt
-- privat: bara avsändare och mottagare ser det (RLS). Kör i Supabase (SQL Editor)
-- efter 0004.

create table if not exists public.messages (
  id           uuid primary key default gen_random_uuid(),
  sender_id    uuid not null references auth.users (id) on delete cascade,
  recipient_id uuid not null references auth.users (id) on delete cascade,
  body         text not null,
  created_at   timestamptz not null default now(),
  constraint messages_body_len check (char_length(body) between 1 and 2000),
  constraint messages_no_self check (sender_id <> recipient_id)
);

-- Snabb hämtning av en tråd i kronologisk ordning.
create index if not exists messages_pair_created_idx
  on public.messages (sender_id, recipient_id, created_at);
create index if not exists messages_recipient_idx
  on public.messages (recipient_id);

-- Row-level security: bara parterna ser meddelandet.
alter table public.messages enable row level security;

create policy "Se egna meddelanden"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- Skicka endast i eget namn OCH bara till en accepterad kontakt.
create policy "Skicka meddelande till kontakt"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = auth.uid() and c.addressee_id = recipient_id)
          or (c.addressee_id = auth.uid() and c.requester_id = recipient_id)
        )
    )
  );

-- Realtid: lägg tabellen i realtidspubliceringen så att klienten kan prenumerera
-- på nya meddelanden. RLS gäller även för realtid — bara parterna får uppdateringar.
alter publication supabase_realtime add table public.messages;

-- Not: `on delete cascade` gör att radering av en auth-användare tar bort deras
-- meddelanden (rätt till radering, GDPR). Meddelanden är oföränderliga i v1
-- (ingen update/delete-policy).
