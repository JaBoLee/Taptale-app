-- 1) พนักงานแก้รายการจั้มเบียร์ของตัวเองได้ (เลขตัวนับ/วันที่) — เจ้าของแก้ได้ทุกอย่างอยู่แล้ว
drop policy if exists staff_update_own on public.keg_readings;
create policy staff_update_own on public.keg_readings for update
  using (public.is_member() and created_by = auth.uid())
  with check (public.is_member() and created_by = auth.uid());

-- 2) ช่องทางชำระที่พนักงานกดผิดใน POS (บันทึกตอนปิดกะ ได้หลายรายการ) — append-only
create table if not exists public.payment_fixes (
  id uuid primary key default gen_random_uuid(),
  shift_close_id uuid references public.shift_closes(id) on delete set null,
  work_date date not null default (now() at time zone 'Asia/Bangkok')::date,
  shift_code text,
  bill_no text,
  amount numeric(12,2) not null check (amount > 0),
  recorded_as text not null check (recorded_as in ('cash','qr','card')),
  actual text not null check (actual in ('cash','qr','card')),
  note text,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (recorded_as <> actual)
);
create index if not exists payment_fixes_date_idx on public.payment_fixes (work_date desc);

alter table public.payment_fixes enable row level security;
drop policy if exists owner_all on public.payment_fixes;
create policy owner_all on public.payment_fixes for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists staff_insert on public.payment_fixes;
create policy staff_insert on public.payment_fixes for insert with check (public.is_member() and created_by = auth.uid());
drop policy if exists staff_read_own on public.payment_fixes;
create policy staff_read_own on public.payment_fixes for select using (public.is_member() and created_by = auth.uid());

-- 3) ยอดปิดกะล่าสุดให้เห็นเฉพาะเจ้าของ (พนักงานต้องนับเงินเปิดกะเองโดยไม่เห็นยอดกะก่อน)
create or replace function public.last_cash_close() returns numeric
language sql stable security definer set search_path = public as $$
  select cash_close from shift_closes where public.is_owner() order by closed_at desc limit 1
$$;
