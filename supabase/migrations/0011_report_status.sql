-- Elevantly — trust & safety: åtgärder i granskningskön (rapportstatus).
--
-- Granskningsvyn (0010) var läs-bara. Detta gör den till ett arbetsflöde: en
-- granskare kan markera en rapport som åtgärdad (`resolved`) eller avvisad
-- (`dismissed`). Ingen automatik — ett mänskligt beslut spåras med vem och när
-- (CLAUDE.md 11: förtroende är produkten; 8.3: spårbarhet). Kör efter 0010.

alter table public.reports
  add column if not exists status text not null default 'open',
  add column if not exists resolved_by uuid references auth.users (id) on delete set null,
  add column if not exists resolved_at timestamptz;

alter table public.reports
  drop constraint if exists reports_status_check;
alter table public.reports
  add constraint reports_status_check
  check (status in ('open', 'resolved', 'dismissed'));

-- Kön hämtar öppna rapporter nyast först — indexera för det.
create index if not exists reports_status_created_idx
  on public.reports (status, created_at desc);

-- Granskare får UPPDATERA rapporter (sätta status). Skapa-policyn (0006) och
-- läs-policyn (0010) står kvar; vanliga användare kan fortfarande varken läsa
-- eller ändra.
drop policy if exists "Granskare uppdaterar rapport" on public.reports;
create policy "Granskare uppdaterar rapport"
  on public.reports for update
  using (public.is_admin())
  with check (public.is_admin());
