-- Elevantly — flöde (posts): det professionella innehållslagret.
--
-- Ett inlägg är fritext som en användare delar med sitt nätverk. Synligt för
-- författaren och deras accepterade kontakter — inget publikt engagemangsflöde,
-- inga mörka mönster (CLAUDE.md 11). Kör i Supabase (SQL Editor) efter 0003.

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  author_id  uuid not null references auth.users (id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now(),
  constraint posts_body_len check (char_length(body) between 1 and 3000)
);

-- Snabb hämtning av en författares inlägg i kronologisk ordning.
create index if not exists posts_author_created_idx
  on public.posts (author_id, created_at desc);

-- Row-level security: ett inlägg syns för författaren och deras accepterade
-- kontakter. Ingen utomstående (eller utloggad) ser flödet.
alter table public.posts enable row level security;

create policy "Se flödesinlägg"
  on public.posts for select
  using (
    author_id = auth.uid()
    or exists (
      select 1
      from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = auth.uid() and c.addressee_id = posts.author_id)
          or (c.addressee_id = auth.uid() and c.requester_id = posts.author_id)
        )
    )
  );

create policy "Skapa eget inlägg"
  on public.posts for insert
  with check (author_id = auth.uid());

create policy "Radera eget inlägg"
  on public.posts for delete
  using (author_id = auth.uid());

-- Not: `on delete cascade` gör att radering av en auth-användare tar bort deras
-- inlägg (rätt till radering, GDPR).
