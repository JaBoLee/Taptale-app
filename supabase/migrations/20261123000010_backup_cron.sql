-- สำรองข้อมูลลง Google Sheet อัตโนมัติทุกวัน 07:00 (เวลาไทย = 00:00 UTC)
-- ไม่ต้องเก็บรหัสลับ: ฐานข้อมูลสร้างโทเคนใช้ครั้งเดียว ส่งไปกับคำขอ แล้วฟังก์ชัน google-sync ตรวจและลบทิ้ง
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create table if not exists public.cron_tokens (
  token uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now()
);
alter table public.cron_tokens enable row level security; -- ไม่มี policy = ผู้ใช้แอปเข้าไม่ได้ (เฉพาะ service role)

create or replace function public.run_google_backup(p_mode text default 'backup') returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare tok uuid; req bigint;
begin
  delete from public.cron_tokens where created_at < now() - interval '1 hour';
  insert into public.cron_tokens default values returning token into tok;
  select net.http_post(
    url := 'https://ddmltpvqvuvxqcflrrvj.supabase.co/functions/v1/google-sync',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-token', tok::text),
    body := jsonb_build_object('mode', p_mode),
    timeout_milliseconds := 150000
  ) into req;
  return req;
end $$;
revoke all on function public.run_google_backup(text) from public, anon, authenticated;

do $$ begin
  perform cron.unschedule('google-backup-0700');
exception when others then null;
end $$;
select cron.schedule('google-backup-0700', '0 0 * * *', $$select public.run_google_backup('backup')$$);
