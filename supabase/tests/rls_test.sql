-- Test Row Level Security: gebruikers zien en wijzigen uitsluitend hun eigen rijen.
\set ON_ERROR_STOP on
grant usage on schema public to authenticated, anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

insert into auth.users values ('11111111-1111-1111-1111-111111111111', 'trainer@voorbeeld.nl'), ('22222222-2222-2222-2222-222222222222', 'ander@voorbeeld.nl');
do $$ begin if (select count(*) from public.profiles) <> 2 then raise exception 'profiel-trigger werkt niet'; end if; end $$;

set role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-1111-1111-111111111111', false);
insert into public.lessons (user_id, id, title, data) values ('11111111-1111-1111-1111-111111111111', 'les-a', 'Les A', '{}');
insert into public.lesson_blocks (user_id, id, lesson_id, position, title, phase, data) values ('11111111-1111-1111-1111-111111111111', 'b1', 'les-a', 0, 'Blok', 'raise', '{}');
insert into public.exercises (user_id, id, name, category, data) values ('11111111-1111-1111-1111-111111111111', 'ex-single-jab', 'Single Jab', 'stoten', '{}');
insert into public.favorites (user_id, item_type, item_id) values ('11111111-1111-1111-1111-111111111111', 'format', 'fmt-emom');
insert into public.user_preferences (user_id) values ('11111111-1111-1111-1111-111111111111');
-- Upsert zoals de app doet (on conflict op user_id,id).
insert into public.lessons (user_id, id, title, data) values ('11111111-1111-1111-1111-111111111111', 'les-a', 'Les A2', '{}')
  on conflict (user_id, id) do update set title = excluded.title;
do $$ begin if (select title from public.lessons where id = 'les-a') <> 'Les A2' then raise exception 'upsert mislukt'; end if; end $$;

do $$ begin
  begin
    insert into public.lessons (user_id, id, title, data) values ('22222222-2222-2222-2222-222222222222', 'les-x', 'Namens ander', '{}');
    raise exception 'RLS FOUT: invoegen namens een andere gebruiker is toegestaan';
  exception when insufficient_privilege then null;
  end;
end $$;

select set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', false);
do $$
declare n int;
begin
  if (select count(*) from public.lessons) <> 0 then raise exception 'RLS FOUT: gebruiker B ziet lessen van A'; end if;
  if (select count(*) from public.lesson_blocks) <> 0 then raise exception 'RLS FOUT: gebruiker B ziet lesblokken van A'; end if;
  if (select count(*) from public.favorites) <> 0 then raise exception 'RLS FOUT: gebruiker B ziet favorieten van A'; end if;
  if (select count(*) from public.profiles) <> 1 then raise exception 'RLS FOUT: profielen zichtbaar'; end if;
  update public.lessons set title = 'gekaapt' where id = 'les-a';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS FOUT: B kan les van A wijzigen'; end if;
  delete from public.exercises where id = 'ex-single-jab';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'RLS FOUT: B kan oefening van A verwijderen'; end if;
end $$;
-- B kan een eigen item met dezelfde id hebben (samengestelde sleutel).
insert into public.lessons (user_id, id, title, data) values ('22222222-2222-2222-2222-222222222222', 'les-a', 'Les van B', '{}');

reset role;
do $$ begin if (select title from public.lessons where user_id = '11111111-1111-1111-1111-111111111111' and id = 'les-a') <> 'Les A2' then raise exception 'les van A is aangetast'; end if; end $$;

-- Niet-ingelogd (anon): geen toegang.
set role anon;
do $$ begin
  begin
    perform count(*) from public.lessons;
    raise exception 'RLS FOUT: anon kan lessen lezen';
  exception when insufficient_privilege then null;
  end;
end $$;
reset role;

-- Cascade: account verwijderen verwijdert alle gegevens.
delete from auth.users where id = '11111111-1111-1111-1111-111111111111';
do $$ begin if (select count(*) from public.lesson_blocks where user_id = '11111111-1111-1111-1111-111111111111') <> 0 then raise exception 'cascade mislukt'; end if; end $$;
select 'RLS-test geslaagd' as resultaat;
