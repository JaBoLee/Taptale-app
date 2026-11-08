-- สมัครเอง + เจ้าของอนุมัติ
-- บัญชีที่สมัครเองจะ active = false และ approved_at = null (รออนุมัติ) จนกว่าเจ้าของจะอนุมัติ

alter table public.profiles add column if not exists approved_at timestamptz;
update public.profiles set approved_at = coalesce(approved_at, created_at) where active;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  by_admin boolean := new.raw_app_meta_data ? 'role';   -- สร้างโดยเจ้าของผ่าน Edge Function
begin
  insert into public.profiles (id, username, display_name, role, active, approved_at)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'), ''), split_part(new.email, '@', 1)),
    case when new.raw_app_meta_data->>'role' = 'owner' then 'owner' else 'staff' end,
    by_admin,
    case when by_admin then now() end
  );
  return new;
end $$;

-- สมาชิก = บัญชีที่อนุมัติแล้วและเปิดใช้งาน
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and active)
$$;

-- เปลี่ยนสิทธิ์พนักงานจาก "ล็อกอินแล้ว" เป็น "เป็นสมาชิกที่อนุมัติแล้ว"
drop policy if exists staff_read on public.shift_types;
drop policy if exists staff_read on public.app_settings;
drop policy if exists staff_read on public.suppliers;
drop policy if exists staff_read on public.items;
drop policy if exists staff_read on public.supplier_products;
drop policy if exists staff_read on public.menus;
drop policy if exists staff_read on public.recipe_lines;
drop policy if exists staff_read on public.kegs;
drop policy if exists staff_read on public.keg_readings;
drop policy if exists staff_read on public.stock_events;
drop policy if exists staff_read on public.shift_assignments;
drop policy if exists staff_insert on public.stock_events;
drop policy if exists staff_insert on public.keg_readings;
drop policy if exists staff_update on public.kegs;
drop policy if exists staff_insert on public.receipts;
drop policy if exists staff_insert on public.shift_closes;
drop policy if exists staff_insert on public.cash_movements;
drop policy if exists own_insert on public.leave_requests;

create policy staff_read on public.shift_types for select using (public.is_member());
create policy staff_read on public.app_settings for select using (public.is_member() and key in ('glass_sizes_ml'));
create policy staff_read on public.suppliers for select using (public.is_member());
create policy staff_read on public.items for select using (public.is_member());
create policy staff_read on public.supplier_products for select using (public.is_member());
create policy staff_read on public.menus for select using (public.is_member());
create policy staff_read on public.recipe_lines for select using (public.is_member());
create policy staff_read on public.kegs for select using (public.is_member());
create policy staff_read on public.keg_readings for select using (public.is_member());
create policy staff_read on public.stock_events for select using (public.is_member());
create policy staff_read on public.shift_assignments for select using (published and public.is_member());
create policy staff_insert on public.stock_events for insert with check (public.is_member() and created_by = auth.uid());
create policy staff_insert on public.keg_readings for insert with check (public.is_member() and created_by = auth.uid());
create policy staff_update on public.kegs for update using (public.is_member() and status in ('stock','on_tap'))
  with check (status in ('on_tap','empty'));
create policy staff_insert on public.receipts for insert with check (public.is_member() and uploaded_by = auth.uid());
create policy staff_insert on public.shift_closes for insert with check (public.is_member() and profile_id = auth.uid());
create policy staff_insert on public.cash_movements for insert with check (public.is_member() and created_by = auth.uid());
create policy own_insert on public.leave_requests for insert with check (public.is_member() and profile_id = auth.uid() and status = 'pending');

-- ลงเวลาได้เฉพาะสมาชิก
create or replace function public.clock(p_kind text, p_lat double precision, p_lng double precision)
returns public.attendance
language plpgsql security definer set search_path = public as $$
declare
  loc jsonb;
  d numeric;
  ok boolean;
  row public.attendance;
begin
  if not public.is_member() then raise exception 'not a member'; end if;
  if p_kind not in ('in','out') then raise exception 'bad kind'; end if;
  select value into loc from app_settings where key = 'shop_location';
  if (loc->>'lat') is null then raise exception 'shop location not set'; end if;
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

-- เงินปิดกะล่าสุด: เฉพาะสมาชิก
create or replace function public.last_cash_close() returns numeric
language sql stable security definer set search_path = public as $$
  select cash_close from shift_closes where public.is_member() order by closed_at desc limit 1
$$;

-- พนักงานแก้ approved_at เองไม่ได้
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security invoker set search_path = public as $$
begin
  if not public.is_owner() and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    new.role := old.role;
    new.wage_per_shift := old.wage_per_shift;
    new.active := old.active;
    new.username := old.username;
    new.approved_at := old.approved_at;
  end if;
  return new;
end $$;
