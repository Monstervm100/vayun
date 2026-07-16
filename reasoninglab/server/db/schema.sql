-- ReasoningLab · PostgreSQL / Supabase schema
-- The dev server persists the same shapes to a JSON file; point the API layer
-- at this schema for production. Designed to extend to AMC 8, MathCounts,
-- MOEMS, Noetic and CogAT without redesign (competitions are data, not code).

create table if not exists competitions (
  id          text primary key,          -- 'kangaroo', 'amc8', ...
  name        text not null,
  min_grade   int  not null,
  max_grade   int  not null
);

insert into competitions (id, name, min_grade, max_grade) values
  ('kangaroo', 'Math Kangaroo', 1, 12)
on conflict (id) do nothing;

create table if not exists skills (
  id     text primary key,               -- 'pattern', 'logic', ...
  name   text not null,
  emoji  text not null default '🧩',
  blurb  text not null default ''
);

create table if not exists questions (
  id            text primary key,
  skill_id      text not null references skills(id),
  competition_id text references competitions(id),
  difficulty    int  not null check (difficulty between 1 and 4),
  grade         int  not null,
  prompt        text not null,
  figure        jsonb,                   -- declarative figure spec (grid, cubeNet, ...)
  choices       jsonb not null,          -- text[]
  answer        int  not null,           -- index into choices
  hints         jsonb not null,          -- [h1, h2, h3] progressively stronger
  explanation   jsonb not null,          -- step strings
  strategy      text not null,
  time_est_sec  int  not null default 60,
  complexity    int  not null default 2 check (complexity between 1 and 5),
  prereqs       jsonb not null default '[]',
  generated     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists students (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  grade         int  not null,
  avatar_id     text not null default 'fox',
  overall_rating int not null default 1000,
  xp            int  not null default 0,
  streak_current int not null default 0,
  streak_best   int  not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists parents (
  id         uuid primary key default gen_random_uuid(),
  email      text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists parent_students (
  parent_id  uuid references parents(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  primary key (parent_id, student_id)
);

create table if not exists student_skills (
  student_id  uuid references students(id) on delete cascade,
  skill_id    text references skills(id),
  rating      int not null default 1000,
  attempts    int not null default 0,
  correct     int not null default 0,
  miss_streak int not null default 0,
  remediation boolean not null default false,
  primary key (student_id, skill_id)
);

create table if not exists attempts (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references students(id) on delete cascade,
  question_id text not null references questions(id),
  skill_id    text not null references skills(id),
  difficulty  int  not null,
  correct     boolean not null,
  time_sec    int  not null,
  hints_used  int  not null default 0,
  rating_delta int not null default 0,
  created_at  timestamptz not null default now()
);
create index if not exists attempts_student_ts on attempts (student_id, created_at desc);

create table if not exists srs_items (
  student_id  uuid references students(id) on delete cascade,
  question_id text references questions(id),
  skill_id    text not null,
  step        int  not null default 0,
  due_at      timestamptz not null,
  primary key (student_id, question_id)
);
create index if not exists srs_due on srs_items (student_id, due_at);

create table if not exists badges (
  student_id uuid references students(id) on delete cascade,
  badge_id   text not null,
  earned_at  timestamptz not null default now(),
  primary key (student_id, badge_id)
);

-- guest-first sync: the client owns its state and pushes versioned blobs;
-- the row is authoritative only as a backup / cross-device restore.
create table if not exists progress_blobs (
  student_id uuid primary key references students(id) on delete cascade,
  version    int  not null,
  blob       jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists tournaments (
  week_key   text not null,              -- '2026-w28'
  student_id uuid references students(id) on delete cascade,
  score      int  not null default 0,
  primary key (week_key, student_id)
);
create index if not exists tournaments_week on tournaments (week_key, score desc);
