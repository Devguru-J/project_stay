create extension if not exists pgcrypto;

create table if not exists public.rooms (
  id text primary key,
  name text not null,
  place text not null,
  mood text not null,
  accent text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  visitor_id text not null,
  display_name text not null,
  body text not null check (char_length(body) between 1 and 64),
  tone text not null default 'soft' check (tone in ('soft', 'warm', 'quiet')),
  nods integer not null default 0 check (nods >= 0),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.room_reactions (
  id uuid primary key default gen_random_uuid(),
  room_id text not null references public.rooms(id) on delete cascade,
  visitor_id text not null,
  label text not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours')
);

create table if not exists public.message_nods (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  visitor_id text not null,
  created_at timestamptz not null default now(),
  unique (message_id, visitor_id)
);

create index if not exists messages_room_created_idx on public.messages (room_id, created_at desc);
create index if not exists messages_expires_idx on public.messages (expires_at);
create index if not exists room_reactions_room_created_idx on public.room_reactions (room_id, created_at desc);
create index if not exists room_reactions_expires_idx on public.room_reactions (expires_at);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'messages_visitor_id_length') then
    alter table public.messages
      add constraint messages_visitor_id_length check (char_length(visitor_id) between 8 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'messages_display_name_length') then
    alter table public.messages
      add constraint messages_display_name_length check (char_length(display_name) between 1 and 24) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'room_reactions_visitor_id_length') then
    alter table public.room_reactions
      add constraint room_reactions_visitor_id_length check (char_length(visitor_id) between 8 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'room_reactions_known_label') then
    alter table public.room_reactions
      add constraint room_reactions_known_label
      check (label in ('옆에 있어요', '말 안 해도 알아요', '천천히 쉬어가요', '오늘도 버텼네')) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'message_nods_visitor_id_length') then
    alter table public.message_nods
      add constraint message_nods_visitor_id_length check (char_length(visitor_id) between 8 and 80) not valid;
  end if;
end $$;

alter table public.rooms enable row level security;
alter table public.messages enable row level security;
alter table public.room_reactions enable row level security;
alter table public.message_nods enable row level security;

drop policy if exists "rooms are public read" on public.rooms;
create policy "rooms are public read"
on public.rooms for select
to anon
using (true);

drop policy if exists "messages are public read" on public.messages;
create policy "messages are public read"
on public.messages for select
to anon
using (expires_at > now());

drop policy if exists "visitors can write messages" on public.messages;
create policy "visitors can write messages"
on public.messages for insert
to anon
with check (
  expires_at <= now() + interval '24 hours 5 minutes'
  and char_length(body) between 1 and 64
  and char_length(visitor_id) between 8 and 80
  and char_length(display_name) between 1 and 24
  and tone in ('soft', 'warm', 'quiet')
);

drop policy if exists "room reactions are public read" on public.room_reactions;
create policy "room reactions are public read"
on public.room_reactions for select
to anon
using (expires_at > now());

drop policy if exists "visitors can write room reactions" on public.room_reactions;
create policy "visitors can write room reactions"
on public.room_reactions for insert
to anon
with check (
  expires_at <= now() + interval '24 hours 5 minutes'
  and char_length(visitor_id) between 8 and 80
  and label in ('옆에 있어요', '말 안 해도 알아요', '천천히 쉬어가요', '오늘도 버텼네')
);

drop policy if exists "message nods are public read" on public.message_nods;
create policy "message nods are public read"
on public.message_nods for select
to anon
using (true);

drop policy if exists "visitors can nod once" on public.message_nods;
create policy "visitors can nod once"
on public.message_nods for insert
to anon
with check (
  char_length(visitor_id) between 8 and 80
  and exists (
    select 1
    from public.messages
    where messages.id = message_nods.message_id
      and messages.expires_at > now()
  )
);

insert into public.rooms (id, name, place, mood, accent) values
  ('bench', '퇴근 후 벤치', '아직 식지 않은 가로등 아래', '말없이 나란히 앉기', '#7c9a76'),
  ('rain', '비 오는 창가', '물방울이 천천히 내려오는 자리', '작게 털어놓기', '#6f9aa0'),
  ('store', '새벽 2시 편의점 앞', '온장고 불빛이 남아 있는 곳', '멍하니 버티기', '#c48a61'),
  ('bus', '막차 기다리는 곳', '젖은 노선도 앞', '집에 가는 마음', '#aa9a76')
on conflict (id) do update set
  name = excluded.name,
  place = excluded.place,
  mood = excluded.mood,
  accent = excluded.accent;


-- ============================================================
-- Production safety — added 2026-05-01
-- ============================================================

-- Suggestions table for feedback
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

alter table public.suggestions enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'suggestions_visitor_id_length') then
    alter table public.suggestions
      add constraint suggestions_visitor_id_length check (char_length(visitor_id) between 8 and 80) not valid;
  end if;
end $$;

drop policy if exists "anyone can suggest" on public.suggestions;
create policy "anyone can suggest"
on public.suggestions for insert
to anon
with check (
  char_length(visitor_id) between 8 and 80
  and char_length(body) between 1 and 300
);

-- Soft-moderation queue. Anon can insert. No anon read. Admin/service-role only.
create table if not exists public.message_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages(id) on delete cascade,
  visitor_id text not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists message_reports_message_idx on public.message_reports (message_id);

alter table public.message_reports enable row level security;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'message_reports_visitor_id_length') then
    alter table public.message_reports
      add constraint message_reports_visitor_id_length check (char_length(visitor_id) between 8 and 80) not valid;
  end if;

  if not exists (select 1 from pg_constraint where conname = 'message_reports_reason_length') then
    alter table public.message_reports
      add constraint message_reports_reason_length check (reason is null or char_length(reason) <= 120) not valid;
  end if;
end $$;

drop policy if exists "anyone can report" on public.message_reports;
create policy "anyone can report"
on public.message_reports for insert
to anon
with check (
  char_length(visitor_id) between 8 and 80
  and (reason is null or char_length(reason) <= 120)
);

-- Rate limit: 1 message per visitor per 12 seconds
create or replace function public.enforce_message_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.messages
    where visitor_id = new.visitor_id
      and created_at > now() - interval '12 seconds'
  ) then
    raise exception using
      errcode = 'P0001',
      message = '잠깐 숨을 고르고 다시 둬주세요.';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_rate_limit on public.messages;
create trigger messages_rate_limit
before insert on public.messages
for each row execute function public.enforce_message_rate_limit();

-- Rate limit: 1 suggestion per visitor per 5 minutes
create or replace function public.enforce_suggestion_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from public.suggestions
    where visitor_id = new.visitor_id
      and created_at > now() - interval '5 minutes'
  ) then
    raise exception using
      errcode = 'P0001',
      message = '잠깐 뒤에 다시 남겨주세요.';
  end if;
  return new;
end;
$$;

drop trigger if exists suggestions_rate_limit on public.suggestions;
create trigger suggestions_rate_limit
before insert on public.suggestions
for each row execute function public.enforce_suggestion_rate_limit();

-- Rate limit: 4 reactions per minute per visitor per room
create or replace function public.enforce_reaction_rate_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.room_reactions
    where visitor_id = new.visitor_id
      and room_id = new.room_id
      and created_at > now() - interval '1 minute'
  ) >= 4 then
    raise exception using
      errcode = 'P0001',
      message = '잠시 뒤에 다시 들러주세요.';
  end if;
  return new;
end;
$$;

drop trigger if exists room_reactions_rate_limit on public.room_reactions;
create trigger room_reactions_rate_limit
before insert on public.room_reactions
for each row execute function public.enforce_reaction_rate_limit();

-- Cleanup: schedule via pg_cron extension or external scheduler (e.g. Cloudflare Cron)
create or replace function public.purge_expired()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.messages where expires_at < now() - interval '1 hour';
  delete from public.room_reactions where expires_at < now() - interval '1 hour';
  delete from public.suggestions where created_at < now() - interval '30 days';
  delete from public.message_nods
    where message_id not in (select id from public.messages);
  delete from public.message_reports where created_at < now() - interval '7 days';
$$;
