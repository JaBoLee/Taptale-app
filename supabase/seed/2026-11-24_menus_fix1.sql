-- 24 พ.ย.: ตัดอโรมาติกไก่, อโรมาติกเนื้อ → Beef Tataki, ข้าวมันไก่ใช้ไก่ 200 ก./จาน
begin;
delete from public.recipe_lines where menu_id in (select id from public.menus where code='A01');
delete from public.menus where code='A01';
update public.menus set name_th='บีฟทาทากิ', name_en='Beef Tataki', name_my='အမဲသား တာတာကီ (Beef Tataki)' where code='A02';
update public.menus set ingredients_th='ไก่ต้ม (C01) 200 ก.
ข้าวมัน (R02) 1 ถ้วย
น้ำจิ้มข้าวมันไก่ (S01) 1 ถ้วยเล็ก
สต๊อกไก่ (ST01) 1 ถ้วย
ผักชี
แตงกวา 3–4 ชิ้น', ingredients_en='Boiled chicken (C01) 200 g
Chicken rice (R02) 1 cup
Chicken rice sauce (S01) 1 small cup
Chicken stock (ST01) 1 cup
Coriander
Cucumber 3–4 pcs', ingredients_my='ကြက်ပြုတ် (C01) 200 ဂရမ်
ကြက်ဆီထမင်း (R02) 1 ခွက်
ကြက်သားထမင်းဆော့စ် (S01) 1 ခွက်ငယ်
ကြက်ပြုတ်ရည် (ST01) 1 ခွက်
နံနံပင်
သခွားသီး 3–4 စိတ်' where code='CR01';
insert into public.recipe_lines (menu_id,item_id,qty) select id,'17c08134-cc79-45f8-8e10-743e4ede44fb',0.1 from public.menus where code='CR01' on conflict (menu_id,item_id) do update set qty=excluded.qty;
update public.menus set ingredients_th='ไก่ทอด (C02) 200 ก.
ข้าวมัน (R02) 1 ถ้วย
น้ำจิ้มไก่ (S02) 1 ถ้วยเล็ก
สต๊อกไก่ (ST01) 1 ถ้วย
ผักชี
แตงกวา 3–4 ชิ้น', ingredients_en='Fried chicken (C02) 200 g
Chicken rice (R02) 1 cup
Sweet chicken sauce (S02) 1 small cup
Chicken stock (ST01) 1 cup
Coriander
Cucumber 3–4 pcs', ingredients_my='ကြက်ကြော် (C02) 200 ဂရမ်
ကြက်ဆီထမင်း (R02) 1 ခွက်
ကြက်ကြော်အချဉ်ရည် (S02) 1 ခွက်ငယ်
ကြက်ပြုတ်ရည် (ST01) 1 ခွက်
နံနံပင်
သခွားသီး 3–4 စိတ်' where code='CR02';
insert into public.recipe_lines (menu_id,item_id,qty) select id,'17c08134-cc79-45f8-8e10-743e4ede44fb',0.1 from public.menus where code='CR02' on conflict (menu_id,item_id) do update set qty=excluded.qty;
update public.menus set ingredients_th='ไก่ต้ม (C01) 100 ก.
ไก่ทอด (C02) 100 ก.
ข้าวมัน (R02) 1 ถ้วย
น้ำจิ้มข้าวมันไก่ (S01) 1 ถ้วยเล็ก
น้ำจิ้มไก่ (S02) 1 ถ้วยเล็ก
สต๊อกไก่ (ST01) 1 ถ้วย
ผักชี
แตงกวา 3–4 ชิ้น', ingredients_en='Boiled chicken (C01) 100 g
Fried chicken (C02) 100 g
Chicken rice (R02) 1 cup
Chicken rice sauce (S01) 1 small cup
Sweet chicken sauce (S02) 1 small cup
Chicken stock (ST01) 1 cup
Coriander
Cucumber 3–4 pcs', ingredients_my='ကြက်ပြုတ် (C01) 100 ဂရမ်
ကြက်ကြော် (C02) 100 ဂရမ်
ကြက်ဆီထမင်း (R02) 1 ခွက်
ကြက်သားထမင်းဆော့စ် (S01) 1 ခွက်ငယ်
ကြက်ကြော်အချဉ်ရည် (S02) 1 ခွက်ငယ်
ကြက်ပြုတ်ရည် (ST01) 1 ခွက်
နံနံပင်
သခွားသီး 3–4 စိတ်' where code='CR03';
insert into public.recipe_lines (menu_id,item_id,qty) select id,'17c08134-cc79-45f8-8e10-743e4ede44fb',0.1 from public.menus where code='CR03' on conflict (menu_id,item_id) do update set qty=excluded.qty;
commit;
