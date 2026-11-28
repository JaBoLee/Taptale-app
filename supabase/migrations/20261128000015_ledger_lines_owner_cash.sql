-- 1) รายการสินค้าในแต่ละรายการบัญชี (รายจ่าย = สินค้าที่ซื้อตามใบเสร็จ · รายรับ = เตรียมไว้ใช้ภายหลัง)
--    ผูกกับรายการบัญชี (ledger_id) หรือกับรายการนำเงินออกจากลิ้นชักที่พนักงานกรอกตอนปิดกะ (cash_movement_id)
create table if not exists public.ledger_lines (
  id uuid primary key default gen_random_uuid(),
  ledger_id uuid references public.ledger(id) on delete cascade,
  cash_movement_id uuid references public.cash_movements(id) on delete cascade,
  item_id uuid references public.items(id) on delete set null,   -- สินค้าในฐานข้อมูลร้าน (ถ้าจับคู่ได้)
  description text not null,                                     -- ชื่อตามใบเสร็จ
  qty numeric(12,3) not null default 1 check (qty > 0),
  unit text,
  unit_price numeric(12,2) not null default 0,
  amount numeric(12,2) not null,
  sort int not null default 0,
  to_stock boolean not null default false,                       -- รับเข้าสต๊อกอัตโนมัติเมื่อบันทึก
  stock_qty numeric(12,3),                                       -- จำนวนเข้าสต๊อก (หน่วยนับของสินค้า)
  stock_event_id uuid references public.stock_events(id) on delete set null,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now(),
  check (ledger_id is not null or cash_movement_id is not null)
);
create index if not exists ledger_lines_ledger_idx on public.ledger_lines (ledger_id);
create index if not exists ledger_lines_move_idx on public.ledger_lines (cash_movement_id);

-- รายการสินค้าที่จับคู่กับสินค้าในร้าน + ติ๊กรับเข้าสต๊อก → บันทึก "รับเข้า" ในสต๊อกให้อัตโนมัติ (ครั้งเดียวต่อบรรทัด)
create or replace function public.ledger_line_to_stock() returns trigger
language plpgsql security definer set search_path = public as $$
declare ev uuid;
begin
  if new.to_stock and new.item_id is not null and coalesce(new.stock_qty, 0) > 0 and new.stock_event_id is null then
    insert into stock_events (item_id, kind, qty, reason, note, created_by)
    values (new.item_id, 'receive', new.stock_qty, 'receipt', new.description, coalesce(new.created_by, auth.uid()))
    returning id into ev;
    new.stock_event_id := ev;
  end if;
  return new;
end $$;
drop trigger if exists ledger_line_to_stock on public.ledger_lines;
create trigger ledger_line_to_stock before insert on public.ledger_lines
  for each row execute function public.ledger_line_to_stock();
alter table public.ledger_lines enable row level security;
drop policy if exists owner_all on public.ledger_lines;
create policy owner_all on public.ledger_lines for all using (public.is_owner()) with check (public.is_owner());
drop policy if exists staff_insert_own_move on public.ledger_lines;
create policy staff_insert_own_move on public.ledger_lines for insert with check (
  public.is_member() and ledger_id is null
  and exists (select 1 from public.cash_movements m where m.id = cash_movement_id and m.created_by = auth.uid()));
drop policy if exists staff_read_own_move on public.ledger_lines;
create policy staff_read_own_move on public.ledger_lines for select using (
  public.is_member() and exists (select 1 from public.cash_movements m where m.id = cash_movement_id and m.created_by = auth.uid()));

-- 2) เลขที่เอกสาร + จ่ายด้วยเงินสดที่เจ้าของถือ (แยกรายคน)
alter table public.ledger add column if not exists doc_no text;
alter table public.ledger add column if not exists holder_id uuid references public.profiles(id);
alter table public.ledger drop constraint if exists ledger_channel_check;
alter table public.ledger add constraint ledger_channel_check check (channel in ('cash','transfer','owner_cash'));

-- เงินสดที่ออกจาก/เข้าลิ้นชักโดยเจ้าของคนไหน (นำไปเก็บ = เจ้าของถือเพิ่ม · นำเข้า = เจ้าของคืนเงินเข้าลิ้นชัก)
alter table public.cash_movements add column if not exists holder_id uuid references public.profiles(id);
update public.cash_movements m set holder_id = p.id from public.profiles p
where m.reason = 'safekeep' and m.holder_id is null and p.role = 'owner'
  and lower(trim(m.note)) in (lower(p.display_name), lower(p.username));

-- 3) เงินสดเจ้าของ: ฝากธนาคาร / ปรับยอด (append-only)
create table if not exists public.owner_cash_moves (
  id uuid primary key default gen_random_uuid(),
  holder_id uuid not null references public.profiles(id),
  direction text not null check (direction in ('in','out')),
  amount numeric(12,2) not null check (amount > 0),
  reason text not null check (reason in ('deposit','adjust')),
  note text,
  move_date date not null default (now() at time zone 'Asia/Bangkok')::date,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
alter table public.owner_cash_moves enable row level security;
drop policy if exists owner_all on public.owner_cash_moves;
create policy owner_all on public.owner_cash_moves for all using (public.is_owner()) with check (public.is_owner());
