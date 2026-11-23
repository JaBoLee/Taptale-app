-- ─── 1) เงินเดือนประจำ + OT ต่อชั่วโมง + วันเริ่มงาน (แยกตาราง: เห็นเฉพาะเจ้าของและเจ้าตัว) ───
create table if not exists public.staff_pay (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  monthly_salary numeric(10,2) not null default 0 check (monthly_salary >= 0),
  ot_rate numeric(10,2) not null default 0 check (ot_rate >= 0),   -- บาท/ชั่วโมง
  start_date date,                                                 -- วันเริ่มงาน (ใช้คิดสิทธิ์พักร้อน)
  updated_at timestamptz not null default now()
);
alter table public.staff_pay enable row level security;
drop policy if exists owner_all on public.staff_pay;
create policy owner_all on public.staff_pay for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists own_read on public.staff_pay;
create policy own_read on public.staff_pay for select using (profile_id = auth.uid());

-- ─── 2) วันหยุดนักขัตฤกษ์ของร้าน (เจ้าของกำหนดแต่ละปี) ───
create table if not exists public.public_holidays (
  id uuid primary key default gen_random_uuid(),
  holiday_date date not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
alter table public.public_holidays enable row level security;
drop policy if exists owner_all on public.public_holidays;
create policy owner_all on public.public_holidays for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists member_read on public.public_holidays;
create policy member_read on public.public_holidays for select using (public.is_member());

-- ─── 3) ประเภทการหยุด: ลาป่วย / ลากิจ / ใช้วันหยุดนักขัตฤกษ์ / พักร้อน / หยุดไม่รับค่าจ้าง ───
alter table public.leave_requests drop constraint if exists leave_requests_leave_type_check;
alter table public.leave_requests add constraint leave_requests_leave_type_check
  check (leave_type in ('sick','personal','holiday','annual','unpaid'));
alter table public.leave_requests add column if not exists holiday_id uuid references public.public_holidays(id) on delete restrict;

-- ใช้วันหยุดนักขัตฤกษ์ได้ต่อเมื่อผ่านวันนั้นไปแล้ว และวันละ 1 ครั้งต่อคน
create or replace function public.check_leave_holiday() returns trigger
language plpgsql security invoker set search_path = public as $$
declare h date;
begin
  if new.leave_type = 'holiday' then
    if new.holiday_id is null then raise exception 'holiday_required'; end if;
    select holiday_date into h from public.public_holidays where id = new.holiday_id;
    if h is null or new.leave_date <= h then raise exception 'holiday_not_passed'; end if;
  else
    new.holiday_id := null;
  end if;
  return new;
end $$;
drop trigger if exists check_leave_holiday on public.leave_requests;
create trigger check_leave_holiday before insert or update on public.leave_requests
  for each row execute function public.check_leave_holiday();

create unique index if not exists leave_holiday_once
  on public.leave_requests (profile_id, holiday_id) where holiday_id is not null and status <> 'rejected';
