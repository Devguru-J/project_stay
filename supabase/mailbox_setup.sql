-- 작은 우체통(Suggestions) 기능을 위한 테이블 및 보안 설정
-- Supabase SQL Editor에서 이 파일 전체를 복사해 실행하세요.

-- 1. 건의 사항 저장용 테이블 생성
create table if not exists public.suggestions (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

-- 2. 행 레벨 보안(RLS) 활성화
alter table public.suggestions enable row level security;

-- 3. 누구나 제안을 남길 수 있도록 권한 설정 (Insert 허용, Read 불가)
drop policy if exists "anyone can suggest" on public.suggestions;
create policy "anyone can suggest"
on public.suggestions for insert
to anon
with check (true);

-- 4. 도배 방지를 위한 전송 제한 로직 (5분당 1회)
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

-- 5. 제안 전송 전 제한 로직 실행용 트리거 생성
drop trigger if exists suggestions_rate_limit on public.suggestions;
create trigger suggestions_rate_limit
before insert on public.suggestions
for each row execute function public.enforce_suggestion_rate_limit();
