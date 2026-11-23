-- สำรองข้อมูลเต็มลง Google Sheet สัปดาห์ละ 2 ครั้ง: จันทร์ + พฤหัส 07:00 เวลาไทย (= 00:00 UTC)
-- (แท็บ "ต้องสั่ง" ยังอัปเดตทันทีทุกครั้งที่นับสต๊อก/รับของ/กดสั่งแล้ว จากในแอป)
do $$ begin
  perform cron.unschedule('google-backup-0700');
exception when others then null;
end $$;
select cron.schedule('google-backup-0700', '0 0 * * 1,4', $$select public.run_google_backup('backup')$$);
