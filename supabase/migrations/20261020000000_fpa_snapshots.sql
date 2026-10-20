-- Apply in the owner's Supabase project before enabling cloud saving.
-- Snapshots are append-only; authenticated users can read and insert only their own rows.
create table if not exists public.fpa_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 80),
  model jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists fpa_snapshots_user_created_idx
  on public.fpa_snapshots (user_id, created_at desc);

alter table public.fpa_snapshots enable row level security;
revoke all on table public.fpa_snapshots from anon;
revoke all on table public.fpa_snapshots from authenticated;
grant select, insert on table public.fpa_snapshots to authenticated;

create policy "Users read only their FP&A snapshots"
  on public.fpa_snapshots for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users insert only their FP&A snapshots"
  on public.fpa_snapshots for insert to authenticated
  with check ((select auth.uid()) = user_id);
