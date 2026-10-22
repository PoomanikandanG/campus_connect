-- Apply using a trusted database administrator, never browser credentials.
begin;
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create table public.approved_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null check (email = lower(trim(email)) and position('@' in email) > 1),
  role text not null check (role in ('student', 'hod', 'admin')),
  active boolean not null default true,
  department text check (department is null or length(trim(department)) > 0),
  approved_at timestamptz not null default now(),
  constraint hod_requires_department check (role <> 'hod' or department is not null)
);
create unique index approved_accounts_email_unique on public.approved_accounts (lower(email));
alter table public.approved_accounts enable row level security;
revoke all on public.approved_accounts from public, anon, authenticated;
grant select on public.approved_accounts to authenticated;
grant all on public.approved_accounts to service_role;

-- Live account state, never JWT user_metadata or a cached role claim.
-- Security definer avoids recursive RLS on the authoritative account table.
create function private.current_account_role() returns text
language sql stable security definer set search_path = '' as $$
  select a.role from public.approved_accounts a
  join auth.users u on u.id = a.user_id
  where a.user_id = (select auth.uid()) and a.active
    and a.email = lower(u.email) and u.email_confirmed_at is not null
$$;
revoke all on function private.current_account_role() from public, anon, authenticated;
grant execute on function private.current_account_role() to authenticated;
create policy read_own_active_account on public.approved_accounts
for select to authenticated
using (user_id = (select auth.uid()) and (select private.current_account_role()) is not null);

-- No browser INSERT/UPDATE/DELETE grants or policies, including for admin accounts.
-- Future private tables MUST have RLS and role/ownership policies using this helper.
-- No appointments or private HOD request tables are created in Phase 1.
commit;
