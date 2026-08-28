-- Run this in Supabase SQL Editor. It replaces the old site_catalog
-- table/rows with a new structure where MEDIUM is the top level:
--   Hindi Medium   -> School -> Class 6..12 -> Subject -> Chapter
--                  -> Entrance Exam -> (add exams yourself)
--   English Medium -> School -> Class 6..12 -> Subject -> Chapter
--                  -> Entrance Exam -> (add exams yourself)

drop table if exists site_catalog;

create table site_catalog (
  id text primary key,
  data jsonb not null default '{}'::jsonb
);

insert into site_catalog (id, data) values (
  'catalog',
  '{
    "Hindi Medium": {
      "school": {
        "Class 6": {}, "Class 7": {}, "Class 8": {}, "Class 9": {},
        "Class 10": {}, "Class 11": {}, "Class 12": {}
      },
      "entrance": {}
    },
    "English Medium": {
      "school": {
        "Class 6": {}, "Class 7": {}, "Class 8": {}, "Class 9": {},
        "Class 10": {}, "Class 11": {}, "Class 12": {}
      },
      "entrance": {}
    }
  }'::jsonb
);

alter table site_catalog enable row level security;

create policy "Public read catalog" on site_catalog
  for select using (true);

create policy "Admin write catalog" on site_catalog
  for all using (auth.jwt() ->> 'email' = 'nextgenlearningrjl@gmail.com')
  with check (auth.jwt() ->> 'email' = 'nextgenlearningrjl@gmail.com');
