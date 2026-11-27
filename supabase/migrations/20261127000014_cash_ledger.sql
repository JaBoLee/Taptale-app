-- 1) เงินลิ้นชักไม่ต่อเนื่อง: เจ้าของกด "ตรวจแล้ว" (+ หมายเหตุ) เพื่อซ่อนจากหน้าเจ้าของ
alter table public.shift_closes add column if not exists cash_reviewed_at timestamptz;
alter table public.shift_closes add column if not exists cash_reviewed_by uuid references public.profiles(id);
alter table public.shift_closes add column if not exists cash_review_note text;

-- 2) นำเงินออก: เพิ่มเหตุผล "นำไปเก็บ (เจ้าของ)" = ย้ายเงิน ไม่ใช่รายจ่าย
alter table public.cash_movements drop constraint if exists cash_movements_reason_check;
alter table public.cash_movements add constraint cash_movements_reason_check
  check (reason in ('change','fresh_food','delivery','other','safekeep'));

-- 3) บัญชี: ช่องทางเงิน (เงินสด / โอน-บัตร) + ลิงก์รายการลิ้นชัก
alter table public.ledger add column if not exists channel text check (channel in ('cash','transfer'));
alter table public.ledger add column if not exists cash_movement_id uuid unique references public.cash_movements(id) on delete cascade;
alter table public.ledger drop constraint if exists ledger_source_check;
alter table public.ledger add constraint ledger_source_check
  check (source in ('receipt','manual','pos','keg_sale','cash_drawer'));

-- จ่ายเงินสดจากลิ้นชัก (ซื้อของสด / ค่าขนส่ง / อื่น ๆ) → ลงบัญชีเป็นรายจ่ายเงินสดอัตโนมัติ
create or replace function public.cash_move_to_ledger() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.direction = 'out' and new.reason in ('fresh_food','delivery','other') then
    insert into ledger (entry_date, direction, amount, category, description, source, receipt_id, channel, cash_movement_id, created_by)
    values ((new.created_at at time zone 'Asia/Bangkok')::date, 'expense', new.amount,
            case new.reason when 'fresh_food' then 'food' when 'delivery' then 'transport' else 'other' end,
            new.note, 'cash_drawer', new.receipt_id, 'cash', new.id, new.created_by)
    on conflict (cash_movement_id) do nothing;
  end if;
  return new;
end $$;
drop trigger if exists cash_move_to_ledger on public.cash_movements;
create trigger cash_move_to_ledger after insert on public.cash_movements
  for each row execute function public.cash_move_to_ledger();

-- ย้อนลงบัญชีให้รายการที่บันทึกไปแล้ว
insert into public.ledger (entry_date, direction, amount, category, description, source, receipt_id, channel, cash_movement_id, created_by)
select (m.created_at at time zone 'Asia/Bangkok')::date, 'expense', m.amount,
       case m.reason when 'fresh_food' then 'food' when 'delivery' then 'transport' else 'other' end,
       m.note, 'cash_drawer', m.receipt_id, 'cash', m.id, m.created_by
from public.cash_movements m
where m.direction = 'out' and m.reason in ('fresh_food','delivery','other')
on conflict (cash_movement_id) do nothing;
