-- 군 수당 가이드 초기 스키마
-- 적용: Supabase 대시보드 SQL Editor 에 붙여넣거나 `supabase db push`
-- 모든 테이블은 RLS 를 켜고 공개 정책을 만들지 않습니다.
-- → 브라우저(anon key)로는 접근할 수 없고, 서버의 service role key 로만 읽고 씁니다.

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- 1) 챗봇 대화 로그 (개인정보는 저장 전에 서버에서 가림)
-- ─────────────────────────────────────────────
create table if not exists public.chat_logs (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  question_masked  text not null check (char_length(question_masked) <= 1000),
  answer           text not null,
  source_ids       text[] not null default '{}',
  target           text check (target in ('officer', 'soldier', 'civilian')),
  mode             text not null check (mode in ('ai', 'rule', 'blocked', 'unknown'))
);
create index if not exists chat_logs_created_at_idx on public.chat_logs (created_at desc);
create index if not exists chat_logs_mode_idx on public.chat_logs (mode);
alter table public.chat_logs enable row level security;

-- ─────────────────────────────────────────────
-- 2) 답변 평가 (도움됨 / 아쉬움)
-- ─────────────────────────────────────────────
create table if not exists public.chat_feedback (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  log_id           uuid references public.chat_logs (id) on delete set null,
  rating           text not null check (rating in ('up', 'down')),
  reason           text check (reason in ('wrong', 'outdated', 'unclear', 'not_answered', 'other')),
  comment          text check (char_length(comment) <= 300),
  question_masked  text check (char_length(question_masked) <= 1000)
);
create index if not exists chat_feedback_created_at_idx on public.chat_feedback (created_at desc);
alter table public.chat_feedback enable row level security;

-- ─────────────────────────────────────────────
-- 3) 수당 데이터 (선택: 2차 관리자 화면용)
--    1차에서는 저장소의 data/allowances.ts 가 단일 출처입니다.
--    `npm run seed:sql` 로 supabase/seed.sql 을 만들어 같은 내용을 넣을 수 있습니다.
-- ─────────────────────────────────────────────
create table if not exists public.allowances (
  id                    text primary key,
  name                  text not null,
  aliases               text[] not null default '{}',
  category              text not null,
  targets               text[] not null,
  summary               text not null,
  amount                text not null,
  amount_table          jsonb,
  requires_application  boolean not null default false,
  eligibility           text[] not null default '{}',
  how_to_apply          text[] not null default '{}',
  documents             text[] not null default '{}',
  notes                 text[] not null default '{}',
  legal_basis           jsonb not null default '[]',
  verified_at           date not null,
  needs_verification    boolean not null default false,
  updated_at            timestamptz not null default now()
);
alter table public.allowances enable row level security;

-- 운영 보기: 답을 못 한 질문 (FAQ·데이터 보강용)
create or replace view public.unanswered_questions
with (security_invoker = true) as
select created_at, question_masked, target
from public.chat_logs
where mode = 'unknown'
order by created_at desc;

-- 운영 보기: 아쉬움 평가가 달린 답변
create or replace view public.negative_feedback
with (security_invoker = true) as
select f.created_at, f.reason, f.comment, coalesce(l.question_masked, f.question_masked) as question, l.answer, l.mode
from public.chat_feedback f
left join public.chat_logs l on l.id = f.log_id
where f.rating = 'down'
order by f.created_at desc;

-- 로그 보관 기간 정리 (예: 180일). pg_cron 을 켠 경우 아래 주석을 풀어 예약하세요.
-- select cron.schedule('purge-chat-logs', '0 3 * * *', $$delete from public.chat_logs where created_at < now() - interval '180 days'$$);
