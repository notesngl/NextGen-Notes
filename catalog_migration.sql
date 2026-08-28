-- Run this once in Supabase SQL Editor.
-- Creates a "site_catalog" table that stores the Class/Exam -> Medium ->
-- Subject -> Chapter menu structure as JSON, editable from the Admin Panel.

create table if not exists site_catalog (
  id text primary key,      -- 'school' or 'entrance'
  data jsonb not null default '{}'::jsonb
);

-- School: Class 6-12 pre-created with empty Hindi/English Medium slots.
-- Subjects and chapters are left empty on purpose — add them yourself
-- from Admin Panel -> Manage Menu so names/spelling are exactly how you want.
insert into site_catalog (id, data) values (
  'school',
  '{
    "Class 6": {"Hindi Medium": {}, "English Medium": {}},
    "Class 7": {"Hindi Medium": {}, "English Medium": {}},
    "Class 8": {"Hindi Medium": {}, "English Medium": {}},
    "Class 9": {"Hindi Medium": {}, "English Medium": {}},
    "Class 10": {"Hindi Medium": {}, "English Medium": {}},
    "Class 11": {"Hindi Medium": {}, "English Medium": {}},
    "Class 12": {"Hindi Medium": {}, "English Medium": {}}
  }'::jsonb
)
on conflict (id) do nothing;

-- Entrance: left completely empty — add exams (JEE, NEET, SSC, etc.)
-- yourself from Admin Panel -> Manage Menu.
insert into site_catalog (id, data) values ('entrance', '{}'::jsonb)
on conflict (id) do nothing;

alter table site_catalog enable row level security;

-- Anyone signed in can read the menu (needed for the site to show it).
create policy "Public read catalog" on site_catalog
  for select using (true);

-- Only the admin account can add/edit the menu.
-- NOTE: if your "notes" table already has a similar admin-only policy,
-- copy that exact pattern here instead so both stay consistent.
create policy "Admin write catalog" on site_catalog
  for all using (auth.jwt() ->> 'email' = 'nextgenlearningrjl@gmail.com')
  with check (auth.jwt() ->> 'email' = 'nextgenlearningrjl@gmail.com');
