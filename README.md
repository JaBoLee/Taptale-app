# Tap&Tale – ระบบหลังร้าน

เว็บแอป (PWA) สำหรับร้านคราฟต์เบียร์ Tap&Tale: ลงเวลา ตารางกะ สต๊อก เบียร์สด สูตรอาหาร ปิดกะ บัญชี และเงินเดือน

## เทคโนโลยี
React + Vite + TypeScript + Tailwind · Supabase (Postgres, Auth, RLS, Edge Functions) · Netlify

## ตั้งค่าครั้งแรก
1. Supabase: สร้างโปรเจกต์ (Region Singapore) แล้วรันไฟล์ใน `supabase/migrations/` ตามลำดับ
2. สร้างผู้ใช้เจ้าของใน Supabase → Authentication → Add user
   - Email: `<username>@taptale.local` · ติ๊ก Auto Confirm
   - User metadata: `{"role": "owner", "display_name": "บอส"}`
3. Netlify: Import จาก GitHub repo นี้ แล้วตั้ง Environment variables ตาม `.env.example`
4. เปิดเว็บ ล็อกอินด้วย username (ไม่ต้องพิมพ์ @taptale.local)

## พัฒนาในเครื่อง
```
npm install
cp .env.example .env   # ใส่ค่าจริง
npm run dev
```
