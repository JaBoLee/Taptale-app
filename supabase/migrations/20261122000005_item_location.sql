-- ที่เก็บของ (เช่น ในครัว_ตู้เย็น) และลำดับเดินนับ ให้หน้านับสต๊อกเรียงตามจุดเก็บจริง
alter table public.items
  add column if not exists location text,
  add column if not exists sort_order int not null default 0;

create index if not exists items_location_idx on public.items (location, sort_order);
