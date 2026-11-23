// ประเภทการหยุดงานของพนักงาน
export const LEAVE_TYPES = ['sick', 'personal', 'holiday', 'annual', 'unpaid'] as const
export type LeaveType = typeof LEAVE_TYPES[number]

/** พักร้อนต่อปี เมื่ออายุงานครบ 1 ปี */
export const ANNUAL_DAYS = 6

export interface Holiday { id: string; holiday_date: string; name: string }
export interface StaffPay { profile_id: string; monthly_salary: number; ot_rate: number; start_date: string | null }

/** อายุงานครบ 1 ปีหรือยัง (นับจากวันเริ่มงาน) */
export function annualEligible(start: string | null | undefined, today: string): boolean {
  if (!start) return false
  const [y, m, d] = start.split('-').map(Number)
  const anniv = `${y + 1}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  return today >= anniv
}

/** วันหยุดที่ใช้ชดเชยได้: ผ่านวันนั้นมาแล้ว และยังไม่ได้ใช้ (คำขอที่ไม่ถูกปฏิเสธ) */
export function usableHolidays(holidays: Holiday[], usedIds: (string | null | undefined)[], today: string): Holiday[] {
  const used = new Set(usedIds.filter(Boolean))
  return holidays.filter((h) => h.holiday_date < today && !used.has(h.id))
}
