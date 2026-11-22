-- จำนวนแก้วที่ขายได้จริงต่อถัง (บอส: ถัง 20 ล. ≈ 75 แก้ว) — ว่าง = คำนวณจากขนาดถัง (3.75 แก้ว/ลิตร)
alter table public.kegs add column if not exists expected_glasses int check (expected_glasses > 0);
