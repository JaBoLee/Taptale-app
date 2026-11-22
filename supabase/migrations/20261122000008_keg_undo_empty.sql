-- กด "เบียร์หมด" ผิด → พนักงานดึงถังกลับขึ้นหัวจ่ายได้ ภายใน 3 วัน และต้องยังไม่ถูกเจ้าของเคลียร์
drop policy if exists staff_undo_empty on public.kegs;
create policy staff_undo_empty on public.kegs for update
  using (public.is_member() and status = 'empty' and cleared_at is null and emptied_at > now() - interval '3 days')
  with check (public.is_member() and status = 'on_tap');
