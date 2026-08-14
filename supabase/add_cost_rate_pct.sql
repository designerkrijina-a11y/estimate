-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- 담당 직원이 여러 층으로 나뉘어 진행되는 등 간접공사비가 필요한 경우에 입력하는 공사비 요율(%).
-- 최종 견적금액에는 반영되지만, 고객에게 보이는 견적서에는 표시되지 않고 관리자 화면에서만 노출된다.

alter table public.estimate_requests
  add column if not exists cost_rate_pct numeric not null default 0;
