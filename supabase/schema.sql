-- Run this once in the Supabase dashboard: SQL Editor > New query > Run.
create table if not exists public.appointments (
  id bigint generated always as identity primary key,
  patient_name text not null,
  phone text not null,
  date date not null,
  time time not null,
  reason text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Only one active appointment per date and time. Cancelled ones free the slot.
create unique index if not exists appointments_slot_unique
  on public.appointments (date, time)
  where status <> 'cancelled';

-- No policies are added, so only the server (using the secret key) can read or write.
alter table public.appointments enable row level security;
