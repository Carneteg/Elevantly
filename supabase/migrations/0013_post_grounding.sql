-- Elevantly — grundade inlägg: ett inlägg kan valfritt knytas till ett av
-- författarens egna bevisade beslut (CLAUDE.md 6.5/11 — substans över fåfänga,
-- även på den sociala ytan). Grunden är en server-validerad ögonblicksbild
-- ({ action, outcome? }) — servern sätter den bara från ett beslut författaren
-- faktiskt äger (CLAUDE.md 8.3). Kör i Supabase efter 0012.

alter table public.posts
  add column if not exists grounded_in jsonb;

-- Ingen RLS-ändring: grunden ärver inläggets synlighet (samma rad).
