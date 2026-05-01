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
with check (expires_at <= now() + interval '24 hours 5 minutes');

drop policy if exists "message nods are public read" on public.message_nods;
create policy "message nods are public read"
on public.message_nods for select
to anon
using (true);

drop policy if exists "visitors can nod once" on public.message_nods;
create policy "visitors can nod once"
on public.message_nods for insert
to anon
with check (true);

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
