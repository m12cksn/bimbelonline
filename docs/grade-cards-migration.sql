-- Jalankan sekali melalui Supabase Dashboard > SQL Editor.

alter table public.grades
  add column if not exists description text,
  add column if not exists image_url text;

do $$
declare
  grade_level integer;
begin
  for grade_level in 1..12 loop
    if not exists (
      select 1
      from public.grades
      where level = grade_level
    ) then
      insert into public.grades (name, level)
      values ('Kelas ' || grade_level, grade_level);
    end if;
  end loop;
end
$$;
