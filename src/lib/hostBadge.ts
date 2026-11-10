// ป้าย "Powered by Netlify" (แผนฟรี) ลอยอยู่มุมล่างขวาและซ่อนไม่ได้
// เราไม่ซ่อนป้าย แต่วัดความสูงแล้วตั้งค่า --badge-h ให้แถบเมนูล่างยกขึ้นเหนือป้าย
// ถ้าย้ายโฮสต์หรืออัปเกรดแผนจนป้ายหายไป ค่าจะกลับเป็น 0 เอง
export function watchHostBadge() {
  const root = document.documentElement
  const update = () => {
    const el = document.getElementById('nl-badge-frame')
    const h = el && el.getBoundingClientRect().height > 0 ? Math.ceil(el.getBoundingClientRect().height) : 0
    root.style.setProperty('--badge-h', `${h}px`)
  }
  update()
  new MutationObserver(update).observe(document.body, { childList: true, subtree: false, attributes: false })
  window.addEventListener('resize', update)
}
