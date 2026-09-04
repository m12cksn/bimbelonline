-- Math Check-Up / Diagnostic marketing funnel tables.
-- Jalankan di Supabase Dashboard > SQL Editor sebelum menggunakan /math-checkup.

create extension if not exists pgcrypto;

create table if not exists public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  student_name text not null,
  parent_whatsapp text not null,
  grade_level integer not null check (grade_level between 1 and 12),
  concern text,
  question_ids text[] not null default '{}',
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  score integer,
  result_level text,
  category_scores jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.diagnostic_answers (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.diagnostic_attempts(id) on delete cascade,
  question_id text not null,
  category text not null,
  difficulty text not null,
  selected_answer text,
  correct_answer text not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.diagnostic_questions (
  id text primary key,
  grade_level integer not null check (grade_level between 1 and 12),
  skill_level integer not null default 1 check (skill_level between 1 and 12),
  assessment_band text not null default 'core' check (assessment_band in ('foundation', 'core', 'stretch')),
  category text not null check (
    category in (
      'Pemahaman Bilangan',
      'Kelancaran Berhitung',
      'Pecahan',
      'Soal Cerita',
      'Penalaran Logis'
    )
  ),
  domain text not null default 'Pemahaman Bilangan',
  skill text not null default '',
  subskill text not null default '',
  prerequisite_skill text not null default '',
  difficulty text not null default 'sedang' check (difficulty in ('mudah', 'sedang', 'menantang')),
  cognitive_type text not null default 'concept' check (cognitive_type in ('fluency', 'concept', 'application', 'reasoning')),
  recommendation_key text not null default '',
  misconception_key text,
  diagnostic_weight numeric not null default 1,
  diagnostic_version text not null default 'MATH_CHECKUP_V1',
  prompt text not null,
  options jsonb not null default '[]'::jsonb,
  correct_answer text not null,
  explanation text not null default '',
  sort_order integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.diagnostic_questions
  add column if not exists skill_level integer not null default 1 check (skill_level between 1 and 12),
  add column if not exists assessment_band text not null default 'core' check (assessment_band in ('foundation', 'core', 'stretch')),
  add column if not exists domain text not null default 'Pemahaman Bilangan',
  add column if not exists skill text not null default '',
  add column if not exists subskill text not null default '',
  add column if not exists prerequisite_skill text not null default '',
  add column if not exists cognitive_type text not null default 'concept' check (cognitive_type in ('fluency', 'concept', 'application', 'reasoning')),
  add column if not exists recommendation_key text not null default '',
  add column if not exists misconception_key text,
  add column if not exists diagnostic_weight numeric not null default 1,
  add column if not exists diagnostic_version text not null default 'MATH_CHECKUP_V1';

update public.diagnostic_questions
set
  skill_level = coalesce(skill_level, grade_level),
  assessment_band = coalesce(nullif(assessment_band, ''), 'core'),
  domain = coalesce(nullif(domain, ''), category),
  skill = coalesce(nullif(skill, ''), category),
  subskill = coalesce(nullif(subskill, ''), skill, category),
  cognitive_type = coalesce(nullif(cognitive_type, ''), 'concept'),
  recommendation_key = coalesce(
    nullif(recommendation_key, ''),
    'G' || grade_level || '_' || upper(regexp_replace(category, '[^[:alnum:]]+', '_', 'g'))
  ),
  diagnostic_weight = coalesce(diagnostic_weight, 1),
  diagnostic_version = coalesce(nullif(diagnostic_version, ''), 'MATH_CHECKUP_V1');

create index if not exists diagnostic_attempts_created_at_idx
  on public.diagnostic_attempts(created_at desc);

create index if not exists diagnostic_attempts_parent_whatsapp_idx
  on public.diagnostic_attempts(parent_whatsapp);

create index if not exists diagnostic_answers_attempt_id_idx
  on public.diagnostic_answers(attempt_id);

create index if not exists diagnostic_questions_grade_sort_idx
  on public.diagnostic_questions(grade_level, sort_order);

create index if not exists diagnostic_questions_active_idx
  on public.diagnostic_questions(grade_level, is_active);

create index if not exists diagnostic_questions_architecture_idx
  on public.diagnostic_questions(grade_level, assessment_band, domain, skill);

create index if not exists diagnostic_questions_version_idx
  on public.diagnostic_questions(diagnostic_version);

alter table public.diagnostic_attempts enable row level security;
alter table public.diagnostic_answers enable row level security;
alter table public.diagnostic_questions enable row level security;

-- Akses publik dilakukan lewat API route dengan service role key.
-- Jika ingin admin membaca langsung dari browser, tambahkan policy khusus admin sesuai struktur auth project.
