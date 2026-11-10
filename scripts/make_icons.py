"""สร้างไอคอนแอปทุกขนาดจากโลโก้ร้าน
ใช้: python3 scripts/make_icons.py path/to/logo.png [สีพื้นหลัง เช่น #FFFFFF]
ได้: public/icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png, favicon-32.png
"""
import sys
from PIL import Image

src = sys.argv[1]
bg = sys.argv[2] if len(sys.argv) > 2 else '#FFFFFF'
logo = Image.open(src).convert('RGBA')

def square(size, pad):
    canvas = Image.new('RGBA', (size, size), bg)
    inner = int(size * (1 - 2 * pad))
    l = logo.copy()
    l.thumbnail((inner, inner), Image.LANCZOS)
    canvas.alpha_composite(l, ((size - l.width) // 2, (size - l.height) // 2))
    return canvas

square(192, 0.08).save('public/icon-192.png')
square(512, 0.08).save('public/icon-512.png')
square(512, 0.2).save('public/icon-maskable-512.png')      # เผื่อขอบสำหรับ Android ที่ตัดเป็นวงกลม
square(180, 0.1).convert('RGB').save('public/apple-touch-icon.png')
square(32, 0.04).save('public/favicon-32.png')
print('icons written')
