-- ============================================================================
-- NaijaResolve AI — Supabase Postgres Schema & Row Level Security (Section 7)
-- Paste and run this entire script in the Supabase SQL Editor.
-- ============================================================================

-- 1. Profiles table (stores user full_name and role: 'user' | 'admin')
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text not null default 'user' check (role in ('user','admin')),
  created_at timestamptz default now()
);

-- 2. Conversations table (AI legal assistant chat threads)
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  title text not null,
  status text not null default 'in_progress' check (status in ('in_progress','resolved','saved')),
  created_at timestamptz default now()
);

-- 3. Messages table (Individual user/assistant messages + verified sources JSON)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  sources jsonb default '[]',
  created_at timestamptz default now()
);

-- 4. Complaints table (Disputes & generated demand/complaint letters)
create table if not exists complaints (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  company text not null,
  category text,
  description text not null,
  amount numeric,
  incident_date date,
  status text not null default 'draft' check (status in ('draft','submitted','escalated','resolved')),
  letter text,
  created_at timestamptz default now()
);

-- 5. Enable Row Level Security (RLS) on all tables
alter table profiles enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table complaints enable row level security;

-- 6. Row Level Security Policies
drop policy if exists "own profile" on profiles;
create policy "own profile" on profiles
  for all using (id = auth.uid());

drop policy if exists "own conversations" on conversations;
create policy "own conversations" on conversations
  for all using (user_id = auth.uid());

drop policy if exists "own messages" on messages;
create policy "own messages" on messages
  for all using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

drop policy if exists "own complaints" on complaints;
create policy "own complaints" on complaints
  for all using (user_id = auth.uid());

drop policy if exists "admin reads complaints" on complaints;
create policy "admin reads complaints" on complaints
  for select using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

drop policy if exists "admin updates complaints" on complaints;
create policy "admin updates complaints" on complaints
  for update using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid() and p.role = 'admin'
    )
  );

-- 7. Automatic Profile Trigger on Signup
-- Automatically inserts a row into `public.profiles` whenever a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'user'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

