-- ส่วนเสริมสำหรับหน้าจอทั้งหมด: กะเริ่มต้น, รายชื่อสมาชิก, ที่เก็บรูป, สิทธิ์อ่านกติกาการลา

-- กะเริ่มต้น (เจ้าของแก้เวลาได้ในหน้าตั้งค่า)
insert into public.shift_types (code, start_time, end_time, sort) values
  ('A', '09:00', '17:00', 1),
  ('B', '17:00', '01:00', 2),
  ('C', '11:00', '19:00', 3)
on conflict (code) do nothing;

-- รายชื่อสมาชิก (ไม่รวมค่าแรง) สำหรับตารางกะ ให้สมาชิกทุกคนเห็น
create or replace function public.list_members()
returns table (id uuid, display_name text, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.display_name, p.role from public.profiles p
  where p.active and public.is_member()
  order by p.role desc, p.display_name
$$;

-- พนักงานอ่านกติกาการลาได้ (เพื่อดูสิทธิ์คงเหลือของตัวเอง)
drop policy if exists staff_read on public.app_settings;
create policy staff_read on public.app_settings for select
  using (public.is_member() and key in ('glass_sizes_ml', 'leave_rules'));

-- พนักงานรับถังเบียร์เข้าได้
create policy staff_insert on public.kegs for insert with check (public.is_member() and status = 'stock');

-- ที่เก็บรูป (ใบเสร็จ / ใบปิดกะ / ของเสีย) แบบไม่สาธารณะ
insert into storage.buckets (id, name, public) values ('photos', 'photos', false)
on conflict (id) do nothing;

create policy photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'photos' and public.is_member());
create policy photos_read on storage.objects for select to authenticated
  using (bucket_id = 'photos' and (public.is_owner() or owner_id = auth.uid()::text));
create policy photos_owner_delete on storage.objects for delete to authenticated
  using (bucket_id = 'photos' and public.is_owner());

-- กันลงเวลาซ้ำภายใน 1 นาที (กดปุ่มรัว)
create or replace function public.clock(p_kind text, p_lat double precision, p_lng double precision)
returns public.attendance
language plpgsql security definer set search_path = public as $$
declare
  loc jsonb;
  d numeric;
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
  if d > coalesce((loc->>'radius_m')::numeric, 100) then
    raise exception 'outside radius: % m', round(d);
  end if;
  select * into row from attendance
    where profile_id = auth.uid() and kind = p_kind and at > now() - interval '1 minute'
    order by at desc limit 1;
  if found then return row; end if;
  insert into attendance (profile_id, kind, lat, lng, distance_m, within_radius)
    values (auth.uid(), p_kind, p_lat, p_lng, round(d), true)
    returning * into row;
  return row;
end $$;
