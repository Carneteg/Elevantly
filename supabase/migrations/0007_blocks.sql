-- Elevantly — trust & safety: blockering (missbruksskydd).
--
-- En användare kan blockera en annan; då kan de inte längre kontakta varandra.
-- Integritetsbevarande: man ska INTE kunna avläsa att man blockerats. Därför ser
-- en användare bara sina egna blockeringar (RLS), och den ömsesidiga kontrollen
-- görs via `is_blocked_with` (security definer). Kör i Supabase efter 0006.

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users (id) on delete cascade,
  blocked_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_no_self check (blocker_id <> blocked_id)
);

-- Slå upp "har någon blockerat mig?" effektivt (används av funktionen nedan).
create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

-- Row-level security: en användare hanterar och ser ENDAST sina egna
-- blockeringar (rader där de själva är blockeraren). Man kan alltså inte läsa
-- att någon annan blockerat en — det avslöjas aldrig.
alter table public.blocks enable row level security;

create policy "Se egna blockeringar"
  on public.blocks for select
  using (auth.uid() = blocker_id);

create policy "Skapa egen blockering"
  on public.blocks for insert
  with check (auth.uid() = blocker_id);

create policy "Häv egen blockering"
  on public.blocks for delete
  using (auth.uid() = blocker_id);

-- Ömsesidig kontroll utan att läcka: en security definer-funktion ser båda
-- riktningar, men svarar bara för par där den inloggade är en av parterna.
-- Så kan appen upprätthålla blockering (t.ex. neka meddelanden) utan att någon
-- kan använda funktionen för att avläsa att de blivit blockerade av en tredje part.
create or replace function public.is_blocked_with(other uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from public.blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = other)
         or (b.blocker_id = other and b.blocked_id = auth.uid())
    )
  end;
$$;

revoke all on function public.is_blocked_with(uuid) from public;
grant execute on function public.is_blocked_with(uuid) to authenticated;

-- Not: `on delete cascade` gör att radering av en auth-användare tar bort deras
-- blockeringar (rätt till radering, GDPR).
