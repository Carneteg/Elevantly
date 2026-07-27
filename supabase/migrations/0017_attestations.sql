-- Elevantly — attestering: nätverket intygar ett beslut (roadmap Fas 7, Del 3).
--
-- Så här blir ett självrapporterat påstående `attesterat`: en accepterad KONTAKT
-- skriver under på en specifik prestation, med en kort motivering, och
-- profilägaren GODKÄNNER intyget (samtycke, §9.3). Designen är medvetet dyr
-- (knapphet + tvingad motivering) — det är där LinkedIns endorsements föll.
--
-- Attesteringen pekar på beslutet via `decision_key` (samma innehållsbaserade
-- identitet som dedupliceringen, se core/decisionIdentity.ts). Vi lagrar aldrig
-- själva beslutet här — bara nyckeln. Kör i Supabase efter 0016.

create table if not exists public.attestations (
  id               uuid primary key default gen_random_uuid(),
  subject_user_id  uuid not null references auth.users (id) on delete cascade,
  decision_key     text not null,
  attester_user_id uuid not null references auth.users (id) on delete cascade,
  motivation       text not null,
  status           text not null default 'pending',
  created_at       timestamptz not null default now(),
  decided_at       timestamptz,
  constraint attestations_status_check check (status in ('pending', 'accepted', 'declined')),
  constraint attestations_no_self check (attester_user_id <> subject_user_id),
  constraint attestations_motivation_len
    check (char_length(btrim(motivation)) between 15 and 280),
  constraint attestations_decision_key_len
    check (char_length(decision_key) between 1 and 2000)
);

-- En attestering per (beslut, attesterare). Avböjda rader ligger kvar och hindrar
-- upprepade förfrågningar; en attesterare som drar tillbaka (delete) frigör slotten.
create unique index if not exists attestations_unique_triple
  on public.attestations (subject_user_id, decision_key, attester_user_id);

create index if not exists attestations_subject_idx
  on public.attestations (subject_user_id, status);
create index if not exists attestations_attester_idx
  on public.attestations (attester_user_id, status);

alter table public.attestations enable row level security;

-- SELECT: bara parterna når en rad direkt — profilägaren (sin inkorg) och
-- attesteraren (sina egna). Publik visning av GODKÄNDA rader går genom
-- `accepted_attestations_for` (definer) som synlighetsgrindar dem.
drop policy if exists "Se egna attesteringar" on public.attestations;
create policy "Se egna attesteringar"
  on public.attestations for select
  using (auth.uid() = subject_user_id or auth.uid() = attester_user_id);

-- Ingen direkt INSERT/UPDATE/DELETE-policy: allt går via security-definer-
-- funktionerna nedan, som bär reglerna (kontakt, ej blockerad, budget, samtycke).

-- Hjälpare: får den inloggade betraktaren se `p_subject`s profil? Samma regel som
-- profil-RLS (egen, offentlig, eller `contacts` + accepterad kontakt). Security
-- definer så attesterings-läsningen kan grinda på profilsynlighet utan att
-- duplicera villkoret på flera ställen.
create or replace function public.can_view_profile(p_subject uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    when auth.uid() = p_subject then true
    else exists (
      select 1 from public.profiles pr
      where pr.user_id = p_subject
        and (
          pr.visibility = 'public'
          or (
            pr.visibility = 'contacts'
            and exists (
              select 1 from public.connections c
              where c.status = 'accepted'
                and (
                  (c.requester_id = auth.uid() and c.addressee_id = p_subject)
                  or (c.addressee_id = auth.uid() and c.requester_id = p_subject)
                )
            )
          )
        )
    )
  end;
$$;
revoke all on function public.can_view_profile(uuid) from public;
grant execute on function public.can_view_profile(uuid) to authenticated;

-- Är den inloggade en ACCEPTERAD kontakt till `p_other`? (Definer för att undvika
-- att läsa connections-raden via RLS från en annan tabells kontext.)
create or replace function public.is_accepted_contact(p_other uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select case
    when auth.uid() is null then false
    else exists (
      select 1 from public.connections c
      where c.status = 'accepted'
        and (
          (c.requester_id = auth.uid() and c.addressee_id = p_other)
          or (c.addressee_id = auth.uid() and c.requester_id = p_other)
        )
    )
  end;
$$;
revoke all on function public.is_accepted_contact(uuid) from public;
grant execute on function public.is_accepted_contact(uuid) to authenticated;

-- Begär en attestering. Attesteraren är sessionen (auth.uid()), aldrig en
-- parameter. Bär alla regler: inloggad, ej sig själv, accepterad kontakt, ej
-- blockerad, inom knapphetsbudgeten. Unik-constraintet fångar dubbletter.
create or replace function public.request_attestation(
  p_subject uuid,
  p_decision_key text,
  p_motivation text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attester uuid := auth.uid();
  v_active int;
  new_id uuid;
begin
  if v_attester is null then
    raise exception 'Ingen inloggad användare.';
  end if;
  if p_subject = v_attester then
    raise exception 'Du kan inte attestera dina egna beslut.';
  end if;
  if not public.is_accepted_contact(p_subject) then
    raise exception 'Bara en kontakt kan attestera ett beslut.';
  end if;
  if public.is_blocked_with(p_subject) then
    raise exception 'Det går inte att attestera den här användaren.';
  end if;

  select count(*) into v_active
  from public.attestations a
  where a.attester_user_id = v_attester
    and a.status in ('pending', 'accepted');
  if v_active >= 10 then
    raise exception 'Du har inga attesteringar kvar att ge just nu (budget).';
  end if;

  insert into public.attestations
    (subject_user_id, decision_key, attester_user_id, motivation)
    values (p_subject, p_decision_key, v_attester, btrim(p_motivation))
    returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.request_attestation(uuid, text, text) from public;
grant execute on function public.request_attestation(uuid, text, text) to authenticated;

-- Profilägaren avgör en VÄNTANDE attestering om sig själv: 'accepted' (visas då)
-- eller 'declined' (frigör attesterarens budget). Bara ägaren, bara pending.
create or replace function public.decide_attestation(p_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Ingen inloggad användare.';
  end if;
  if p_status not in ('accepted', 'declined') then
    raise exception 'Ogiltig status.';
  end if;
  update public.attestations
    set status = p_status, decided_at = now()
    where id = p_id
      and subject_user_id = auth.uid()
      and status = 'pending';
  if not found then
    raise exception 'Attesteringen hittades inte eller är redan avgjord.';
  end if;
end;
$$;
revoke all on function public.decide_attestation(uuid, text) from public;
grant execute on function public.decide_attestation(uuid, text) to authenticated;

-- Attesteraren drar tillbaka sin egen rad (väntande eller godkänd) → tas bort,
-- vilket frigör budget OCH unik-slotten. Bara attesteraren själv.
create or replace function public.withdraw_attestation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Ingen inloggad användare.';
  end if;
  delete from public.attestations
    where id = p_id and attester_user_id = auth.uid();
  if not found then
    raise exception 'Attesteringen hittades inte.';
  end if;
end;
$$;
revoke all on function public.withdraw_attestation(uuid) from public;
grant execute on function public.withdraw_attestation(uuid) to authenticated;

-- Godkända attesteringar av `p_subject`s beslut — MEN bara om betraktaren får se
-- profilen (samma synlighet som profilsidan). Returnerar attester_user_id till
-- SERVERN (som löser upp handle/namn); klienten får aldrig userId.
create or replace function public.accepted_attestations_for(p_subject uuid)
returns setof public.attestations
language sql
security definer
set search_path = public
as $$
  select a.*
  from public.attestations a
  where a.subject_user_id = p_subject
    and a.status = 'accepted'
    and public.can_view_profile(p_subject)
  order by a.created_at desc;
$$;
revoke all on function public.accepted_attestations_for(uuid) from public;
grant execute on function public.accepted_attestations_for(uuid) to authenticated;

-- Not: `on delete cascade` på båda user-referenserna gör att radering av ett konto
-- tar bort både attesteringar det gett och intyg om det (rätt till radering, GDPR).
