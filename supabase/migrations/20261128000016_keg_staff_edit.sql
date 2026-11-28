-- พนักงานแก้ข้อมูลถังที่ยังรอจั้ม (status = stock) ได้ด้วย (เดิมแก้ได้เฉพาะถังบนหัวจ่าย)
drop policy if exists staff_update on public.kegs;
create policy staff_update on public.kegs for update
  using (public.is_member() and status in ('stock','on_tap'))
  with check (status in ('stock','on_tap','empty'));
