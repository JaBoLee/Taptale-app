-- สูตรเมนูจากไฟล์ "MENU NAME.pdf" (24 พ.ย. 2569) · รันหลัง migration 0012 · รันซ้ำได้ (ข้ามเมนูที่มีรหัสนี้แล้ว)
begin;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'R01', 'prep', 'ข้าวสวย', 'Steamed Rice', 'ข้าวหอมมะลิ 1,000 ก. (1 กก.)
น้ำสะอาด 1,100–1,200 มล.', 'Jasmine rice 1,000 g (1 kg)
Clean water 1,100–1,200 ml', '1. ซาวข้าวหอมมะลิ 1 กก. ด้วยน้ำสะอาดเร็ว ๆ 1–2 ครั้ง แล้วเทน้ำออกให้แห้ง (ไม่ต้องนวดหรือขยี้แรง เพื่อคงความหอมและคุณค่าทางอาหาร)
2. เติมน้ำสะอาด 1,100–1,200 มล. ลงในหม้อหุงข้าว
3. กดสวิตช์หุงข้าวตามปกติ
4. เมื่อสุกแล้ว ปิดฝาอบทิ้งไว้อีก 10–15 นาที แล้วใช้ทัพพีซุยข้าวให้ร่วน พร้อมเสิร์ฟ', '1. Wash 1 kg of jasmine rice quickly 1–2 times and drain completely (do not scrub hard, to keep aroma and nutrients).
2. Add 1,100–1,200 ml of clean water to the rice cooker pot.
3. Turn on the rice cooker.
4. Once cooked, keep the lid closed and let it steam 10–15 more minutes, then fluff and serve.', 1, true
where not exists (select 1 from public.menus where code = 'R01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '2738a115-74e1-4a9d-ae34-3d571be380ab', 0.2 from public.menus m where m.code = 'R01' and exists (select 1 from public.items where id = '2738a115-74e1-4a9d-ae34-3d571be380ab') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'R02', 'prep', 'ข้าวมัน (สำหรับไก่)', 'Chicken Rice (for chicken dishes)', 'ข้าวสาร 1,000 ก.
กระเทียม 110 ก.
ขิง 120 ก.
น้ำมันไก่ (เจียวกระเทียม) 90 ก.
น้ำมันไก่ (ใส่ตอนหุง) 15 ก.
น้ำสต๊อกไก่ (ST01) 1,250 ก.
เกลือ 4 ก.
น้ำตาล 80 ก.', 'Uncooked rice 1,000 g
Garlic 110 g
Ginger 120 g
Chicken oil (for sautéing garlic) 90 g
Chicken oil (for cooking) 15 g
Chicken stock (ST01) 1,250 g
Salt 4 g
Sugar 80 g', '1. เตรียมวัตถุดิบทุกอย่างให้พร้อมตรงหน้า
2. ซาวข้าว 1 น้ำ: เปิดน้ำให้ล้นข้าว คนข้าวกับน้ำเร็ว ๆ แล้วเทพักให้สะเด็ดน้ำบนตะแกรง
3. เทน้ำสต๊อกจากเหยือกที่เตรียมไว้ลงในหม้อหุงข้าว
4. ตั้งกระทะ ใส่น้ำมันไก่ 90 ก.
5. ผัดกระเทียมด้วยไฟกลาง คนตลอดเวลาจนเหลืองทองสวย
6. ใส่ขิงและน้ำมันไก่อีก 15 ก. ผัดเร็ว ๆ ใน 10 วินาทีสุดท้าย
7. ปิดไฟ ใส่กระเทียม ขิง เกลือ และน้ำตาลลงในหม้อหุงข้าว คนกับน้ำสต๊อกประมาณ 20 วินาทีให้กลิ่นหอมกระจาย
8. เทข้าวสารที่สะเด็ดน้ำแล้วลงหม้อ แล้วกดหุงตามปกติ', '1. Prepare all ingredients in front of you.
2. Rinse the rice once: run water over it until it overflows, stir quickly, then drain completely on a strainer.
3. Pour the prepared stock from the pitcher into the rice cooker pot.
4. Heat a pan and add 90 g of chicken oil.
5. Sauté the garlic over medium heat, stirring continuously, until golden brown.
6. In the last 10 seconds, add the ginger and another 15 g of chicken oil and stir briefly.
7. Turn off the heat. Put the garlic, ginger, salt and sugar into the rice cooker pot and stir into the stock for about 20 seconds.
8. Add the drained rice and press cook.', 1, true
where not exists (select 1 from public.menus where code = 'R02');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '2738a115-74e1-4a9d-ae34-3d571be380ab', 0.2 from public.menus m where m.code = 'R02' and exists (select 1 from public.items where id = '2738a115-74e1-4a9d-ae34-3d571be380ab') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '31bb699a-1545-41f4-91fd-db79eeee15d3', 0.11 from public.menus m where m.code = 'R02' and exists (select 1 from public.items where id = '31bb699a-1545-41f4-91fd-db79eeee15d3') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'a29e2fed-7bdd-43af-9eef-b79eb46c4f97', 120 from public.menus m where m.code = 'R02' and exists (select 1 from public.items where id = 'a29e2fed-7bdd-43af-9eef-b79eb46c4f97') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '15ad9ebf-8b14-4b0a-9bd9-2e135b0630ae', 105 from public.menus m where m.code = 'R02' and exists (select 1 from public.items where id = '15ad9ebf-8b14-4b0a-9bd9-2e135b0630ae') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'cc189689-864c-408f-9df7-4f055a05a5d6', 0.004 from public.menus m where m.code = 'R02' and exists (select 1 from public.items where id = 'cc189689-864c-408f-9df7-4f055a05a5d6') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '4b999772-4fed-4cc8-b50b-d94744029e42', 0.08 from public.menus m where m.code = 'R02' and exists (select 1 from public.items where id = '4b999772-4fed-4cc8-b50b-d94744029e42') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'R03', 'prep', 'ข้าวมัน (สำหรับเนื้อ)', 'Beef Tallow Rice (for beef dishes)', 'ข้าวสาร 1,000 ก.
กระเทียม 110 ก.
ขิง 120 ก.
น้ำมันวัว (เจียวกระเทียม) 90 ก.
น้ำมันวัว (ใส่ตอนหุง) 15 ก.
น้ำสต๊อกเนื้อ 800 ก.
น้ำสะอาด 400 ก.
เกลือ 4 ก.
น้ำตาล 80 ก.', 'Uncooked rice 1,000 g
Garlic 110 g
Ginger 120 g
Beef tallow (for sautéing garlic) 90 g
Beef tallow (for cooking) 15 g
Beef stock 800 g
Clean water 400 g
Salt 4 g
Sugar 80 g', '1. เตรียมวัตถุดิบทุกอย่างให้พร้อมตรงหน้า
2. ซาวข้าว 1 น้ำ: เปิดน้ำให้ล้นข้าว คนข้าวกับน้ำเร็ว ๆ แล้วเทพักให้สะเด็ดน้ำบนตะแกรง
3. เทน้ำสต๊อกเนื้อจากเหยือกที่เตรียมไว้ลงในหม้อหุงข้าว
4. ตั้งกระทะ ใส่น้ำมันวัว 90 ก.
5. ผัดกระเทียมกับน้ำมันวัวด้วยไฟกลาง คนตลอดเวลาจนเหลืองทองสวย
6. ใส่ขิงและน้ำมันวัวอีก 15 ก. ผัดเร็ว ๆ ใน 10 วินาทีสุดท้าย
7. ปิดไฟ ใส่กระเทียม ขิง เกลือ และน้ำตาลลงในหม้อหุงข้าว คนกับน้ำสต๊อกเนื้อประมาณ 20 วินาที
8. เทข้าวสารที่สะเด็ดน้ำแล้วลงหม้อ แล้วกดหุงตามปกติ', '1. Prepare all ingredients in front of you.
2. Rinse the rice once and drain completely on a strainer.
3. Pour the prepared beef stock into the rice cooker pot.
4. Heat a pan and add 90 g of beef tallow.
5. Sauté the garlic in the tallow over medium heat, stirring, until golden brown.
6. In the last 10 seconds, add the ginger and another 15 g of tallow and stir briefly.
7. Turn off the heat. Put the garlic, ginger, salt and sugar into the pot and stir into the stock for about 20 seconds.
8. Add the drained rice and press cook.', 1, true
where not exists (select 1 from public.menus where code = 'R03');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '2738a115-74e1-4a9d-ae34-3d571be380ab', 0.2 from public.menus m where m.code = 'R03' and exists (select 1 from public.items where id = '2738a115-74e1-4a9d-ae34-3d571be380ab') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '31bb699a-1545-41f4-91fd-db79eeee15d3', 0.11 from public.menus m where m.code = 'R03' and exists (select 1 from public.items where id = '31bb699a-1545-41f4-91fd-db79eeee15d3') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'a29e2fed-7bdd-43af-9eef-b79eb46c4f97', 120 from public.menus m where m.code = 'R03' and exists (select 1 from public.items where id = 'a29e2fed-7bdd-43af-9eef-b79eb46c4f97') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'fa20619c-0da9-42de-a26e-5b24932d0bf4', 105 from public.menus m where m.code = 'R03' and exists (select 1 from public.items where id = 'fa20619c-0da9-42de-a26e-5b24932d0bf4') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'cc189689-864c-408f-9df7-4f055a05a5d6', 0.004 from public.menus m where m.code = 'R03' and exists (select 1 from public.items where id = 'cc189689-864c-408f-9df7-4f055a05a5d6') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '4b999772-4fed-4cc8-b50b-d94744029e42', 0.08 from public.menus m where m.code = 'R03' and exists (select 1 from public.items where id = '4b999772-4fed-4cc8-b50b-d94744029e42') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'C01', 'prep', 'ไก่ต้ม', 'Boiled Chicken', 'สะโพกไก่ 2,000 ก.
น้ำเปล่า 2,000 ก.
เกลือ 80 ก.
เบกกิ้งโซดา 20 ก.
น้ำตาลทราย 30 ก.', 'Chicken thigh 2,000 g
Water 2,000 g
Salt 80 g
Baking soda 20 g
Sugar 30 g', 'ล้าง
1. ล้างน้ำเปล่า 3 น้ำ
2. ล้างน้ำเกลือ 1 น้ำ
3. ล้างน้ำเปล่า 1 น้ำ
หมัก
4. ผสมน้ำ เกลือ เบกกิ้งโซดา น้ำตาลทราย คนจนละลาย
5. ใส่ไก่ในถุงแช่น้ำเกลือ 2 ชั่วโมง
6. เทน้ำเกลือออก แช่ไก่ในตู้เย็น
ต้ม
7. ต้มน้ำให้ได้ 85 องศา
8. ใส่ไก่ลงหม้อ รักษาความร้อนที่ 85 องศา จับเวลา 25–30 นาที
9. เมื่อไก่ลอยขึ้น วัดอุณหภูมิเนื้อใกล้กระดูก ถ้าถึง 78–80 องศา ให้นำไก่ขึ้น
10. น็อกไก่ในน้ำเย็น 5 นาที แล้วนำขึ้นพักไว้', 'Cleaning
1. Wash the chicken with clean water 3 times.
2. Wash with salt water once.
3. Rinse with clean water once.
Marinating
4. Mix water, salt, baking soda and sugar until dissolved.
5. Soak the chicken in the brine in a bag for 2 hours.
6. Drain the brine and chill the chicken in the fridge.
Cooking
7. Heat water to 85°C.
8. Add the chicken, keep it at 85°C and time 25–30 minutes.
9. When the chicken floats, check the temperature near the bone; remove at 78–80°C.
10. Shock in cold water for 5 minutes, then remove and rest.', 1, true
where not exists (select 1 from public.menus where code = 'C01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '17c08134-cc79-45f8-8e10-743e4ede44fb', 1 from public.menus m where m.code = 'C01' and exists (select 1 from public.items where id = '17c08134-cc79-45f8-8e10-743e4ede44fb') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'cc189689-864c-408f-9df7-4f055a05a5d6', 0.08 from public.menus m where m.code = 'C01' and exists (select 1 from public.items where id = 'cc189689-864c-408f-9df7-4f055a05a5d6') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '10b52e9f-414f-4149-ae55-6f2431f1c545', 0.067 from public.menus m where m.code = 'C01' and exists (select 1 from public.items where id = '10b52e9f-414f-4149-ae55-6f2431f1c545') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '4b999772-4fed-4cc8-b50b-d94744029e42', 0.03 from public.menus m where m.code = 'C01' and exists (select 1 from public.items where id = '4b999772-4fed-4cc8-b50b-d94744029e42') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'ST01', 'prep', 'สต๊อกไก่', 'Chicken Stock', '(สำหรับข้าว 1,000 ก.)
น้ำเปล่า (สำหรับต้ม) ตามต้องการ
ผงปรุงรสไก่ ตราฟ้าไทย 1 ซอง', '(for a 1,000 g rice batch)
Clean water (for boiling) as needed
Fa Thai chicken seasoning powder 1 packet', '1. เทน้ำเปล่าลงหม้อ ตั้งไฟให้เดือด
2. ใส่ผงปรุงรสไก่ตราฟ้าไทย 1 ซอง คนให้ละลาย
3. ใช้น้ำซุปนี้สำหรับต้มไก่ตามต้องการ', '1. Pour clean water into the pot and bring to a boil.
2. Add 1 packet of Fa Thai chicken seasoning powder and stir until dissolved.
3. Use the broth to boil chicken as needed.', 1, true
where not exists (select 1 from public.menus where code = 'ST01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '3809f6a6-6005-402d-9f0d-510d65756389', 1 from public.menus m where m.code = 'ST01' and exists (select 1 from public.items where id = '3809f6a6-6005-402d-9f0d-510d65756389') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'S01', 'prep', 'น้ำจิ้มข้าวมันไก่', 'Chicken Rice Sauce', 'เต้าเจี้ยว 150 ก.
น้ำตาลปี๊บ 108 ก.
น้ำส้มสายชู 60 ก.
ซีอิ๊วขาว 45 ก.
ขิงแก่บด 150 ก.
พริกจินดาซอย 69 ก.', 'Fermented soybeans 150 g
Palm sugar 108 g
Vinegar 60 g
Light soy sauce 45 g
Ground old ginger 150 g
Sliced bird''s eye chili 69 g', '1. ผสมเต้าเจี้ยว น้ำตาลปี๊บ น้ำส้มสายชู ซีอิ๊วขาว ขิงแก่บด และพริกจินดาซอยเข้าด้วยกัน คนจนน้ำตาลปี๊บละลายหมด
2. บรรจุน้ำจิ้มลงขวดบีบ
3. เก็บในตู้เย็นเพื่อรักษาคุณภาพและรสชาติ', '1. Combine fermented soybeans, palm sugar, vinegar, light soy sauce, ground old ginger and sliced chili in a large bowl; stir until the palm sugar dissolves.
2. Pour the sauce into squeeze bottles.
3. Keep refrigerated.', 1, true
where not exists (select 1 from public.menus where code = 'S01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '7ce2cdaf-fea4-49a8-8554-b23d85fe3dc4', 0.075 from public.menus m where m.code = 'S01' and exists (select 1 from public.items where id = '7ce2cdaf-fea4-49a8-8554-b23d85fe3dc4') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '909e44d5-fa49-4d0f-9bbb-daca5280fa09', 60 from public.menus m where m.code = 'S01' and exists (select 1 from public.items where id = '909e44d5-fa49-4d0f-9bbb-daca5280fa09') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '9f38fc82-ea98-429d-934f-a8e09add013d', 0.045 from public.menus m where m.code = 'S01' and exists (select 1 from public.items where id = '9f38fc82-ea98-429d-934f-a8e09add013d') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'a29e2fed-7bdd-43af-9eef-b79eb46c4f97', 150 from public.menus m where m.code = 'S01' and exists (select 1 from public.items where id = 'a29e2fed-7bdd-43af-9eef-b79eb46c4f97') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '131c68fb-4653-4548-bc20-bd95303fc95c', 69 from public.menus m where m.code = 'S01' and exists (select 1 from public.items where id = '131c68fb-4653-4548-bc20-bd95303fc95c') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'C02', 'prep', 'ไก่ทอด', 'Fried Chicken', 'ไก่ต้ม (C01) ตามต้องการ
แป้งทอดกรอบ 100 ก.
น้ำเย็น 100–150 ก.
เกลือ 1/4 ช้อนโต๊ะ', 'Boiled chicken (C01) as needed
Crispy batter flour 100 g
Cold water 100–150 g
Salt 1/4 tbsp', '1. ผสมแป้งกับน้ำและเกลือตามปริมาณ ให้ได้ความข้นพอดี
2. เลาะกระดูกไก่ต้ม ชุบแป้ง แล้วทอดในน้ำมัน 200 องศา 2 นาที', '1. Mix the flour with water and salt to the right thickness.
2. Debone the boiled chicken, coat in batter and deep-fry at 200°C for 2 minutes.', 1, true
where not exists (select 1 from public.menus where code = 'C02');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '2845e8c8-808f-4b4f-a19c-fdf6e07668fa', 0.1 from public.menus m where m.code = 'C02' and exists (select 1 from public.items where id = '2845e8c8-808f-4b4f-a19c-fdf6e07668fa') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'S03', 'prep', 'ซอสผัดอเนกประสงค์', 'All-Purpose Stir-Fry Sauce', 'น้ำมันหอย ตราแพนกวินสามตัว 2,000 ก.
น้ำตาลทราย 300 ก.
ซอสปรุงรสฝาเขียว 100 ก.
น้ำปลา 50 ก.
รสดีไก่ 240 ก.
พริกไทยป่น 10 ก.
เหล้าจีน 100 ก.
ผงชูรส 200 ก.', 'Three Penguins oyster sauce 2,000 g
Sugar 300 g
Green-cap seasoning sauce 100 g
Fish sauce 50 g
RosDee chicken powder 240 g
Ground pepper 10 g
Chinese cooking wine 100 g
MSG 200 g', '1. ใส่วัตถุดิบทั้งหมดลงหม้อ ตั้งไฟ
2. คนให้เข้ากัน รอจนเดือดและทุกอย่างรวมเป็นเนื้อเดียว
3. ยกลง พักให้เย็น ใส่กล่องเก็บเข้าตู้เย็น', '1. Put all ingredients into a pot over heat.
2. Stir until combined and bring to a boil until smooth.
3. Remove from heat, cool, store in a container and refrigerate.', 1, true
where not exists (select 1 from public.menus where code = 'S03');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '3f99e913-192c-40d5-88c2-728da91e20ff', 1 from public.menus m where m.code = 'S03' and exists (select 1 from public.items where id = '3f99e913-192c-40d5-88c2-728da91e20ff') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '4b999772-4fed-4cc8-b50b-d94744029e42', 0.3 from public.menus m where m.code = 'S03' and exists (select 1 from public.items where id = '4b999772-4fed-4cc8-b50b-d94744029e42') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'S04', 'prep', 'ซอสบาร์บีคิว', 'Barbecue Sauce', 'หอมหัวใหญ่สับ 4 หัว
เนย 30 ก.
ซอสมะเขือเทศ 2,000 ก.
ซอสพริก 1,000 ก.
มัสตาร์ด 1,000 ก.
น้ำตาลทราย 1,000 ก.
พริกไทยป่น 30 ก.
ออริกาโนแห้ง 10 ก.
น้ำเปล่า 200 มล.', 'Chopped onion 4 pcs
Butter 30 g
Tomato ketchup 2,000 g
Chili sauce 1,000 g
Mustard 1,000 g
Sugar 1,000 g
Ground pepper 30 g
Dried oregano 10 g
Water 200 ml', '1. ผัดหอมหัวใหญ่สับกับเนยจนคลายน้ำและสุกใส
2. ใส่วัตถุดิบเปียกและน้ำตาล: ซอสมะเขือเทศ ซอสพริก มัสตาร์ด น้ำตาลทราย
3. ใส่วัตถุดิบแห้ง: ออริกาโน พริกไทยป่น
4. ใส่น้ำเปล่า
5. ต้มให้เดือด แล้วยกลงพักไว้
6. เมื่อซอสเย็น ใส่กล่องเก็บเข้าตู้เย็น', '1. Sauté chopped onion with butter until soft.
2. Add ketchup, chili sauce, mustard and sugar.
3. Add oregano and ground pepper.
4. Pour in the water.
5. Bring to a boil, then remove from heat to cool.
6. Once cool, store in a container and refrigerate.', 1, true
where not exists (select 1 from public.menus where code = 'S04');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'dade1463-9bc8-4aff-b114-5614b0922e35', 2 from public.menus m where m.code = 'S04' and exists (select 1 from public.items where id = 'dade1463-9bc8-4aff-b114-5614b0922e35') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '4894c694-9a59-40b3-9f21-17a3c8ca262e', 1 from public.menus m where m.code = 'S04' and exists (select 1 from public.items where id = '4894c694-9a59-40b3-9f21-17a3c8ca262e') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '4b999772-4fed-4cc8-b50b-d94744029e42', 1 from public.menus m where m.code = 'S04' and exists (select 1 from public.items where id = '4b999772-4fed-4cc8-b50b-d94744029e42') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'S05', 'prep', 'ซอสทาร์ทาร์', 'Tartar Sauce', 'หอมหัวใหญ่สับ 1 หัว
แตงกวาดอง 2 ลูก
ลูกเคเปอร์ 4 ช้อนโต๊ะ
ผักชีลาว 2–3 ก้าน
มัสตาร์ด 30 ก.
ซอสพริก 30 ก.
มายองเนส 1,000 ก.', 'Chopped onion 1 pc
Pickled cucumbers 2 pcs
Capers 4 tbsp
Fresh dill 2–3 sprigs
Mustard 30 g
Chili sauce 30 g
Mayonnaise 1,000 g', '1. ใส่หอมหัวใหญ่สับ แตงกวาดอง ลูกเคเปอร์ และผักชีลาวในเครื่องบดสับ ปั่นให้ละเอียด
2. ใส่มัสตาร์ด ซอสพริก มายองเนส ผสมให้เข้ากัน ถ้ายังไม่ละเอียดพอ ปั่นต่ออีก 5–10 วินาที
3. ใส่กล่องเก็บเข้าตู้เย็น', '1. Blend chopped onion, pickled cucumbers, capers and dill in a food processor until fine.
2. Add mustard, chili sauce and mayonnaise and mix well; blend 5–10 more seconds if needed.
3. Store in a container and refrigerate.', 1, true
where not exists (select 1 from public.menus where code = 'S05');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '584b9540-21fa-4017-8456-cf76da89a45a', 1 from public.menus m where m.code = 'S05' and exists (select 1 from public.items where id = '584b9540-21fa-4017-8456-cf76da89a45a') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'S06', 'prep', 'ซอสเบอร์เกอร์', 'Burger Sauce', 'มายองเนส 1,000 ก.
ซอสมะเขือเทศ 500 ก.
แตงกวาดองสับละเอียด 150 ก.
มัสตาร์ดเหลือง 70 ก.
น้ำตาลทรายขาว 40 ก.
น้ำแตงกวาดอง 30 ก.
ปาปริก้าป่น 15 ก.
ผงกระเทียม 15 ก.
ผงหอมหัวใหญ่ 15 ก.
เกลือป่น (ไม่จำเป็น) 2–3 ก.', 'Mayonnaise 1,000 g
Tomato ketchup 500 g
Finely chopped pickles 150 g
Yellow mustard 70 g
White sugar 40 g
Pickle brine 30 g
Paprika powder 15 g
Garlic powder 15 g
Onion powder 15 g
Salt (optional) 2–3 g', '1. สับแตงกวาดองให้ละเอียด บีบน้ำออกเอาแต่เนื้อ (ซอสจะได้ไม่เหลว)
2. ใส่มายองเนส ซอสมะเขือเทศ แตงกวาดองสับ มัสตาร์ดเหลือง น้ำตาล น้ำแตงกวาดอง ปาปริก้า ผงกระเทียม ผงหอมหัวใหญ่ ลงชามผสม
3. คนให้เข้ากันจนเนื้อเนียน
4. ชิมก่อน ถ้าต้องการเค็มเพิ่ม เติมเกลือเล็กน้อย (2–3 ก.)
5. ใส่กล่องปิดฝาสนิท เก็บเข้าตู้เย็นก่อนใช้', '1. Finely chop the pickles and squeeze out the liquid.
2. Put mayonnaise, ketchup, chopped pickles, mustard, sugar, pickle brine, paprika, garlic powder and onion powder into a bowl.
3. Mix until smooth.
4. Taste; add a pinch of salt (2–3 g) if needed.
5. Store in a sealed container in the fridge before use.', 1, true
where not exists (select 1 from public.menus where code = 'S06');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '584b9540-21fa-4017-8456-cf76da89a45a', 1 from public.menus m where m.code = 'S06' and exists (select 1 from public.items where id = '584b9540-21fa-4017-8456-cf76da89a45a') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'dade1463-9bc8-4aff-b114-5614b0922e35', 0.5 from public.menus m where m.code = 'S06' and exists (select 1 from public.items where id = 'dade1463-9bc8-4aff-b114-5614b0922e35') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'BE01', 'prep', 'เนื้อบด (แบ่งถุง)', 'Ground Beef (portioning)', 'เนื้อบด 1,000 ก.
ถุงแบ่งใส่เนื้อ 10 ใบ', 'Ground beef 1,000 g
Small plastic bags 10 pcs', '1. นำเนื้อแพ็ก 1 กก. มาละลายน้ำแข็ง
2. แบ่งเนื้อใส่ถุง ถุงละ 100 ก. (ได้ 10 ถุง)
3. เก็บใส่กล่อง ติดป้ายวันที่ แล้วแช่แข็ง', '1. Thaw a 1 kg pack of minced beef completely.
2. Portion into small bags, 100 g each (10 bags).
3. Put the bags in a container, label with the date and freeze.', 1, true
where not exists (select 1 from public.menus where code = 'BE01');
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'BE02', 'prep', 'เนื้อบดทำเบอร์เกอร์', 'Beef Burger Patty', 'เนื้อบด (แช่เย็นจัด) 1,000 ก.
เกลือป่น 2 ช้อนชา (10–12 ก.)
พริกไทยดำป่น 1.5 ช้อนชา (5–7 ก.)
ผงกระเทียม 1 ช้อนโต๊ะ (พูน)
ผงหอมหัวใหญ่ 1 ช้อนโต๊ะ
วูสเตอร์ซอส 2 ช้อนโต๊ะ
มัสตาร์ดครีม 1 ช้อนชา
เกล็ดขนมปังป่น 40 ก.', 'Minced beef (well chilled) 1,000 g
Fine salt 2 tsp (10–12 g)
Ground black pepper 1.5 tsp (5–7 g)
Garlic powder 1 heaping tbsp
Onion powder 1 tbsp
Worcestershire sauce 2 tbsp
Yellow mustard 1 tsp
Breadcrumbs 40 g', '1. ใส่เนื้อบดที่แช่เย็นจัดลงชามผสม
2. ใส่เกลือ พริกไทยดำ ผงกระเทียม ผงหอมหัวใหญ่ วูสเตอร์ซอส มัสตาร์ด และเกล็ดขนมปัง
3. ผสมเบา ๆ ให้เข้ากัน (อย่านวดนาน เนื้อจะได้ชุ่มฉ่ำ)
4. ปั้นเป็นก้อนละประมาณ 150 ก. กดเป็นแผ่นกลม
5. วางบนกระดาษไขที่ตัดพอดี ซ้อนกัน เก็บเข้าตู้เย็นก่อนนำไปย่าง', '1. Put cold minced beef in a large bowl.
2. Add salt, black pepper, garlic powder, onion powder, Worcestershire sauce, mustard and breadcrumbs.
3. Mix gently until combined (do not over-mix).
4. Shape into 150 g round patties.
5. Place each on parchment, stack and refrigerate before grilling.', 1, true
where not exists (select 1 from public.menus where code = 'BE02');
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'SN01', 'dish', 'เฟรนช์ฟรายส์', 'French Fries', 'เฟรนช์ฟรายส์ 200 ก. (1 ถุง)
เกลือป่น ตามชอบ', 'French fries 200 g (1 bag)
Fine salt to taste', 'เตรียม: ได้ถุงใหญ่ 2 กก. แบ่งใส่ถุงเล็ก ถุงละ 200 ก. (ได้ 10 ถุง) เก็บในช่องฟรีซ
1. ทอดที่ 170 องศา 2 นาที หรือจนเหลืองสวย
2. ยกขึ้นพักไว้
3. ปรับน้ำมันเป็น 200 องศา
4. ทอดซ้ำอีก 10–20 วินาที ให้กรอบ
5. ยกขึ้นสะเด็ดน้ำมัน
6. โรยเกลือตามชอบขณะยังร้อน', 'Prep: split each 2 kg bag into 200 g bags (10 bags) and freeze.
1. Fry at 170°C for 2 minutes or until light golden.
2. Remove and rest.
3. Raise the oil to 200°C.
4. Fry again 10–20 seconds until extra crispy.
5. Drain.
6. Season with salt while hot.', 1, true
where not exists (select 1 from public.menus where code = 'SN01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '12207b3d-763c-42d4-9fd4-de591e6783c8', 1 from public.menus m where m.code = 'SN01' and exists (select 1 from public.items where id = '12207b3d-763c-42d4-9fd4-de591e6783c8') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'SN02', 'dish', 'เอ็นข้อไก่ทอด', 'Deep-Fried Chicken Tendons', 'เอ็นข้อไก่ทอดแช่แข็ง 140 ก. (1 ถุง)
น้ำจิ้มไก่ สำหรับเสิร์ฟ', 'Frozen chicken tendons 140 g (1 bag)
Sweet chicken sauce for serving', 'เตรียม: ได้ถุงใหญ่ 1 กก. แบ่งใส่ถุงเล็ก ถุงละ 140 ก. (ได้ 6 ถุง) เก็บในช่องฟรีซ
1. ทอดที่ 170 องศา จนเหลืองกรอบ
2. ยกขึ้นสะเด็ดน้ำมัน เสิร์ฟจานเล็กพร้อมน้ำจิ้มไก่', 'Prep: split each 1 kg bag into 140 g bags (6 bags) and freeze.
1. Fry at 170°C until golden and crispy.
2. Drain and serve on a small plate with sweet chicken sauce.', 1, true
where not exists (select 1 from public.menus where code = 'SN02');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '97027a11-7b76-4363-9142-41e78b332576', 1 from public.menus m where m.code = 'SN02' and exists (select 1 from public.items where id = '97027a11-7b76-4363-9142-41e78b332576') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'SN03', 'dish', 'ไก่คาราเกะทอด', 'Fried Chicken Karaage', 'ไก่ทอดคาราเกะแช่แข็ง 140 ก. (1 ถุง)
น้ำจิ้มไก่ สำหรับเสิร์ฟ', 'Frozen chicken karaage 140 g (1 bag)
Sweet chicken sauce for serving', 'เตรียม: ได้ถุงใหญ่ 1 กก. แบ่งใส่ถุงเล็ก ถุงละ 140 ก. (ได้ 6 ถุง) เก็บในช่องฟรีซ
1. ทอดที่ 170 องศา จนเหลืองกรอบ
2. ยกขึ้นสะเด็ดน้ำมัน เสิร์ฟจานเล็กพร้อมน้ำจิ้มไก่', 'Prep: split each 1 kg bag into 140 g bags (6 bags) and freeze.
1. Fry at 170°C until golden and crispy.
2. Drain and serve on a small plate with sweet chicken sauce.', 1, true
where not exists (select 1 from public.menus where code = 'SN03');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '56467d14-0969-48bd-9100-189f147da2bc', 1 from public.menus m where m.code = 'SN03' and exists (select 1 from public.items where id = '56467d14-0969-48bd-9100-189f147da2bc') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'CR01', 'dish', 'ข้าวมันไก่', 'Boiled Chicken Rice', 'ไก่ต้ม (C01) 1 ชิ้น
ข้าวมัน (R02) 1 ถ้วย
น้ำจิ้มข้าวมันไก่ (S01) 1 ถ้วยเล็ก
สต๊อกไก่ (ST01) 1 ถ้วย
ผักชี
แตงกวา 3–4 ชิ้น', 'Boiled chicken (C01) 1 pc
Chicken rice (R02) 1 cup
Chicken rice sauce (S01) 1 small cup
Chicken stock (ST01) 1 cup
Coriander
Cucumber 3–4 pcs', '1. ตักข้าวมัน (R02) 1 ถ้วย อัดใส่พิมพ์แล้วคว่ำลงจานให้สวย
2. หั่นไก่ต้ม (C01) 1 ชิ้นเป็นชิ้นพอดีคำ จัดวางบนหรือข้างข้าว
3. วางแตงกวาหั่น 3–4 ชิ้นข้างจาน โรยผักชีบนไก่
4. อุ่นสต๊อกไก่ (ST01) 1 ถ้วยให้ร้อนจัด เทใส่ถ้วยซุป
5. ตักน้ำจิ้ม (S01) 1 ถ้วยเล็ก เสิร์ฟพร้อมกันทันที', '1. Mould 1 cup of chicken rice (R02) and turn it out neatly onto the plate.
2. Slice 1 piece of boiled chicken (C01) and arrange over or beside the rice.
3. Add 3–4 cucumber slices and garnish with coriander.
4. Heat 1 cup of chicken stock (ST01) and pour into a soup bowl.
5. Serve with 1 small cup of chicken rice sauce (S01) immediately.', 1, true
where not exists (select 1 from public.menus where code = 'CR01');
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'CR02', 'dish', 'ข้าวมันไก่ทอด', 'Fried Chicken Rice', 'ไก่ทอด (C02) 1 ชิ้น
ข้าวมัน (R02) 1 ถ้วย
น้ำจิ้มไก่ (S02) 1 ถ้วยเล็ก
สต๊อกไก่ (ST01) 1 ถ้วย
ผักชี
แตงกวา 3–4 ชิ้น', 'Fried chicken (C02) 1 pc
Chicken rice (R02) 1 cup
Sweet chicken sauce (S02) 1 small cup
Chicken stock (ST01) 1 cup
Coriander
Cucumber 3–4 pcs', '1. ตักข้าวมัน (R02) 1 ถ้วย อัดใส่พิมพ์แล้วคว่ำลงจาน
2. ทอดหรืออุ่นไก่ทอด (C02) 1 ชิ้นให้ร้อนกรอบ หั่นพอดีคำ วางบนหรือข้างข้าว
3. วางแตงกวาหั่น 3–4 ชิ้นข้างจาน โรยผักชีบนไก่
4. อุ่นสต๊อกไก่ (ST01) 1 ถ้วยให้ร้อนจัด เทใส่ถ้วยซุป
5. เทน้ำจิ้มไก่ (S02) 1 ถ้วยเล็ก เสิร์ฟพร้อมกันทันที', '1. Mould 1 cup of chicken rice (R02) onto the plate.
2. Fry or reheat 1 piece of fried chicken (C02) until hot and crispy, slice and arrange.
3. Add 3–4 cucumber slices and garnish with coriander.
4. Heat 1 cup of chicken stock (ST01) and pour into a soup bowl.
5. Serve with 1 small cup of sweet chili sauce (S02) immediately.', 1, true
where not exists (select 1 from public.menus where code = 'CR02');
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'CR03', 'dish', 'ข้าวมันไก่ผสม', 'Mixed Chicken Rice', 'ไก่ต้ม (C01) ½ ชิ้น
ไก่ทอด (C02) ½ ชิ้น
ข้าวมัน (R02) 1 ถ้วย
น้ำจิ้มข้าวมันไก่ (S01) 1 ถ้วยเล็ก
น้ำจิ้มไก่ (S02) 1 ถ้วยเล็ก
สต๊อกไก่ (ST01) 1 ถ้วย
ผักชี
แตงกวา 3–4 ชิ้น', 'Boiled chicken (C01) ½ pc
Fried chicken (C02) ½ pc
Chicken rice (R02) 1 cup
Chicken rice sauce (S01) 1 small cup
Sweet chicken sauce (S02) 1 small cup
Chicken stock (ST01) 1 cup
Coriander
Cucumber 3–4 pcs', '1. ตักข้าวมัน (R02) 1 ถ้วย อัดใส่พิมพ์แล้วคว่ำลงจาน
2. หั่นไก่ต้ม (C01) ½ ชิ้น และไก่ทอดร้อนกรอบ (C02) ½ ชิ้น จัดวางคู่กัน
3. วางแตงกวาหั่น 3–4 ชิ้นข้างจาน โรยผักชีบนไก่
4. อุ่นสต๊อกไก่ (ST01) 1 ถ้วยให้ร้อนจัด เทใส่ถ้วยซุป
5. เสิร์ฟพร้อมน้ำจิ้ม (S01) และ (S02) อย่างละ 1 ถ้วยเล็ก', '1. Mould 1 cup of chicken rice (R02) onto the plate.
2. Slice ½ boiled chicken (C01) and ½ hot fried chicken (C02) and arrange side by side.
3. Add 3–4 cucumber slices and garnish with coriander.
4. Heat 1 cup of chicken stock (ST01) and pour into a soup bowl.
5. Serve with 1 small cup each of sauces S01 and S02.', 1, true
where not exists (select 1 from public.menus where code = 'CR03');
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'M01', 'dish', 'ข้าวผัดกะเพราเนื้อ + ไข่ดาว', 'Beef Basil Rice with Fried Egg', 'เนื้อวัว (B01) 100 ก. (1 ถุง)
กระเทียมบด/สับ 1 ช้อนชา
พริกสด ½ ช้อนชา
พริกแห้ง ½ ช้อนชา
ซอสผัดอเนกประสงค์ (S03) 2 ช้อนชา
เหล้าจีน 1 ช้อนชา (½ รอบกระทะ)
ใบกะเพรา 1 ต้น
ข้าวสวย (R01) 2 ทัพพี
ไข่ดาว 1 ฟอง', 'Beef (B01) 100 g (1 bag)
Minced garlic 1 tsp
Fresh chili ½ tsp
Dried chili ½ tsp
All-purpose sauce (S03) 2 tsp
Shaoxing wine 1 tsp (½ round)
Holy basil 1 stalk
Cooked rice (R01) 2 ladles
Fried egg 1', '1. ตั้งกระทะ ใส่เนื้อแล้วกดทาบให้ผิวเกรียมกรอบ
2. ขยี้เนื้อให้กระจาย ใส่กระเทียม พริกสด พริกแห้ง และซอสอเนกประสงค์
3. ผัดให้แห้งจนเลิกสงสัยว่าแห้งหรือยัง
4. ใส่ใบกะเพรา และวนเหล้าจีนที่ขอบกระทะครึ่งรอบ
5. ตักใส่จานลึก เสิร์ฟพร้อมข้าวสวย 2 ทัพพี และไข่ดาว', '1. Heat the pan, add the beef and press it down until the surface is browned and crispy.
2. Break it up and add garlic, fresh chili, dried chili and all-purpose sauce.
3. Stir-fry until completely dry.
4. Add holy basil and swirl Shaoxing wine around half the edge of the pan.
5. Serve in a deep plate with 2 ladles of rice and a fried egg.', 1, true
where not exists (select 1 from public.menus where code = 'M01');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '6eb3e662-f767-4184-aaf4-3e85375fd3f3', 1 from public.menus m where m.code = 'M01' and exists (select 1 from public.items where id = '6eb3e662-f767-4184-aaf4-3e85375fd3f3') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'a1e0a183-948d-4cfd-957f-2364309014d0', 1 from public.menus m where m.code = 'M01' and exists (select 1 from public.items where id = 'a1e0a183-948d-4cfd-957f-2364309014d0') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'M02', 'dish', 'ข้าวผัดมันเนื้อ + สเต๊กพิคานย่า', 'Beef Tallow Fried Rice with Picanha Steak', 'เนื้อพิคานย่า 100 ก.
ข้าวมันเนื้อ (R03) 1 ถุง
เกลือ เล็กน้อย
เนยจืด ½ ช้อนโต๊ะ
กระเทียมสดปั่น ตามชอบ
ซอสผัดอเนกประสงค์ (S03) ½ ช้อนโต๊ะ
น้ำตาล ¼ ช้อนโต๊ะ
กระเทียมเจียว โรยหน้า
ต้นหอมซอย โรยหน้า', 'Picanha beef 100 g
Beef tallow rice (R03) 1 bag
Salt a pinch
Unsalted butter ½ tbsp
Blended fresh garlic as needed
All-purpose stir-fry sauce (S03) ½ tbsp
Sugar ¼ tbsp
Crispy fried garlic for garnish
Chopped spring onion for garnish', 'เตรียม: เนื้อพิคานย่า 100 ก. ถ้าอยู่ช่องเย็นให้ซับให้แห้ง ถ้าแช่แข็งให้ละลายในไมโครเวฟไฟกลาง-สูง 1 นาที (เปิดเช็กบ่อย ๆ ไม่ให้เนื้อสุก) · ข้าวมันเนื้อ 1 ถุง ไม่ต้องอุ่นก่อน · ต้นหอมซอยละเอียด
1. ตั้งกระทะแบนให้ได้ 200 องศา
2. โรยเกลือที่เนื้อเล็กน้อยก่อนลงกระทะ
3. เซียร์ด้านมันก่อนให้ได้สีและกลิ่น แล้วเซียร์ด้านเนื้อ ให้สุกระดับมีเดียมแรร์ ยกขึ้นพัก 3–5 นาที
4. ใส่เนยจืด ½ ช้อนโต๊ะ ผัดกับกระเทียมสดปั่นจนเริ่มเหลืองอ่อน
5. ใส่ข้าวมันเนื้อ ผัดให้เม็ดข้าวแยกกัน ปรุงด้วยซอส ½ ช้อนโต๊ะ และน้ำตาล ¼ ช้อนโต๊ะ โรยต้นหอม
6. จัดเสิร์ฟ: ตักข้าวลงจาน หั่นเนื้อพอดีคำวางด้านบน โรยกระเทียมเจียว และต้นหอมตรงกลาง', 'Prep: pat chilled picanha (100 g) dry; if frozen, thaw 1 minute in the microwave on medium-high, checking often so it does not cook. Tallow rice: 1 bag, no need to reheat. Finely chop the spring onion.
1. Heat a flat pan to 200°C.
2. Season the beef with a pinch of salt just before searing.
3. Sear the fat side first, then the meat sides to medium-rare; rest 3–5 minutes.
4. In the same pan, melt ½ tbsp butter and sauté the garlic until light golden.
5. Add the tallow rice and separate the grains; season with ½ tbsp sauce and ¼ tbsp sugar; add spring onion.
6. Plate the rice, slice the beef on top, garnish with fried garlic and spring onion in the centre.', 1, true
where not exists (select 1 from public.menus where code = 'M02');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '500f5a77-182b-4fe5-9413-bccd1b2817cf', 1 from public.menus m where m.code = 'M02' and exists (select 1 from public.items where id = '500f5a77-182b-4fe5-9413-bccd1b2817cf') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'M03', 'dish', 'เบอร์เกอร์เนื้อ + เฟรนช์ฟรายส์', 'Beef Burger & French Fries', 'ขนมปังเบอร์เกอร์ 1 ก้อน
เนื้อบด (BE02) 1 ก้อน
เฟรนช์ฟรายส์ 1 ถุง
หอมใหญ่คาราเมลไลซ์ 20 ก.
ชีสแผ่น 1 แผ่น
ซอสเบอร์เกอร์ (S06) ตามชอบ
ซอสมะเขือเทศ ตามชอบ
เกลือ โรยเฟรนช์ฟรายส์', 'Burger bun 1
Beef patty (BE02) 1
French fries 1 bag
Caramelized onions 20 g
Cheese slice 1
Burger sauce (S06) as needed
Ketchup as needed
Salt for fries', 'เตรียม: ขนมปังหั่นครึ่งให้เท่ากัน อบให้สีสวย · เนื้อบดละลายในไมโครเวฟให้ได้อุณหภูมิห้อง · หอมใหญ่คาราเมลไลซ์ 20 ก. ละลายในไมโครเวฟ · เฟรนช์ฟรายส์ทอด 200 องศา (ทอด 2 ครั้ง) · ซอสมะเขือเทศบีบใส่ถ้วย
1. ทาซอสเบอร์เกอร์บนขนมปังที่อบแล้วให้ทั่ว
2. เซียร์เนื้อบนกระทะแบนให้สุกและสีสวย วางชีสและหอมใหญ่คาราเมลไลซ์ด้านบน
3. จัดเบอร์เกอร์ลงจาน พร้อมเฟรนช์ฟรายส์โรยเกลือ และถ้วยซอสมะเขือเทศ', 'Prep: halve and toast the bun; thaw the patty to room temperature; thaw 20 g caramelized onions; double-fry fries at 200°C; put ketchup in a small cup.
1. Spread burger sauce on both bun halves.
2. Sear the patty on a flat pan until cooked and browned; top with cheese and caramelized onions.
3. Plate the burger with salted fries and the ketchup cup.', 1, true
where not exists (select 1 from public.menus where code = 'M03');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'edfdbfa3-5446-4e66-b7be-0c484db852ff', 1 from public.menus m where m.code = 'M03' and exists (select 1 from public.items where id = 'edfdbfa3-5446-4e66-b7be-0c484db852ff') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '46a33f07-2688-4bca-abe1-cd92af4f92b7', 1 from public.menus m where m.code = 'M03' and exists (select 1 from public.items where id = '46a33f07-2688-4bca-abe1-cd92af4f92b7') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '12207b3d-763c-42d4-9fd4-de591e6783c8', 1 from public.menus m where m.code = 'M03' and exists (select 1 from public.items where id = '12207b3d-763c-42d4-9fd4-de591e6783c8') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'M04', 'dish', 'เบอร์เกอร์ไก่ทอด', 'Fried Chicken Burger', 'ขนมปังเบอร์เกอร์ 1 ชิ้น
ไก่ทอด (C02) 1 ชิ้น
ซอสทาร์ทาร์ (S05) 1 ช้อนโต๊ะ
เฟรนช์ฟรายส์ 1 ถุง', 'Burger bun 1
Fried chicken (C02) 1 piece
Tartar sauce (S05) 1 tbsp
French fries 1 bag', '1. อบหรือปิ้งขนมปังให้ร้อนและสีสวย
2. ทอดไก่ทอด (C02) ให้สุกกรอบร้อนทั่ว
3. ทอดเฟรนช์ฟรายส์ให้กรอบ สะเด็ดน้ำมัน
4. ทาซอสทาร์ทาร์ 1 ช้อนโต๊ะบนขนมปัง ประกอบกับไก่ทอด
5. เสิร์ฟคู่กับเฟรนช์ฟรายส์ร้อน ๆ', '1. Toast the bun until warm and lightly golden.
2. Fry the chicken (C02) until hot and crispy.
3. Fry the fries until crispy and drain.
4. Spread 1 tbsp tartar sauce (S05) on the bun and assemble with the chicken.
5. Serve with hot fries.', 1, true
where not exists (select 1 from public.menus where code = 'M04');
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, 'edfdbfa3-5446-4e66-b7be-0c484db852ff', 1 from public.menus m where m.code = 'M04' and exists (select 1 from public.items where id = 'edfdbfa3-5446-4e66-b7be-0c484db852ff') on conflict do nothing;
insert into public.recipe_lines (menu_id, item_id, qty) select m.id, '12207b3d-763c-42d4-9fd4-de591e6783c8', 1 from public.menus m where m.code = 'M04' and exists (select 1 from public.items where id = '12207b3d-763c-42d4-9fd4-de591e6783c8') on conflict do nothing;
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'A01', 'dish', 'อโรมาติกไก่ (ทานเล่น)', 'Aromatic Chicken (Appetizer)', 'ไก่ต้ม (C01) 1 ชิ้น
พริกกระเทียมจีน (น้ำมันพริกกระเทียม) ตามชอบ
ผักชี 1 ใบ', 'Boiled chicken (C01) 1 piece
Chinese chili garlic oil as needed
Coriander 1 leaf', '1. หั่นไก่ต้มเป็นชิ้นพอดีคำ จัดเรียงใส่จาน
2. ราดพริกกระเทียมจีนบนไก่
3. ท็อปด้วยผักชี 1 ใบ', '1. Slice the boiled chicken into bite-sized pieces and arrange on a plate.
2. Drizzle Chinese chili garlic oil over the chicken.
3. Top with 1 coriander leaf.', 1, true
where not exists (select 1 from public.menus where code = 'A01');
insert into public.menus (code, kind, name_th, name_en, ingredients_th, ingredients_en, steps_th, steps_en, min_portions, active)
select 'A02', 'dish', 'อโรมาติกเนื้อ (ทานเล่น)', 'Aromatic Beef (Appetizer)', 'เนื้อแช่ 1 ชิ้นใหญ่ (สไลซ์บาง 15 ชิ้น)
หอมหัวใหญ่ซอย ตามชอบ
ซอสหมัก 100 ก.
ต้นหอมหมักน้ำมันงา สำหรับท็อปปิ้ง', 'Chilled/frozen beef 1 large piece (15 thin slices)
Sliced onion as needed
Marinating sauce 100 g
Sesame-oil marinated spring onion for garnish', '1. ใช้เครื่องสไลซ์หั่นเนื้อเป็นชิ้นบาง 15 ชิ้น
2. ใส่ซอสหมัก 100 ก. กับหอมหัวใหญ่ซอยในถ้วย หมัก 2–3 นาที
3. ละลายต้นหอมหมักน้ำมันงา 15–20 วินาที
4. จัดหอมหัวใหญ่ที่หมักแล้วบนจาน
5. วางเนื้อทั้ง 15 ชิ้นซ้อนบนหอมหัวใหญ่
6. วางต้นหอมหมักน้ำมันงาบนเนื้อเป็นวงกลมให้สวย', '1. Slice the beef thinly into 15 pieces with a slicer.
2. Marinate the sliced onion in 100 g of marinating sauce for 2–3 minutes.
3. Thaw the sesame-oil spring onion for 15–20 seconds.
4. Arrange the onion on a serving plate.
5. Lay the 15 beef slices on top.
6. Garnish with the spring onion in a neat circle.', 1, true
where not exists (select 1 from public.menus where code = 'A02');
commit;
