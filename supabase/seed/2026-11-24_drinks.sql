-- สูตรเครื่องดื่มกลางวัน จาก Google Sheet "bev ricepe for claude" (24 พ.ย. 2569) · รันหลัง migration 0013 · รันซ้ำได้
begin;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D01', 'drink', 'เอสเพรสโซ่', 'Espresso', 'အက်စ်ပရက်ဆို', 'แก้วร้อน 1 ใบ
ฝาร้อน 1 ใบ
เมล็ดกาแฟ 18 ก.', 'Hot cup 1 pc
Hot lid 1 pc
Coffee beans 18 g', 'ခွက်ပူ 1 ခု
ခွက်ပူ အဖုံး 1 ခု
ကော်ဖီစေ့ 18 ဂရမ်', '1. ลวกแก้วด้วยน้ำร้อนก่อนใช้
2. สกัดกาแฟ 18 ก. ให้ได้น้ำหนัก 36-38 ml', '1. Rinse the cup with hot water first
2. Extract 18 g of coffee to 36–38 ml', '1. ခွက်ကို ရေနွေးဖြင့် ကြိုတင်ဆေးပါ
2. ကော်ဖီ 18 ဂရမ်ကို 36–38 ml ရအောင် ဆွဲထုတ်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a', 1 from public.menus m where m.code = 'D01' and exists (select 1 from public.items where id = 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D02', 'drink', 'อเมริกาโน่ร้อน (166ml)', 'Hot Americano (166 ml)', 'အမေရိကာနို ပူ (166ml)', 'แก้วร้อน 1 ใบ
ฝาร้อน 1 ใบ
น้ำร้อน 130 ก.
เมล็ดกาแฟ 18 ก.', 'Hot cup 1 pc
Hot lid 1 pc
Hot water 130 g
Coffee beans 18 g', 'ခွက်ပူ 1 ခု
ခွက်ပူ အဖုံး 1 ခု
ရေနွေး 130 ဂရမ်
ကော်ဖီစေ့ 18 ဂရမ်', '1. ลวกแก้วด้วยน้ำร้อนก่อนใช้
2. กดน้ำร้อนใส่แก้ว
3. สกัดกาแฟ 18 ก. ให้ได้น้ำหนัก 36-38 ml', '1. Rinse the cup with hot water first
2. Fill the cup with the hot water
3. Extract 18 g of coffee to 36–38 ml', '1. ခွက်ကို ရေနွေးဖြင့် ကြိုတင်ဆေးပါ
2. ရေနွေးကို ခွက်ထဲ ထည့်ပါ
3. ကော်ဖီ 18 ဂရမ်ကို 36–38 ml ရအောင် ဆွဲထုတ်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D02');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a', 1 from public.menus m where m.code = 'D02' and exists (select 1 from public.items where id = 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D03', 'drink', 'ลาเต้ร้อน (196ml)', 'Hot Latte (196 ml)', 'လာတေး ပူ (196ml)', 'แก้วร้อน 1 ใบ
ฝาร้อน 1 ใบ
เมล็ดกาแฟ 18 ก.
นมสด 150 ก.', 'Hot cup 1 pc
Hot lid 1 pc
Coffee beans 18 g
Fresh milk 150 g', 'ခွက်ပူ 1 ခု
ခွက်ပူ အဖုံး 1 ခု
ကော်ဖီစေ့ 18 ဂရမ်
နွားနို့လတ် 150 ဂရမ်', '1. ลวกแก้วด้วยน้ำร้อนก่อนใช้
2. สกัดกาแฟ 18 ก. ให้ได้น้ำหนัก 36-38 ml
3. เทใส่เหยือกเล็ก สตรีมให้ร้อน
4. เทนมร้อนลงบนกาแฟ', '1. Rinse the cup with hot water first
2. Extract 18 g of coffee to 36–38 ml
3. Pour the milk into a small pitcher and steam it hot
4. Pour the hot milk over the coffee', '1. ခွက်ကို ရေနွေးဖြင့် ကြိုတင်ဆေးပါ
2. ကော်ဖီ 18 ဂရမ်ကို 36–38 ml ရအောင် ဆွဲထုတ်ပါ
3. နို့ကို ကရားငယ်ထဲထည့်ပြီး ပူအောင် စတီးမ်လုပ်ပါ
4. နို့ပူကို ကော်ဖီပေါ် လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D03');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a', 1 from public.menus m where m.code = 'D03' and exists (select 1 from public.items where id = 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 150.0 from public.menus m where m.code = 'D03' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D04', 'drink', 'อเมริกาโน่เย็น (166ml)', 'Iced Americano (166 ml)', 'အမေရိကာနို အေး (166ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
น้ำแข็ง 6 ก้อน
น้ำเปล่า 130 ก.
เมล็ดกาแฟ 18 ก.', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Ice 6 cubes
Water 130 g
Coffee beans 18 g', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
ရေခဲ 6 တုံး
ရေ 130 ဂရမ်
ကော်ဖီစေ့ 18 ဂရမ်', '1. คีบน้ำแข็งใส่แก้ว
2. เทน้ำใส่แก้ว
3. สกัดกาแฟ 18 ก. ให้ได้น้ำหนัก 36-38 ml
4. เทช็อตกาแฟลงในแก้ว', '1. Put the ice in the cup
2. Pour the water into the cup
3. Extract 18 g of coffee to 36–38 ml
4. Pour the espresso shot into the cup', '1. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
2. ရေကို ခွက်ထဲ လောင်းထည့်ပါ
3. ကော်ဖီ 18 ဂရမ်ကို 36–38 ml ရအောင် ဆွဲထုတ်ပါ
4. ကော်ဖီ shot ကို ခွက်ထဲ လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D04');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a', 1 from public.menus m where m.code = 'D04' and exists (select 1 from public.items where id = 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D05', 'drink', 'ลาเต้เย็น (186ml)', 'Iced Latte (186 ml)', 'လာတေး အေး (186ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
น้ำแข็ง 6 ก้อน
นมสด 150 ก.
เมล็ดกาแฟ 18 ก.', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Ice 6 cubes
Fresh milk 150 g
Coffee beans 18 g', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
ရေခဲ 6 တုံး
နွားနို့လတ် 150 ဂရမ်
ကော်ဖီစေ့ 18 ဂရမ်', '1. คีบน้ำแข็งใส่แก้ว
2. เทนมใส่แก้ว
3. สกัดกาแฟ 18 ก. ให้ได้น้ำหนัก 36-38 ml
4. เทช็อตกาแฟลงในแก้ว', '1. Put the ice in the cup
2. Pour the milk into the cup
3. Extract 18 g of coffee to 36–38 ml
4. Pour the espresso shot into the cup', '1. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
2. နို့ကို ခွက်ထဲ လောင်းထည့်ပါ
3. ကော်ဖီ 18 ဂရမ်ကို 36–38 ml ရအောင် ဆွဲထုတ်ပါ
4. ကော်ဖီ shot ကို ခွက်ထဲ လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D05');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 150.0 from public.menus m where m.code = 'D05' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a', 1 from public.menus m where m.code = 'D05' and exists (select 1 from public.items where id = 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D06', 'drink', 'เอสเย็น (186ml)', 'Iced Es (sweet iced coffee, 186 ml)', 'အက်စ် အေး (186ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
นมสด 130 (140) ก.
นมมิกส์ 20 (10) ก.
เมล็ดกาแฟ 18 ก.
น้ำแข็ง 6 ก้อน
* ตัวเลขในวงเล็บ = สูตรทางเลือกตามชีตต้นฉบับ', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Fresh milk 130 (140) g
Milk mix 20 (10) g
Coffee beans 18 g
Ice 6 cubes
* Numbers in brackets = alternative amount, as in the original sheet', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
နွားနို့လတ် 130 (140) ဂရမ်
နို့ရောစပ် 20 (10) ဂရမ်
ကော်ဖီစေ့ 18 ဂရမ်
ရေခဲ 6 တုံး
* ကွင်းထဲရှိ နံပါတ် = မူရင်းစာရွက်ပါ အစားထိုးပမာဏ', '1. เทนมสดใส่แก้ว
2. เทนมมิกส์ผสมกับนม
3. สกัดกาแฟ 18 ก. ให้ได้น้ำหนัก 36-38 ml
4. เทช็อตกาแฟลงในแก้ว
5. ใช้ช้อนคนให้เข้ากัน
6. คีบน้ำแข็งใส่ลงแก้ว', '1. Pour the fresh milk into the cup
2. Add the milk mix to the milk
3. Extract 18 g of coffee to 36–38 ml
4. Pour the espresso shot into the cup
5. Stir well with a spoon
6. Add the ice to the cup', '1. နွားနို့လတ်ကို ခွက်ထဲ လောင်းထည့်ပါ
2. နို့ရောစပ်ကို နို့ထဲ ထည့်ပါ
3. ကော်ဖီ 18 ဂရမ်ကို 36–38 ml ရအောင် ဆွဲထုတ်ပါ
4. ကော်ဖီ shot ကို ခွက်ထဲ လောင်းထည့်ပါ
5. ဇွန်းဖြင့် ကောင်းစွာ မွှေပါ
6. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D06');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 130.0 from public.menus m where m.code = 'D06' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '17008100-1a81-4b90-b88d-86d5f2a688f9', 20.0 from public.menus m where m.code = 'D06' and exists (select 1 from public.items where id = '17008100-1a81-4b90-b88d-86d5f2a688f9') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a', 1 from public.menus m where m.code = 'D06' and exists (select 1 from public.items where id = 'b44c2bdf-e3c9-4fcc-9655-2fc985d6bb3a') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D07', 'drink', 'โกโก้ร้อน (190g)', 'Hot Cocoa (190 g)', 'ကိုကိုး ပူ (190g)', 'แก้วร้อน 1 ใบ
ฝาร้อน 1 ใบ
ซอสโกโก้ 45 ก.
ซิมเปิ้ลไซรัป 5 (0) ก.
นมสด 140 ก.
* ตัวเลขในวงเล็บ = สูตรทางเลือกตามชีตต้นฉบับ', 'Hot cup 1 pc
Hot lid 1 pc
Cocoa sauce 45 g
Simple syrup 5 (0) g
Fresh milk 140 g
* Numbers in brackets = alternative amount, as in the original sheet', 'ခွက်ပူ 1 ခု
ခွက်ပူ အဖုံး 1 ခု
ကိုကိုးဆော့စ် 45 ဂရမ်
သကြားရည် 5 (0) ဂရမ်
နွားနို့လတ် 140 ဂရမ်
* ကွင်းထဲရှိ နံပါတ် = မူရင်းစာရွက်ပါ အစားထိုးပမာဏ', '1. ลวกแก้วด้วยน้ำร้อนก่อนใช้
2. เทซอสโกโก้ใส่แก้ว
3. เทไซรัปลงไป
4. เทใส่เหยือกเล็ก สตรีมให้ร้อน
5. เทนมร้อนลงบนซอสโกโก้', '1. Rinse the cup with hot water first
2. Pour the cocoa sauce into the cup
3. Add the syrup
4. Pour the milk into a small pitcher and steam it hot
5. Pour the hot milk over the cocoa sauce', '1. ခွက်ကို ရေနွေးဖြင့် ကြိုတင်ဆေးပါ
2. ကိုကိုးဆော့စ်ကို ခွက်ထဲ ထည့်ပါ
3. သကြားရည် ထည့်ပါ
4. နို့ကို ကရားငယ်ထဲထည့်ပြီး ပူအောင် စတီးမ်လုပ်ပါ
5. နို့ပူကို ကိုကိုးဆော့စ်ပေါ် လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D07');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'dbb72b23-d9a6-4a09-b1e4-6b32cb3b4319', 45.0 from public.menus m where m.code = 'D07' and exists (select 1 from public.items where id = 'dbb72b23-d9a6-4a09-b1e4-6b32cb3b4319') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b030fb6a-5609-4bde-b7be-e65931e7bc16', 5.0 from public.menus m where m.code = 'D07' and exists (select 1 from public.items where id = 'b030fb6a-5609-4bde-b7be-e65931e7bc16') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 140.0 from public.menus m where m.code = 'D07' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D08', 'drink', 'เคลียร์มัทฉะร้อน (163g)', 'Hot Clear Matcha (163 g)', 'မတ်ချာ ကြည် ပူ (163g)', 'แก้วร้อน 1 ใบ
ฝาร้อน 1 ใบ
น้ำร้อน 130 ก.
ผงมัทฉะ 3 ก.
น้ำร้อน 30 ก.', 'Hot cup 1 pc
Hot lid 1 pc
Hot water 130 g
Matcha powder 3 g
Hot water 30 g', 'ခွက်ပူ 1 ခု
ခွက်ပူ အဖုံး 1 ခု
ရေနွေး 130 ဂရမ်
မတ်ချာမှုန့် 3 ဂရမ်
ရေနွေး 30 ဂရမ်', '1. ลวกแก้วด้วยน้ำร้อนก่อนใช้
2. เทน้ำร้อนลงในแก้ว
3. ร่อนผงมัทฉะลงในถ้วยตี
4. เทน้ำร้อนลงในถ้วยตี
5. ตีผงมัทฉะให้แตกและเข้ากัน
6. เทมัทฉะลงในแก้ว', '1. Rinse the cup with hot water first
2. Pour the hot water into the cup
3. Sift the matcha powder into the whisking bowl
4. Pour the hot water into the whisking bowl
5. Whisk until the matcha has no lumps
6. Pour the matcha into the cup', '1. ခွက်ကို ရေနွေးဖြင့် ကြိုတင်ဆေးပါ
2. ရေနွေးကို ခွက်ထဲ လောင်းထည့်ပါ
3. မတ်ချာမှုန့်ကို ခေါက်ရိုက်ပန်းကန်ထဲ ဆန်ခါဖြင့် ချပါ
4. ရေနွေးကို ခေါက်ရိုက်ပန်းကန်ထဲ လောင်းထည့်ပါ
5. မတ်ချာ အခဲမရှိအောင် ခေါက်ရိုက်ပါ
6. မတ်ချာကို ခွက်ထဲ လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D08');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'f284ce6e-2d16-4b65-b40b-b322d376f1f7', 3.0 from public.menus m where m.code = 'D08' and exists (select 1 from public.items where id = 'f284ce6e-2d16-4b65-b40b-b322d376f1f7') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D09', 'drink', 'มัทฉะลาเต้ร้อน (164g)', 'Hot Matcha Latte (164 g)', 'မတ်ချာ လာတေး ပူ (164g)', 'แก้วร้อน 1 ใบ
ฝาร้อน 1 ใบ
ผงมัทฉะ 4 ก.
น้ำร้อน 30 ก.
นมสด 130 ก.', 'Hot cup 1 pc
Hot lid 1 pc
Matcha powder 4 g
Hot water 30 g
Fresh milk 130 g', 'ခွက်ပူ 1 ခု
ခွက်ပူ အဖုံး 1 ခု
မတ်ချာမှုန့် 4 ဂရမ်
ရေနွေး 30 ဂရမ်
နွားနို့လတ် 130 ဂရမ်', '1. ลวกแก้วด้วยน้ำร้อนก่อนใช้
2. ร่อนผงมัทฉะลงในถ้วยตี
3. เทน้ำร้อนลงในถ้วยตี
4. ตีผงมัทฉะให้แตกและเข้ากัน
5. เทมัทฉะลงในแก้ว
6. เทใส่เหยือกเล็ก สตรีมให้ร้อน
7. เทนมร้อนลงบนมัทฉะ', '1. Rinse the cup with hot water first
2. Sift the matcha powder into the whisking bowl
3. Pour the hot water into the whisking bowl
4. Whisk until the matcha has no lumps
5. Pour the matcha into the cup
6. Pour the milk into a small pitcher and steam it hot
7. Pour the hot milk over the matcha', '1. ခွက်ကို ရေနွေးဖြင့် ကြိုတင်ဆေးပါ
2. မတ်ချာမှုန့်ကို ခေါက်ရိုက်ပန်းကန်ထဲ ဆန်ခါဖြင့် ချပါ
3. ရေနွေးကို ခေါက်ရိုက်ပန်းကန်ထဲ လောင်းထည့်ပါ
4. မတ်ချာ အခဲမရှိအောင် ခေါက်ရိုက်ပါ
5. မတ်ချာကို ခွက်ထဲ လောင်းထည့်ပါ
6. နို့ကို ကရားငယ်ထဲထည့်ပြီး ပူအောင် စတီးမ်လုပ်ပါ
7. နို့ပူကို မတ်ချာပေါ် လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D09');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'f284ce6e-2d16-4b65-b40b-b322d376f1f7', 4.0 from public.menus m where m.code = 'D09' and exists (select 1 from public.items where id = 'f284ce6e-2d16-4b65-b40b-b322d376f1f7') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 130.0 from public.menus m where m.code = 'D09' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D10', 'drink', 'โกโก้เย็น (180g)', 'Iced Cocoa (180 g)', 'ကိုကိုး အေး (180g)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
ซอสโกโก้ 45 ก.
นมมิกส์ 30 ก.
ซิมเปิ้ลไซรัป 5 (0) ก.
นมสด 100 ก.
น้ำแข็ง 5 ก้อน
โฟมนม 3 ช้อน
ผงโกโก้ 2 เขย่า
* ตัวเลขในวงเล็บ = สูตรทางเลือกตามชีตต้นฉบับ', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Cocoa sauce 45 g
Milk mix 30 g
Simple syrup 5 (0) g
Fresh milk 100 g
Ice 5 cubes
Milk foam 3 spoons
Cocoa powder 2 shakes
* Numbers in brackets = alternative amount, as in the original sheet', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
ကိုကိုးဆော့စ် 45 ဂရမ်
နို့ရောစပ် 30 ဂရမ်
သကြားရည် 5 (0) ဂရမ်
နွားနို့လတ် 100 ဂရမ်
ရေခဲ 5 တုံး
နို့အမြှုပ် 3 ဇွန်း
ကိုကိုးမှုန့် 2 ကြိမ်ဖြူး
* ကွင်းထဲရှိ နံပါတ် = မူရင်းစာရွက်ပါ အစားထိုးပမာဏ', '1. เทซอสโกโก้ใส่แก้ว
2. เทนมมิกส์ลงไป
3. เทไซรัปลงไป
4. เทนมสดลงไป
5. ใช้ช้อนคนให้เข้ากัน
6. คีบน้ำแข็งใส่ลงแก้ว
7. ท็อปด้านบน
8. โรยบนโฟม', '1. Pour the cocoa sauce into the cup
2. Add the milk mix
3. Add the syrup
4. Add the fresh milk
5. Stir well with a spoon
6. Add the ice to the cup
7. Top with the milk foam
8. Dust the cocoa powder over the foam', '1. ကိုကိုးဆော့စ်ကို ခွက်ထဲ ထည့်ပါ
2. နို့ရောစပ် ထည့်ပါ
3. သကြားရည် ထည့်ပါ
4. နွားနို့လတ် ထည့်ပါ
5. ဇွန်းဖြင့် ကောင်းစွာ မွှေပါ
6. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
7. အပေါ်မှ နို့အမြှုပ် တင်ပါ
8. ကိုကိုးမှုန့်ကို အမြှုပ်ပေါ် ဖြူးပါ', 1, true
where not exists (select 1 from public.menus where code = 'D10');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'dbb72b23-d9a6-4a09-b1e4-6b32cb3b4319', 45.0 from public.menus m where m.code = 'D10' and exists (select 1 from public.items where id = 'dbb72b23-d9a6-4a09-b1e4-6b32cb3b4319') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '17008100-1a81-4b90-b88d-86d5f2a688f9', 30.0 from public.menus m where m.code = 'D10' and exists (select 1 from public.items where id = '17008100-1a81-4b90-b88d-86d5f2a688f9') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'b030fb6a-5609-4bde-b7be-e65931e7bc16', 5.0 from public.menus m where m.code = 'D10' and exists (select 1 from public.items where id = 'b030fb6a-5609-4bde-b7be-e65931e7bc16') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 100.0 from public.menus m where m.code = 'D10' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D11', 'drink', 'เคลียร์มัทฉะเย็น (173ml)', 'Iced Clear Matcha (173 ml)', 'မတ်ချာ ကြည် အေး (173ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
น้ำแข็ง 6 ก้อน
น้ำเปล่า 130 ก.
ผงมัทฉะ 3.5 ก.
น้ำร้อน 40 ก.', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Ice 6 cubes
Water 130 g
Matcha powder 3.5 g
Hot water 40 g', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
ရေခဲ 6 တုံး
ရေ 130 ဂရမ်
မတ်ချာမှုန့် 3.5 ဂရမ်
ရေနွေး 40 ဂရမ်', '1. คีบน้ำแข็งใส่แก้ว
2. เทน้ำใส่แก้ว
3. ร่อนผงมัทฉะลงในถ้วยตี
4. เทน้ำร้อนลงในถ้วยตี
5. ตีผงมัทฉะให้แตกและเข้ากัน
6. เทมัทฉะลงในแก้ว', '1. Put the ice in the cup
2. Pour the water into the cup
3. Sift the matcha powder into the whisking bowl
4. Pour the hot water into the whisking bowl
5. Whisk until the matcha has no lumps
6. Pour the matcha into the cup', '1. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
2. ရေကို ခွက်ထဲ လောင်းထည့်ပါ
3. မတ်ချာမှုန့်ကို ခေါက်ရိုက်ပန်းကန်ထဲ ဆန်ခါဖြင့် ချပါ
4. ရေနွေးကို ခေါက်ရိုက်ပန်းကန်ထဲ လောင်းထည့်ပါ
5. မတ်ချာ အခဲမရှိအောင် ခေါက်ရိုက်ပါ
6. မတ်ချာကို ခွက်ထဲ လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D11');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'f284ce6e-2d16-4b65-b40b-b322d376f1f7', 3.5 from public.menus m where m.code = 'D11' and exists (select 1 from public.items where id = 'f284ce6e-2d16-4b65-b40b-b322d376f1f7') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D12', 'drink', 'มัทฉะลาเต้เย็น (174ml)', 'Iced Matcha Latte (174 ml)', 'မတ်ချာ လာတေး အေး (174ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
น้ำแข็ง 6 ก้อน
นมสด 130 ก.
ผงมัทฉะ 4.5 ก.
น้ำร้อน 40 ก.', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Ice 6 cubes
Fresh milk 130 g
Matcha powder 4.5 g
Hot water 40 g', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
ရေခဲ 6 တုံး
နွားနို့လတ် 130 ဂရမ်
မတ်ချာမှုန့် 4.5 ဂရမ်
ရေနွေး 40 ဂရမ်', '1. คีบน้ำแข็งใส่แก้ว
2. เทนมใส่แก้ว
3. ร่อนผงมัทฉะลงในถ้วยตี
4. เทน้ำร้อนลงในถ้วยตี
5. ตีผงมัทฉะให้แตกและเข้ากัน
6. เทมัทฉะลงในแก้ว', '1. Put the ice in the cup
2. Pour the milk into the cup
3. Sift the matcha powder into the whisking bowl
4. Pour the hot water into the whisking bowl
5. Whisk until the matcha has no lumps
6. Pour the matcha into the cup', '1. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
2. နို့ကို ခွက်ထဲ လောင်းထည့်ပါ
3. မတ်ချာမှုန့်ကို ခေါက်ရိုက်ပန်းကန်ထဲ ဆန်ခါဖြင့် ချပါ
4. ရေနွေးကို ခေါက်ရိုက်ပန်းကန်ထဲ လောင်းထည့်ပါ
5. မတ်ချာ အခဲမရှိအောင် ခေါက်ရိုက်ပါ
6. မတ်ချာကို ခွက်ထဲ လောင်းထည့်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D12');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 130.0 from public.menus m where m.code = 'D12' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'f284ce6e-2d16-4b65-b40b-b322d376f1f7', 4.5 from public.menus m where m.code = 'D12' and exists (select 1 from public.items where id = 'f284ce6e-2d16-4b65-b40b-b322d376f1f7') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D13', 'drink', 'ชาไทยเย็น (180ml)', 'Iced Thai Tea (180 ml)', 'ထိုင်းလက်ဖက်ရည် အေး (180ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
เบสชา 80 ก.
นมสด 60 (75) ก.
นมมิกส์ 40 (25) ก.
น้ำแข็ง 5 ก้อน
โฟมนม 3 ช้อน
* ตัวเลขในวงเล็บ = สูตรทางเลือกตามชีตต้นฉบับ', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Thai tea base 80 g
Fresh milk 60 (75) g
Milk mix 40 (25) g
Ice 5 cubes
Milk foam 3 spoons
* Numbers in brackets = alternative amount, as in the original sheet', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
ထိုင်းလက်ဖက်ရည် အခြေခံ 80 ဂရမ်
နွားနို့လတ် 60 (75) ဂရမ်
နို့ရောစပ် 40 (25) ဂရမ်
ရေခဲ 5 တုံး
နို့အမြှုပ် 3 ဇွန်း
* ကွင်းထဲရှိ နံပါတ် = မူရင်းစာရွက်ပါ အစားထိုးပမာဏ', '1. เทเบสชาใส่แก้ว
2. เทนมสดลงไป
3. เทนมมิกส์ลงไป
4. ใช้ช้อนคนให้เข้ากัน
5. คีบน้ำแข็งใส่ลงแก้ว
6. ท็อปด้านบน', '1. Pour the tea base into the cup
2. Add the fresh milk
3. Add the milk mix
4. Stir well with a spoon
5. Add the ice to the cup
6. Top with the milk foam', '1. လက်ဖက်ရည် အခြေခံကို ခွက်ထဲ လောင်းထည့်ပါ
2. နွားနို့လတ် ထည့်ပါ
3. နို့ရောစပ် ထည့်ပါ
4. ဇွန်းဖြင့် ကောင်းစွာ မွှေပါ
5. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
6. အပေါ်မှ နို့အမြှုပ် တင်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D13');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '845e74e4-93cd-4b82-8746-57d7d5ef8e03', 80.0 from public.menus m where m.code = 'D13' and exists (select 1 from public.items where id = '845e74e4-93cd-4b82-8746-57d7d5ef8e03') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 60.0 from public.menus m where m.code = 'D13' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '17008100-1a81-4b90-b88d-86d5f2a688f9', 40.0 from public.menus m where m.code = 'D13' and exists (select 1 from public.items where id = '17008100-1a81-4b90-b88d-86d5f2a688f9') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, name_my, ingredients_th, ingredients_en, ingredients_my, steps_th, steps_en, steps_my, min_portions, active)
select 'D14', 'drink', 'นมชมพูเย็น (180ml)', 'Iced Pink Milk (180 ml)', 'နို့ပန်းရောင် အေး (180ml)', 'แก้วเย็น 1 ใบ
ฝาเย็น 1 ใบ
หลอด 1 อัน
นมสด 130 (140) ก.
นมมิกส์ 20 (10) ก.
น้ำแดง 30 ก.
น้ำแข็ง 5 ก้อน
โฟมนม 3 ช้อน
* ตัวเลขในวงเล็บ = สูตรทางเลือกตามชีตต้นฉบับ', 'Cold cup 1 pc
Cold lid 1 pc
Straw 1 pc
Fresh milk 130 (140) g
Milk mix 20 (10) g
Red syrup 30 g
Ice 5 cubes
Milk foam 3 spoons
* Numbers in brackets = alternative amount, as in the original sheet', 'ခွက်အေး 1 ခု
ခွက်အေး အဖုံး 1 ခု
ပိုက် 1 ခု
နွားနို့လတ် 130 (140) ဂရမ်
နို့ရောစပ် 20 (10) ဂရမ်
အနီရောင် သကြားရည် 30 ဂရမ်
ရေခဲ 5 တုံး
နို့အမြှုပ် 3 ဇွန်း
* ကွင်းထဲရှိ နံပါတ် = မူရင်းစာရွက်ပါ အစားထိုးပမာဏ', '1. เทนมสดลงใส่แก้ว
2. เทนมมิกส์ลงไป
3. เทน้ำแดงลงไป
4. ใช้ช้อนคนให้เข้ากัน
5. คีบน้ำแข็งใส่ลงแก้ว
6. ท็อปด้านบน', '1. Pour the fresh milk into the cup
2. Add the milk mix
3. Add the red syrup
4. Stir well with a spoon
5. Add the ice to the cup
6. Top with the milk foam', '1. နွားနို့လတ်ကို ခွက်ထဲ လောင်းထည့်ပါ
2. နို့ရောစပ် ထည့်ပါ
3. အနီရောင် သကြားရည် ထည့်ပါ
4. ဇွန်းဖြင့် ကောင်းစွာ မွှေပါ
5. ရေခဲကို ခွက်ထဲ ညှပ်ထည့်ပါ
6. အပေါ်မှ နို့အမြှုပ် တင်ပါ', 1, true
where not exists (select 1 from public.menus where code = 'D14');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'e66800bb-7367-4612-9f77-89d563069017', 130.0 from public.menus m where m.code = 'D14' and exists (select 1 from public.items where id = 'e66800bb-7367-4612-9f77-89d563069017') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '17008100-1a81-4b90-b88d-86d5f2a688f9', 20.0 from public.menus m where m.code = 'D14' and exists (select 1 from public.items where id = '17008100-1a81-4b90-b88d-86d5f2a688f9') on conflict do nothing;
commit;
