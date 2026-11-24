-- สูตรเมนู: รหัส (เช่น R01, S03), ประเภท (เมนูขาย / สูตรเตรียม) และรายการส่วนผสมแบบข้อความ
-- (รวมของที่ไม่ได้นับสต๊อกและสูตรย่อย เช่น "ข้าวมัน (R02) 1 ถ้วย")
alter table public.menus add column if not exists code text;
alter table public.menus add column if not exists kind text not null default 'dish';
alter table public.menus drop constraint if exists menus_kind_check;
alter table public.menus add constraint menus_kind_check check (kind in ('dish','prep'));
alter table public.menus add column if not exists ingredients_th text;
alter table public.menus add column if not exists ingredients_en text;
alter table public.menus add column if not exists ingredients_my text;
create unique index if not exists menus_code_uniq on public.menus (code) where code is not null;
