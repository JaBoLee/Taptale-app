-- Tap&Tale · โครงสร้างฐานข้อมูลเริ่มต้น
-- หลักการ: บันทึกแบบเพิ่มต่อท้าย (append-only) สำหรับสต๊อกและเงิน, สิทธิ์บังคับด้วย RLS

create extension if not exists pgcrypto;

-- ───────────── ผู้ใช้ ─────────────
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  role text not null default 'staff' check (role in ('owner','staff')),
  lang text not null default 'th' check (lang in ('th','en','my')),
  wage_per_shift numeric(10,2) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'owner' and active)
$$;

-- สร้าง profile อัตโนมัติเมื่อมีผู้ใช้ใหม่ (อีเมลรูปแบบ username@taptale.local)
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'staff')
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ───────────── ตั้งค่าร้าน ─────────────
create table public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('shop_location', '{"lat": null, "lng": null, "radius_m": 100}'),
  ('late_rules', '{"grace_min": 0, "deduct_per_min": 0, "ot_per_min": 0}'),
  ('leave_rules', '{"sick_days": 0, "sick_paid": true, "personal_days": 0, "personal_paid": false}'),
  ('cash_tolerance', '{"amount": 0}'),
  ('empty_keg_alert', '{"max_kegs": 4, "max_days": 7}'),
  ('glass_sizes_ml', '[500]');

create table public.shift_types (
  code text primary key,
  start_time time not null,
  end_time time not null,
  sort int not null default 0
);

-- ───────────── ตารางกะ / ลงเวลา / ลา ─────────────
create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  work_date date not null,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  shift_code text references public.shift_types(code),
  status text not null default 'work' check (status in ('work','off','leave')),
  published boolean not null default false,
  unique (work_date, profile_id)
);

create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('in','out')),
  at timestamptz not null default now(),
  lat double precision,
  lng double precision,
  distance_m numeric,
  within_radius boolean not null
);

create table public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  leave_type text not null check (leave_type in ('sick','personal')),
  leave_date date not null,
  shift_code text references public.shift_types(code),
  reason text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  created_at timestamptz not null default now()
);

-- ลงเวลา: เช็คระยะจากร้านที่ฝั่งฐานข้อมูล (มือถือส่งพิกัดมา)
create or replace function public.clock(p_kind text, p_lat double precision, p_lng double precision)
returns public.attendance
language plpgsql security definer set search_path = public as $$
declare
  loc jsonb;
  d numeric;
  ok boolean;
  row public.attendance;
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  if p_kind not in ('in','out') then raise exception 'bad kind'; end if;
  select value into loc from app_settings where key = 'shop_location';
  if (loc->>'lat') is null then raise exception 'shop location not set'; end if;
  -- haversine (เมตร)
  d := 2 * 6371000 * asin(sqrt(
        power(sin(radians(p_lat - (loc->>'lat')::float8) / 2), 2) +
        cos(radians((loc->>'lat')::float8)) * cos(radians(p_lat)) *
        power(sin(radians(p_lng - (loc->>'lng')::float8) / 2), 2)));
  ok := d <= coalesce((loc->>'radius_m')::numeric, 100);
  if not ok then raise exception 'outside radius: % m', round(d); end if;
  insert into attendance (profile_id, kind, lat, lng, distance_m, within_radius)
    values (auth.uid(), p_kind, p_lat, p_lng, round(d), ok)
    returning * into row;
  return row;
end $$;

-- ───────────── วัตถุดิบ / supplier ─────────────
create table public.suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  kind text not null default 'web' check (kind in ('web','market','other'))
);

insert into public.suppliers (name, kind) values ('Makro','web'), ('Go Wholesale','web'), ('ตลาด','market');

create table public.items (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text,
  name_my text,
  category text not null default 'food' check (category in ('food','can_beer','supply')),
  count_unit text not null,
  safety_stock numeric(12,3) not null default 0,
  default_supplier_id uuid references public.suppliers(id),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.supplier_products (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  supplier_id uuid not null references public.suppliers(id),
  product_name text not null,
  url text,
  pack_qty numeric(12,3) not null default 1,        -- 1 แพ็ก = กี่หน่วยนับ
  order_weekdays int[] not null default '{}',        -- 0=อา … 6=ส
  preferred boolean not null default true
);

-- สต๊อก: count = ตั้งยอดใหม่, receive = รับเข้า, waste/loss = หักออก
create table public.stock_events (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.items(id) on delete cascade,
  kind text not null check (kind in ('count','receive','waste','loss')),
  qty numeric(12,3) not null check (qty >= 0),
  reason text,
  note text,
  photo_url text,
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.stock_events (item_id, created_at desc);

create or replace view public.current_stock with (security_invoker = true) as
with last_count as (
  select distinct on (item_id) item_id, qty, created_at
  from public.stock_events where kind = 'count'
  order by item_id, created_at desc
)
select i.id as item_id,
       coalesce(lc.qty, 0)
       + coalesce(sum(e.qty) filter (where e.kind = 'receive'), 0)
       - coalesce(sum(e.qty) filter (where e.kind in ('waste','loss')), 0) as qty,
       lc.created_at as last_counted_at
from public.items i
left join last_count lc on lc.item_id = i.id
left join public.stock_events e
  on e.item_id = i.id and e.kind <> 'count' and (lc.created_at is null or e.created_at > lc.created_at)
group by i.id, lc.qty, lc.created_at;

-- ───────────── เมนูและสูตร ─────────────
create table public.menus (
  id uuid primary key default gen_random_uuid(),
  name_th text not null,
  name_en text,
  name_my text,
  steps_th text,
  steps_en text,
  steps_my text,
  min_portions int not null default 1,
  active boolean not null default true
);

create table public.recipe_lines (
  menu_id uuid not null references public.menus(id) on delete cascade,
  item_id uuid not null references public.items(id),
  qty numeric(12,3) not null check (qty > 0),        -- ในหน่วยนับของวัตถุดิบ
  primary key (menu_id, item_id)
);

create or replace view public.menu_availability with (security_invoker = true) as
select m.id as menu_id,
       floor(min(cs.qty / rl.qty))::int as portions,
       floor(min(cs.qty / rl.qty)) >= m.min_portions as available
from public.menus m
join public.recipe_lines rl on rl.menu_id = m.id
join public.current_stock cs on cs.item_id = rl.item_id
group by m.id, m.min_portions;

-- ───────────── เบียร์สด / ถัง ─────────────
create table public.kegs (
  id uuid primary key default gen_random_uuid(),
  beer_name text not null,
  brand text not null,
  keg_type text not null check (keg_type in ('pet','steel')),
  size_l numeric(6,2) not null,
  glass_ml int not null default 500,
  cost numeric(10,2),
  status text not null default 'stock' check (status in ('stock','on_tap','empty','cleared')),
  tap_no int,
  received_at timestamptz not null default now(),
  tapped_at timestamptz,
  emptied_at timestamptz,
  return_status text check (return_status in ('pending','notified','scheduled')),
  return_date date,
  cleared_at timestamptz,
  cleared_how text check (cleared_how in ('donated','sold','returned')),
  sale_amount numeric(10,2)
);

create table public.keg_readings (
  id uuid primary key default gen_random_uuid(),
  keg_id uuid not null references public.kegs(id) on delete cascade,
  counter int not null check (counter >= 0),
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────── เงินสด / ปิดกะ / บัญชี ─────────────
create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  photo_path text not null,                         -- ใน Supabase Storage
  drive_url text,
  supplier_hint text,
  note text,
  ocr jsonb,
  status text not null default 'pending' check (status in ('pending','posted','rejected')),
  uploaded_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.shift_closes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) default auth.uid(),
  work_date date not null,
  shift_code text references public.shift_types(code),
  bill_count int,
  bill_total numeric(12,2),
  cash_open numeric(12,2),
  cash_close numeric(12,2),
  photo_path text,
  drive_url text,
  ocr jsonb,
  closed_at timestamptz not null default now()
);

create table public.cash_movements (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('out','in')),
  amount numeric(12,2) not null check (amount > 0),
  reason text not null check (reason in ('change','fresh_food','delivery','other')),
  note text,
  receipt_id uuid references public.receipts(id),
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.ledger (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null,
  direction text not null check (direction in ('income','expense')),
  amount numeric(12,2) not null,
  vat numeric(12,2),
  has_tax_invoice boolean,
  category text,
  vendor text,
  description text,
  source text not null check (source in ('receipt','manual','pos','keg_sale')),
  receipt_id uuid references public.receipts(id),
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.purchase_marks (
  id uuid primary key default gen_random_uuid(),
  supplier_product_id uuid not null references public.supplier_products(id) on delete cascade,
  packs numeric(10,2),
  status text not null default 'ordered' check (status in ('ordered','received')),
  created_by uuid references public.profiles(id) default auth.uid(),
  created_at timestamptz not null default now()
);

create table public.alerts (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  message text not null,
  ref jsonb,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- ───────────── RLS ─────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','app_settings','shift_types','shift_assignments','attendance','leave_requests',
    'suppliers','items','supplier_products','stock_events','menus','recipe_lines','kegs','keg_readings',
    'receipts','shift_closes','cash_movements','ledger','purchase_marks','alerts']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy owner_all on public.%I for all using (public.is_owner()) with check (public.is_owner())', t);
  end loop;
end $$;

-- พนักงานอ่านข้อมูลอ้างอิงได้
create policy staff_read on public.shift_types for select using (auth.uid() is not null);
create policy staff_read on public.app_settings for select using (auth.uid() is not null and key in ('glass_sizes_ml'));
create policy staff_read on public.suppliers for select using (auth.uid() is not null);
create policy staff_read on public.items for select using (auth.uid() is not null);
create policy staff_read on public.supplier_products for select using (auth.uid() is not null);
create policy staff_read on public.menus for select using (auth.uid() is not null);
create policy staff_read on public.recipe_lines for select using (auth.uid() is not null);
create policy staff_read on public.kegs for select using (auth.uid() is not null);
create policy staff_read on public.keg_readings for select using (auth.uid() is not null);
create policy staff_read on public.stock_events for select using (auth.uid() is not null);
create policy staff_read on public.shift_assignments for select using (published and auth.uid() is not null);

-- ข้อมูลของตัวเอง
create policy own_read on public.profiles for select using (id = auth.uid());
create policy own_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

-- พนักงานแก้ได้แค่ภาษา/ชื่อที่แสดง ฟิลด์อื่นถูกล็อกด้วย trigger
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() then
    new.role := old.role;
    new.wage_per_shift := old.wage_per_shift;
    new.active := old.active;
    new.username := old.username;
  end if;
  return new;
end $$;

create trigger protect_profile_fields before update on public.profiles
  for each row execute function public.protect_profile_fields();
create policy own_read on public.attendance for select using (profile_id = auth.uid());
create policy own_rw on public.leave_requests for select using (profile_id = auth.uid());
create policy own_insert on public.leave_requests for insert with check (profile_id = auth.uid() and status = 'pending');

-- พนักงานบันทึกงานประจำวันได้
create policy staff_insert on public.stock_events for insert with check (created_by = auth.uid());
create policy staff_insert on public.keg_readings for insert with check (created_by = auth.uid());
create policy staff_update on public.kegs for update using (auth.uid() is not null and status in ('stock','on_tap'))
  with check (status in ('on_tap','empty'));
create policy staff_insert on public.receipts for insert with check (uploaded_by = auth.uid());
create policy own_read on public.receipts for select using (uploaded_by = auth.uid());
create policy staff_insert on public.shift_closes for insert with check (profile_id = auth.uid());
create policy own_read on public.shift_closes for select using (profile_id = auth.uid());
create policy staff_insert on public.cash_movements for insert with check (created_by = auth.uid());
create policy own_read on public.cash_movements for select using (created_by = auth.uid());

-- ข้อมูลกะติดกันต้องเห็นเงินปิดกะล่าสุดเพื่อเปิดกะ
create or replace function public.last_cash_close() returns numeric
language sql stable security definer set search_path = public as $$
  select cash_close from shift_closes order by closed_at desc limit 1
$$;
