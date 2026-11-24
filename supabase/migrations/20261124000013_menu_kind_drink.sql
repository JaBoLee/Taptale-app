-- สูตร: เพิ่มประเภท "เครื่องดื่ม" (dish = เมนูอาหาร, drink = เครื่องดื่ม, prep = สูตรเตรียม)
alter table public.menus drop constraint if exists menus_kind_check;
alter table public.menus add constraint menus_kind_check check (kind in ('dish','drink','prep'));
