-- Elevantly — trust & safety: blockering på DB-nivå (defense in depth).
--
-- Blockering upprätthölls hittills bara i route-koden (`isBlockedBetween` innan
-- vi skickar meddelande / skapar förfrågan). Det ger vänliga felmeddelanden men
-- är inte den yttersta spärren — förtroende är produkten (CLAUDE.md 11), så
-- spärren ska ligga i datalagret där ingen app-väg kan glömma den.
--
-- Vi återanvänder `is_blocked_with(other uuid)` (security definer, 0007) som
-- svarar ömsesidigt (block i NÅGON riktning) men bara för par där den inloggade
-- är en part — så policyn läcker aldrig att någon blockerat en. Kör efter 0008.

-- 1. Meddelanden: kan aldrig skickas om det finns en blockering (endera håll),
--    utöver kravet att vara accepterad kontakt.
drop policy if exists "Skicka meddelande till kontakt" on public.messages;
create policy "Skicka meddelande till kontakt"
  on public.messages for insert
  with check (
    sender_id = auth.uid()
    and not public.is_blocked_with(recipient_id)
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

-- 2. Kontaktförfrågan: kan aldrig skapas mot någon man blockerat / blivit
--    blockerad av.
drop policy if exists "Skapa förfrågan" on public.connections;
create policy "Skapa förfrågan"
  on public.connections for insert
  with check (
    auth.uid() = requester_id
    and not public.is_blocked_with(addressee_id)
  );

-- 3. Acceptera förfrågan: kan inte accepteras om en blockering hunnit uppstå.
drop policy if exists "Acceptera förfrågan" on public.connections;
create policy "Acceptera förfrågan"
  on public.connections for update
  using (auth.uid() = addressee_id)
  with check (
    auth.uid() = addressee_id
    and not public.is_blocked_with(requester_id)
  );

-- 4. Flöde: en blockerad part ska aldrig se ens inlägg — även om en gammal
--    accepterad koppling av någon anledning skulle ligga kvar.
drop policy if exists "Se flödesinlägg" on public.posts;
create policy "Se flödesinlägg"
  on public.posts for select
  using (
    author_id = auth.uid()
    or (
      not public.is_blocked_with(posts.author_id)
      and exists (
        select 1
        from public.connections c
        where c.status = 'accepted'
          and (
            (c.requester_id = auth.uid() and c.addressee_id = posts.author_id)
            or (c.addressee_id = auth.uid() and c.requester_id = posts.author_id)
          )
      )
    )
  );

-- Not: route-koden behåller sina egna blockkontroller (vänligare felmeddelanden).
-- Detta är backstoppen i datalagret, inte en ersättning — två lås, inte ett.
