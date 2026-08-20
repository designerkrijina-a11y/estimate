-- Run this once in Supabase Dashboard -> SQL Editor -> New query -> Run.
--
-- 견적서 연락처 단계에서 입력받는 "직급/직책"이 지금까지는 DB에 저장되지 않고 있었다.
-- 이 컬럼을 추가하고, 코드에서도 실제로 저장하도록 고쳤다.

alter table public.estimate_requests
  add column if not exists position text;
