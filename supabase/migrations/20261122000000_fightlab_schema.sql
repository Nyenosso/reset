-- ============================================================================
-- FightLab — databaseschema voor Supabase (PostgreSQL)
--
-- Uitgangspunten
-- * De ingebouwde basisbibliotheek wordt met de app meegeleverd en staat NIET
--   in de database. Hier staan alleen gegevens van de gebruiker zelf:
--   eigen items, aangepaste versies van ingebouwde items (zelfde id, builtin_id
--   gevuld), favorieten, voorkeuren en lessen.
-- * Elke rij hoort bij precies één gebruiker (user_id). Row Level Security
--   zorgt dat iemand uitsluitend zijn eigen rijen kan lezen en wijzigen.
-- * Ids zijn tekst (stabiele seed-ids zoals "ex-single-jab" of UUID’s uit de app).
-- * Het volledige object staat in `data` (jsonb); losse kolommen zijn er voor
--   zoeken, sorteren, filteren en referentiële integriteit.
-- ============================================================================

-- ——— Profielen ———
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(coalesce(new.email, ''), '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ——— Oefeningen ———
create table if not exists public.exercises (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  builtin_id text,
  name text not null check (char_length(name) between 1 and 200),
  category text not null,
  description text not null default '',
  tags text[] not null default '{}',
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists exercises_user_updated_idx on public.exercises (user_id, updated_at desc);
create index if not exists exercises_user_name_idx on public.exercises (user_id, lower(name));
create index if not exists exercises_user_category_idx on public.exercises (user_id, category);
create index if not exists exercises_tags_idx on public.exercises using gin (tags);

create table if not exists public.exercise_relations (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  exercise_id text not null,
  related_id text not null,
  kind text not null check (kind in ('easier', 'harder', 'variation')),
  primary key (user_id, exercise_id, related_id, kind),
  foreign key (user_id, exercise_id) references public.exercises (user_id, id) on delete cascade
);

-- ——— Formats ———
create table if not exists public.formats (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  builtin_id text,
  name text not null check (char_length(name) between 1 and 200),
  section text not null,
  description text not null default '',
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists formats_user_updated_idx on public.formats (user_id, updated_at desc);
create index if not exists formats_user_name_idx on public.formats (user_id, lower(name));
create index if not exists formats_user_section_idx on public.formats (user_id, section);

-- ——— Trainingsblokken ———
create table if not exists public.training_blocks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  builtin_id text,
  title text not null check (char_length(title) between 1 and 200),
  phase text not null,
  format_id text,
  duration_sec integer not null default 0 check (duration_sec between 0 and 86400),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists training_blocks_user_updated_idx on public.training_blocks (user_id, updated_at desc);
create index if not exists training_blocks_user_phase_idx on public.training_blocks (user_id, phase);

create table if not exists public.training_block_exercises (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  block_id text not null,
  id text not null,
  position integer not null check (position >= 0),
  exercise_id text,
  name text not null check (char_length(name) between 1 and 200),
  tag text,
  amount text,
  note text,
  primary key (user_id, block_id, id),
  foreign key (user_id, block_id) references public.training_blocks (user_id, id) on delete cascade
);
create index if not exists training_block_exercises_order_idx on public.training_block_exercises (user_id, block_id, position);

-- ——— Lesstructuren ———
create table if not exists public.lesson_templates (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  builtin_id text,
  name text not null check (char_length(name) between 1 and 200),
  description text not null default '',
  slots jsonb not null default '[]' check (jsonb_typeof(slots) = 'array'),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

-- ——— Lessen ———
create table if not exists public.lessons (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null check (char_length(id) between 1 and 120),
  title text not null check (char_length(title) between 1 and 200),
  lesson_date date,
  status text not null default 'concept' check (status in ('concept', 'gepland', 'gegeven')),
  target_sec integer not null default 3600 check (target_sec between 0 and 86400),
  participants integer not null default 20 check (participants between 1 and 200),
  favorite boolean not null default false,
  deleted_at timestamptz,
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);
create index if not exists lessons_user_date_idx on public.lessons (user_id, lesson_date desc nulls last);
create index if not exists lessons_user_status_idx on public.lessons (user_id, status);
create index if not exists lessons_user_updated_idx on public.lessons (user_id, updated_at desc);
create index if not exists lessons_user_favorite_idx on public.lessons (user_id) where favorite;

-- Lesblokken zijn snapshots: wijzigen van een bibliotheekblok verandert een les niet.
create table if not exists public.lesson_blocks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  id text not null,
  lesson_id text not null,
  position integer not null check (position >= 0),
  source_block_id text,
  title text not null check (char_length(title) between 1 and 200),
  phase text not null,
  duration_sec integer not null default 0 check (duration_sec between 0 and 86400),
  data jsonb not null check (jsonb_typeof(data) = 'object'),
  updated_at timestamptz not null default now(),
  primary key (user_id, id),
  foreign key (user_id, lesson_id) references public.lessons (user_id, id) on delete cascade
);
create index if not exists lesson_blocks_order_idx on public.lesson_blocks (user_id, lesson_id, position);

-- ——— Favorieten en voorkeuren ———
create table if not exists public.favorites (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  item_type text not null check (item_type in ('exercise', 'format', 'block', 'template')),
  item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_type, item_id)
);

create table if not exists public.user_preferences (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null default '{}' check (jsonb_typeof(data) = 'object'),
  hidden_items text[] not null default '{}',
  recent jsonb not null default '[]' check (jsonb_typeof(recent) = 'array'),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- Row Level Security: alleen eigen rijen. Geen toegang voor niet-ingelogde (anon).
-- ============================================================================
alter table public.profiles enable row level security;
drop policy if exists "profiel lezen" on public.profiles;
drop policy if exists "profiel wijzigen" on public.profiles;
create policy "profiel lezen" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiel wijzigen" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

do $$
declare
  t text;
begin
  foreach t in array array[
    'exercises', 'exercise_relations', 'formats', 'training_blocks', 'training_block_exercises',
    'lesson_templates', 'lessons', 'lesson_blocks', 'favorites', 'user_preferences'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "eigen rijen lezen" on public.%I', t);
    execute format('drop policy if exists "eigen rijen toevoegen" on public.%I', t);
    execute format('drop policy if exists "eigen rijen wijzigen" on public.%I', t);
    execute format('drop policy if exists "eigen rijen verwijderen" on public.%I', t);
    execute format('create policy "eigen rijen lezen" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', t);
    execute format('create policy "eigen rijen toevoegen" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "eigen rijen wijzigen" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', t);
    execute format('create policy "eigen rijen verwijderen" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- Niet-ingelogde bezoekers krijgen geen rechten op deze tabellen.
revoke all on table
  public.profiles, public.exercises, public.exercise_relations, public.formats, public.training_blocks,
  public.training_block_exercises, public.lesson_templates, public.lessons, public.lesson_blocks,
  public.favorites, public.user_preferences
from anon;
