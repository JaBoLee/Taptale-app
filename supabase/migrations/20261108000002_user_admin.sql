-- ความปลอดภัย: role ต้องมาจาก app_metadata (ตั้งได้เฉพาะฝั่งเซิร์ฟเวอร์) ไม่ใช่ user_metadata ที่ผู้ใช้ตั้งเองได้
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, display_name, role)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    case when new.raw_app_meta_data->>'role' = 'owner' then 'owner' else 'staff' end
  );
  return new;
end $$;

-- ให้ Edge Function (service_role) แก้ role/สถานะได้ ส่วนพนักงานยังถูกล็อกเหมือนเดิม
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_owner() and current_user not in ('service_role', 'postgres', 'supabase_admin') then
    new.role := old.role;
    new.wage_per_shift := old.wage_per_shift;
    new.active := old.active;
    new.username := old.username;
  end if;
  return new;
end $$;
