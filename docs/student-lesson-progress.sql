-- Applied through Supabase migration student_lesson_progress.
-- Additive only: existing practice tables and records are unchanged.
create table public.student_lesson_progress (
 user_id uuid not null references auth.users(id),
 material_id bigint not null references public.materials(id),
 lesson_stage smallint not null default 0 check (lesson_stage between 0 and 5),
 lesson_completed boolean not null default false,
 warmup_answers jsonb not null default '[]'::jsonb check (jsonb_typeof(warmup_answers)='array' and jsonb_array_length(warmup_answers)<=5),
 updated_at timestamptz not null default now(),
 primary key (user_id, material_id)
);
alter table public.student_lesson_progress enable row level security;
revoke all on public.student_lesson_progress from anon, authenticated;
grant select, insert, update on public.student_lesson_progress to authenticated;
create policy lesson_owner_select on public.student_lesson_progress for select to authenticated using ((select auth.uid())=user_id);
create policy lesson_owner_insert on public.student_lesson_progress for insert to authenticated with check ((select auth.uid())=user_id);
create policy lesson_owner_update on public.student_lesson_progress for update to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
