-- นำเข้ารายการจากแท็บ Stock_New ใน Google Sheet "สต๊อก Tap&Tale" (22 พ.ย. 2569)
-- รันครั้งเดียวใน SQL editor หลัง migration 0005; ข้ามรายการที่มีชื่อไทยซ้ำอยู่แล้ว
begin;
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'มันไก่','Chicken Fat',null,'food','กรัม',1200.0,null,'ในครัว_ตู้เย็น',10
  where not exists (select 1 from public.items where name_th = 'มันไก่');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'มันเนื้อ','Beef Fat',null,'food','กรัม',1000.0,null,'ในครัว_ตู้เย็น',20
  where not exists (select 1 from public.items where name_th = 'มันเนื้อ');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ขิงแก่ ใหญ่ 1 กก.','Ginger',null,'food','กรัม',500.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ตู้เย็น',30
  where not exists (select 1 from public.items where name_th = 'ขิงแก่ ใหญ่ 1 กก.');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'พริกแดง','Red Chili',null,'food','กรัม',1000.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ตู้เย็น',40
  where not exists (select 1 from public.items where name_th = 'พริกแดง');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ต้นหอม','Spring Onion',null,'food','กรัม',800.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ตู้เย็น',50
  where not exists (select 1 from public.items where name_th = 'ต้นหอม');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ไข่ไก่ เบอร์ 1 มีฝา 30 ฟอง','Egg',null,'food','ฟอง',10.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ตู้เย็น',60
  where not exists (select 1 from public.items where name_th = 'เอโร่ ไข่ไก่ เบอร์ 1 มีฝา 30 ฟอง');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ไข่ไก่ เบอร์ 1 มีฝา 30 ฟอง' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ไข่ไก่ เบอร์ 1 มีฝา 30 ฟอง' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ผักชี','Coriander',null,'food','กรัม',100.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ตู้เย็น',70
  where not exists (select 1 from public.items where name_th = 'ผักชี');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'รากผักชี','Coriander root',null,'food','กรัม',100.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ตู้เย็น',80
  where not exists (select 1 from public.items where name_th = 'รากผักชี');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'แตงกวา','Cucumber',null,'food','กรัม',1200.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ตู้เย็น',90
  where not exists (select 1 from public.items where name_th = 'แตงกวา');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ เอ็นไก่ทอด 800 ก.','Chicken Tendon',null,'food','ถุง (100g)',12.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ช่องฟรีส',100
  where not exists (select 1 from public.items where name_th = 'เอโร่ เอ็นไก่ทอด 800 ก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ เอ็นไก่ทอด 800 ก.' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ เอ็นไก่ทอด 800 ก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เซพแพ็ค เฟรนช์ฟรายส์แช่แข็ง ขนาด 10 มม. เส้นตรง 2 กก.','French Fries',null,'food','ถุง (170g)',12.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ช่องฟรีส',110
  where not exists (select 1 from public.items where name_th = 'เซพแพ็ค เฟรนช์ฟรายส์แช่แข็ง ขนาด 10 มม. เส้นตรง 2 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เซพแพ็ค เฟรนช์ฟรายส์แช่แข็ง ขนาด 10 มม. เส้นตรง 2 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เซพแพ็ค เฟรนช์ฟรายส์แช่แข็ง ขนาด 10 มม. เส้นตรง 2 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ไก่ทอดคาราเกะแช่แข็ง 1 กก.','Karaage',null,'food','ถุง (5 ชิ้น)',12.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ช่องฟรีส',120
  where not exists (select 1 from public.items where name_th = 'เอโร่ ไก่ทอดคาราเกะแช่แข็ง 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ไก่ทอดคาราเกะแช่แข็ง 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ไก่ทอดคาราเกะแช่แข็ง 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ใบกะเพรา','Basil leaf',null,'food','ก้อน',10.0,(select id from public.suppliers where name = 'ตลาด'),'ในครัว_ช่องฟรีส',130
  where not exists (select 1 from public.items where name_th = 'ใบกะเพรา');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'มีนาฟู๊ดส์ เนื้อวัวบดแช่แข็ง 1 กก.','Minced Beef (Basil)',null,'food','ถุง (100g)',10.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ช่องฟรีส',140
  where not exists (select 1 from public.items where name_th = 'มีนาฟู๊ดส์ เนื้อวัวบดแช่แข็ง 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'มีนาฟู๊ดส์ เนื้อวัวบดแช่แข็ง 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'มีนาฟู๊ดส์ เนื้อวัวบดแช่แข็ง 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เนื้อร่องซี่โครง 5 กก.','Beef belly',null,'food','กก.',3000.0,null,'ในครัว_ช่องฟรีส',150
  where not exists (select 1 from public.items where name_th = 'เนื้อร่องซี่โครง 5 กก.');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'กระเทียมไทยแกะกลีบ 1 กก','Garlic',null,'food','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',160
  where not exists (select 1 from public.items where name_th = 'กระเทียมไทยแกะกลีบ 1 กก');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'กระเทียมไทยแกะกลีบ 1 กก' from public.items i, public.suppliers s
  where i.name_th = 'กระเทียมไทยแกะกลีบ 1 กก' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'กระเทียมเจียวชนิดแผ่น','Fried Garlic Slice',null,'food','กรัม',1.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',170
  where not exists (select 1 from public.items where name_th = 'กระเทียมเจียวชนิดแผ่น');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'กระเทียมเจียวชนิดแผ่น' from public.items i, public.suppliers s
  where i.name_th = 'กระเทียมเจียวชนิดแผ่น' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ภูเขาทอง น้ำส้มสายชูกลั่น 5 ล','Vinegar',null,'food','กก.',1000.0,null,'ในครัว_ชั้นวาง',180
  where not exists (select 1 from public.items where name_th = 'ภูเขาทอง น้ำส้มสายชูกลั่น 5 ล');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'โบนัส น้ำมันปาล์ม ปี๊บ 18 ล','Palm Oil (Bonus Brand)',null,'food','กก.',18.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',190
  where not exists (select 1 from public.items where name_th = 'โบนัส น้ำมันปาล์ม ปี๊บ 18 ล');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'โบนัส น้ำมันปาล์ม ปี๊บ 18 ล' from public.items i, public.suppliers s
  where i.name_th = 'โบนัส น้ำมันปาล์ม ปี๊บ 18 ล' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ฟ้าไทย ผงปรุงรส รสไก่ 165 ก. x 36','Chicken Seasoning Powder (Fa Thai)',null,'food','ซอง',15.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',200
  where not exists (select 1 from public.items where name_th = 'ฟ้าไทย ผงปรุงรส รสไก่ 165 ก. x 36');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ฟ้าไทย ผงปรุงรส รสไก่ 165 ก. x 36' from public.items i, public.suppliers s
  where i.name_th = 'ฟ้าไทย ผงปรุงรส รสไก่ 165 ก. x 36' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'คนอร์ ซุปรสเนื้อก้อน 20 ก. 24 ชิ้น','Beef Soup Cube (Knorr)',null,'food','กล่องเล็ก',5.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',210
  where not exists (select 1 from public.items where name_th = 'คนอร์ ซุปรสเนื้อก้อน 20 ก. 24 ชิ้น');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'คนอร์ ซุปรสเนื้อก้อน 20 ก. 24 ชิ้น' from public.items i, public.suppliers s
  where i.name_th = 'คนอร์ ซุปรสเนื้อก้อน 20 ก. 24 ชิ้น' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'แม่ประนอม น้ำจิ้มไก่ 5 กก.','Chicken Dipping Sauce (Mar Pranom)',null,'food','กก.',1200.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',220
  where not exists (select 1 from public.items where name_th = 'แม่ประนอม น้ำจิ้มไก่ 5 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'แม่ประนอม น้ำจิ้มไก่ 5 กก.' from public.items i, public.suppliers s
  where i.name_th = 'แม่ประนอม น้ำจิ้มไก่ 5 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ง่วงเชียง ซีอิ้วหวาน 2.7 กก.(ขวด)','Sweet Soy Sauce (Nguan Chiang)',null,'food','ขวด',1000.0,(select id from public.suppliers where name = 'Makro'),'ในครัว_ชั้นวาง',230
  where not exists (select 1 from public.items where name_th = 'ง่วงเชียง ซีอิ้วหวาน 2.7 กก.(ขวด)');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ง่วงเชียง ซีอิ้วหวาน 2.7 กก.(ขวด)' from public.items i, public.suppliers s
  where i.name_th = 'ง่วงเชียง ซีอิ้วหวาน 2.7 กก.(ขวด)' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ สะโพกไก่ติดกระดูกแช่แข็ง 2 กก.','Chicken',null,'food','ถุง',10.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ตู้แช่',240
  where not exists (select 1 from public.items where name_th = 'เอโร่ สะโพกไก่ติดกระดูกแช่แข็ง 2 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ สะโพกไก่ติดกระดูกแช่แข็ง 2 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ สะโพกไก่ติดกระดูกแช่แข็ง 2 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'Picanha','Picanha',null,'food','ชิ้น',7.0,null,'ห้องเก็บของ_ตู้แช่',250
  where not exists (select 1 from public.items where name_th = 'Picanha');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เนื้อบด(เบอร์เกอร์)','Minced Beef (Burger)',null,'food','ชิ้น',10.0,null,'ห้องเก็บของ_ตู้แช่',260
  where not exists (select 1 from public.items where name_th = 'เนื้อบด(เบอร์เกอร์)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เบอร์เกอร์บัน (ชิ้น)','Burger Bun',null,'food','ชิ้น',10.0,null,'ห้องเก็บของ_ตู้แช่',270
  where not exists (select 1 from public.items where name_th = 'เบอร์เกอร์บัน (ชิ้น)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ กล่องอาหารพลาสติก พีพี สีดำ 750 มล. x 25','Food Box (1 compartment)',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',280
  where not exists (select 1 from public.items where name_th = 'เอโร่ กล่องอาหารพลาสติก พีพี สีดำ 750 มล. x 25');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ กล่องอาหารพลาสติก พีพี สีดำ 750 มล. x 25' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ กล่องอาหารพลาสติก พีพี สีดำ 750 มล. x 25' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ กล่องอาหาร 2 ช่อง พร้อมฝา พีพี ใส 750 มล. x 25','Food Box (2 Compartment)',null,'supply','แพ็ค',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',290
  where not exists (select 1 from public.items where name_th = 'เอโร่ กล่องอาหาร 2 ช่อง พร้อมฝา พีพี ใส 750 มล. x 25');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ กล่องอาหาร 2 ช่อง พร้อมฝา พีพี ใส 750 มล. x 25' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ กล่องอาหาร 2 ช่อง พร้อมฝา พีพี ใส 750 มล. x 25' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ถุงพลาสติก ร้อน-เย็น HD 6x9 นิ้ว 1 กก.','Heat/Cold Resistant Plastic Bags',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',300
  where not exists (select 1 from public.items where name_th = 'เอโร่ ถุงพลาสติก ร้อน-เย็น HD 6x9 นิ้ว 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ถุงพลาสติก ร้อน-เย็น HD 6x9 นิ้ว 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ถุงพลาสติก ร้อน-เย็น HD 6x9 นิ้ว 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ชุดช้อนส้อมกระดาษ ไม้จิ้ม พีเอส สีขาว 15 ซ.ม. 50ชุด','Cutlery Set',null,'supply','แพ็ค',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',310
  where not exists (select 1 from public.items where name_th = 'เอโร่ ชุดช้อนส้อมกระดาษ ไม้จิ้ม พีเอส สีขาว 15 ซ.ม. 50ชุด');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ชุดช้อนส้อมกระดาษ ไม้จิ้ม พีเอส สีขาว 15 ซ.ม. 50ชุด' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ชุดช้อนส้อมกระดาษ ไม้จิ้ม พีเอส สีขาว 15 ซ.ม. 50ชุด' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ถุงซิปใสใส่ซอส ขนาด 6x8 ซม. 700 ชิ้น 1แพ๊ค มี8ซอง','Zipper Bags for Sauce',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',320
  where not exists (select 1 from public.items where name_th = 'เอโร่ ถุงซิปใสใส่ซอส ขนาด 6x8 ซม. 700 ชิ้น 1แพ๊ค มี8ซอง');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ถุงซิปใสใส่ซอส ขนาด 6x8 ซม. 700 ชิ้น 1แพ๊ค มี8ซอง' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ถุงซิปใสใส่ซอส ขนาด 6x8 ซม. 700 ชิ้น 1แพ๊ค มี8ซอง' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ถุงหูหิ้ว PE 8x16 นิ้ว 1 กก','Carry Bags (8x16)',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',330
  where not exists (select 1 from public.items where name_th = 'เอโร่ ถุงหูหิ้ว PE 8x16 นิ้ว 1 กก');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ถุงหูหิ้ว PE 8x16 นิ้ว 1 กก' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ถุงหูหิ้ว PE 8x16 นิ้ว 1 กก' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ สเปรย์ปรับอากาศ กลิ่นคลีนแอนด์เฟรช 300 มล. x 3+1','Freshener Spray',null,'supply','ชิ้น',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',340
  where not exists (select 1 from public.items where name_th = 'เอโร่ สเปรย์ปรับอากาศ กลิ่นคลีนแอนด์เฟรช 300 มล. x 3+1');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ สเปรย์ปรับอากาศ กลิ่นคลีนแอนด์เฟรช 300 มล. x 3+1' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ สเปรย์ปรับอากาศ กลิ่นคลีนแอนด์เฟรช 300 มล. x 3+1' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เด็กสมบูรณ์ ซีอิ้วขาว สูตร 1 1ล.x3','Soy Sauce (Formula 1)',null,'food','ขวด',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',350
  where not exists (select 1 from public.items where name_th = 'เด็กสมบูรณ์ ซีอิ้วขาว สูตร 1 1ล.x3');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เด็กสมบูรณ์ ซีอิ้วขาว สูตร 1 1ล.x3' from public.items i, public.suppliers s
  where i.name_th = 'เด็กสมบูรณ์ ซีอิ้วขาว สูตร 1 1ล.x3' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'โรซ่า ซอสมะเขือเทศ 1 กก.','Tomato Ketchup',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',360
  where not exists (select 1 from public.items where name_th = 'โรซ่า ซอสมะเขือเทศ 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'โรซ่า ซอสมะเขือเทศ 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'โรซ่า ซอสมะเขือเทศ 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ซอสพริกศรีราชา 1 กก.','Chili Sauce (Sriracha)',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',370
  where not exists (select 1 from public.items where name_th = 'เอโร่ ซอสพริกศรีราชา 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ซอสพริกศรีราชา 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ซอสพริกศรีราชา 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เบสท์ฟู้ดส์ เรียล มายองเนส 1 กก.','Mayonnaise (Best Foods)',null,'food','ถุง',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',380
  where not exists (select 1 from public.items where name_th = 'เบสท์ฟู้ดส์ เรียล มายองเนส 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เบสท์ฟู้ดส์ เรียล มายองเนส 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เบสท์ฟู้ดส์ เรียล มายองเนส 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ศิริเรืองอำไพ เครื่องตุ๋นยาจีน 20 ก. 10 ซอง','Chinese Herbal Soup (For braised beef)',null,'food','แพ็ค',3.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',390
  where not exists (select 1 from public.items where name_th = 'ศิริเรืองอำไพ เครื่องตุ๋นยาจีน 20 ก. 10 ซอง');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ศิริเรืองอำไพ เครื่องตุ๋นยาจีน 20 ก. 10 ซอง' from public.items i, public.suppliers s
  where i.name_th = 'ศิริเรืองอำไพ เครื่องตุ๋นยาจีน 20 ก. 10 ซอง' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ยูเอฟเอ็ม แป้งทอดกรอบ 1 กก.','UFM Crispy Flour',null,'food','ถุง',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',400
  where not exists (select 1 from public.items where name_th = 'ยูเอฟเอ็ม แป้งทอดกรอบ 1 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ยูเอฟเอ็ม แป้งทอดกรอบ 1 กก.' from public.items i, public.suppliers s
  where i.name_th = 'ยูเอฟเอ็ม แป้งทอดกรอบ 1 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ปรุงทิพ เกลือ 5 กก.','Salt',null,'food','กก.',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',410
  where not exists (select 1 from public.items where name_th = 'ปรุงทิพ เกลือ 5 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ปรุงทิพ เกลือ 5 กก.' from public.items i, public.suppliers s
  where i.name_th = 'ปรุงทิพ เกลือ 5 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'นกเพนกวิน 3 ตัว ซอสหอยนางรม 2 กก.','Oyster Sauce (Penguin Brand)',null,'food','แกลลอน',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',420
  where not exists (select 1 from public.items where name_th = 'นกเพนกวิน 3 ตัว ซอสหอยนางรม 2 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'นกเพนกวิน 3 ตัว ซอสหอยนางรม 2 กก.' from public.items i, public.suppliers s
  where i.name_th = 'นกเพนกวิน 3 ตัว ซอสหอยนางรม 2 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ทองการ์เด้น ถั่วปากอ้าอบเกลือ 500 กรัม','Salted Broad Beans',null,'food','ถุง',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',430
  where not exists (select 1 from public.items where name_th = 'ทองการ์เด้น ถั่วปากอ้าอบเกลือ 500 กรัม');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ทองการ์เด้น ถั่วปากอ้าอบเกลือ 500 กรัม' from public.items i, public.suppliers s
  where i.name_th = 'ทองการ์เด้น ถั่วปากอ้าอบเกลือ 500 กรัม' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ทองการ์เด้น เม็ดมะม่วงหิมพานต์อบเกลือ 400 กรัม','Salted Cashew Nuts',null,'food','ถุง',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',440
  where not exists (select 1 from public.items where name_th = 'ทองการ์เด้น เม็ดมะม่วงหิมพานต์อบเกลือ 400 กรัม');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ทองการ์เด้น เม็ดมะม่วงหิมพานต์อบเกลือ 400 กรัม' from public.items i, public.suppliers s
  where i.name_th = 'ทองการ์เด้น เม็ดมะม่วงหิมพานต์อบเกลือ 400 กรัม' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ทองการ์เด้น ถั่วลิสงอบเกลือ 400 กรัม','Salted Peanuts',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',450
  where not exists (select 1 from public.items where name_th = 'ทองการ์เด้น ถั่วลิสงอบเกลือ 400 กรัม');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ทองการ์เด้น ถั่วลิสงอบเกลือ 400 กรัม' from public.items i, public.suppliers s
  where i.name_th = 'ทองการ์เด้น ถั่วลิสงอบเกลือ 400 กรัม' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'แม็กกาแรต ผงเบคกิ้งโซดา 300 ก','Baking Soda (McGarrett)',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',460
  where not exists (select 1 from public.items where name_th = 'แม็กกาแรต ผงเบคกิ้งโซดา 300 ก');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'แม็กกาแรต ผงเบคกิ้งโซดา 300 ก' from public.items i, public.suppliers s
  where i.name_th = 'แม็กกาแรต ผงเบคกิ้งโซดา 300 ก' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'มิตรผล น้ำตาลทรายบริสุทธิ์ 1 กก. x 5','Sugar (Mitr Phol)',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',470
  where not exists (select 1 from public.items where name_th = 'มิตรผล น้ำตาลทรายบริสุทธิ์ 1 กก. x 5');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'มิตรผล น้ำตาลทรายบริสุทธิ์ 1 กก. x 5' from public.items i, public.suppliers s
  where i.name_th = 'มิตรผล น้ำตาลทรายบริสุทธิ์ 1 กก. x 5' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เด็กอ้วน เต้าเจี้ยวบด สูตร 1 2 กก.','Soybean Paste (Mo-Im-Si)',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',480
  where not exists (select 1 from public.items where name_th = 'เด็กอ้วน เต้าเจี้ยวบด สูตร 1 2 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เด็กอ้วน เต้าเจี้ยวบด สูตร 1 2 กก.' from public.items i, public.suppliers s
  where i.name_th = 'เด็กอ้วน เต้าเจี้ยวบด สูตร 1 2 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'น้ำตาลเหลว ตรากุหลาบแดง 1 กก','Liquid Sugar (Red Rose)',null,'food','ถุง',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',490
  where not exists (select 1 from public.items where name_th = 'น้ำตาลเหลว ตรากุหลาบแดง 1 กก');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'น้ำตาลเหลว ตรากุหลาบแดง 1 กก' from public.items i, public.suppliers s
  where i.name_th = 'น้ำตาลเหลว ตรากุหลาบแดง 1 กก' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ตราฉัตร ข้าวหอมมะลิใหม่ 100% 5 กก.','Jasmine Rice',null,'food','ถุง',2.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',500
  where not exists (select 1 from public.items where name_th = 'ตราฉัตร ข้าวหอมมะลิใหม่ 100% 5 กก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ตราฉัตร ข้าวหอมมะลิใหม่ 100% 5 กก.' from public.items i, public.suppliers s
  where i.name_th = 'ตราฉัตร ข้าวหอมมะลิใหม่ 100% 5 กก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ซันไลต์ น้ำยาล้างจาน เลมอนเทอร์โบ 3.2 ล.','Dishwashing Liquid (Sunlight)',null,'supply','ขวด',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',510
  where not exists (select 1 from public.items where name_th = 'ซันไลต์ น้ำยาล้างจาน เลมอนเทอร์โบ 3.2 ล.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ซันไลต์ น้ำยาล้างจาน เลมอนเทอร์โบ 3.2 ล.' from public.items i, public.suppliers s
  where i.name_th = 'ซันไลต์ น้ำยาล้างจาน เลมอนเทอร์โบ 3.2 ล.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'มาจิคลีน น้ำยาถูพื้น กลิ่นลาเวนเดอร์ 5 ล.','Floor Cleaner (Magiclean)',null,'supply','ขวด',0.5,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',520
  where not exists (select 1 from public.items where name_th = 'มาจิคลีน น้ำยาถูพื้น กลิ่นลาเวนเดอร์ 5 ล.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'มาจิคลีน น้ำยาถูพื้น กลิ่นลาเวนเดอร์ 5 ล.' from public.items i, public.suppliers s
  where i.name_th = 'มาจิคลีน น้ำยาถูพื้น กลิ่นลาเวนเดอร์ 5 ล.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'คิเรอิ คิเรอิ โฟมล้างมือ ชนิดถุงเติม 200 มล. x 3','Hand Soap (kirei)',null,'supply','ถุง',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',530
  where not exists (select 1 from public.items where name_th = 'คิเรอิ คิเรอิ โฟมล้างมือ ชนิดถุงเติม 200 มล. x 3');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'คิเรอิ คิเรอิ โฟมล้างมือ ชนิดถุงเติม 200 มล. x 3' from public.items i, public.suppliers s
  where i.name_th = 'คิเรอิ คิเรอิ โฟมล้างมือ ชนิดถุงเติม 200 มล. x 3' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'แม๊กซ์โม่ กระดาษอเนกประสงค์ บิ๊กโรล 6+2','Multi-purpose Paper Towels',null,'supply','ม้วน',8.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',540
  where not exists (select 1 from public.items where name_th = 'แม๊กซ์โม่ กระดาษอเนกประสงค์ บิ๊กโรล 6+2');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'แม๊กซ์โม่ กระดาษอเนกประสงค์ บิ๊กโรล 6+2' from public.items i, public.suppliers s
  where i.name_th = 'แม๊กซ์โม่ กระดาษอเนกประสงค์ บิ๊กโรล 6+2' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ กระดาษเช็ดปาก 20x30 ซม. 500 แผ่น','Napkin tissue Aro Brand',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',550
  where not exists (select 1 from public.items where name_th = 'เอโร่ กระดาษเช็ดปาก 20x30 ซม. 500 แผ่น');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ กระดาษเช็ดปาก 20x30 ซม. 500 แผ่น' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ กระดาษเช็ดปาก 20x30 ซม. 500 แผ่น' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'savepak กระดาษเช็ดมือ 250 แผ่น 1แพ๊ค4ชิ้น','Paper Hand Towels',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',560
  where not exists (select 1 from public.items where name_th = 'savepak กระดาษเช็ดมือ 250 แผ่น 1แพ๊ค4ชิ้น');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'savepak กระดาษเช็ดมือ 250 แผ่น 1แพ๊ค4ชิ้น' from public.items i, public.suppliers s
  where i.name_th = 'savepak กระดาษเช็ดมือ 250 แผ่น 1แพ๊ค4ชิ้น' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ฮีโร่ ถุงขยะม้วนดำ รุ่นรักษ์โลก 24x28 นิ้ว 50 ถุง','Garbage Bags  (24x28)',null,'supply','ม้วน',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',570
  where not exists (select 1 from public.items where name_th = 'ฮีโร่ ถุงขยะม้วนดำ รุ่นรักษ์โลก 24x28 นิ้ว 50 ถุง');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ฮีโร่ ถุงขยะม้วนดำ รุ่นรักษ์โลก 24x28 นิ้ว 50 ถุง' from public.items i, public.suppliers s
  where i.name_th = 'ฮีโร่ ถุงขยะม้วนดำ รุ่นรักษ์โลก 24x28 นิ้ว 50 ถุง' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ฮีโร่ ถุงขยะม้วนสีดำ รุ่นรักษ์โลก 18x20 นิ้ว 100 ถุง','Garbage Bags (18x20)',null,'supply','ม้วน',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',580
  where not exists (select 1 from public.items where name_th = 'ฮีโร่ ถุงขยะม้วนสีดำ รุ่นรักษ์โลก 18x20 นิ้ว 100 ถุง');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ฮีโร่ ถุงขยะม้วนสีดำ รุ่นรักษ์โลก 18x20 นิ้ว 100 ถุง' from public.items i, public.suppliers s
  where i.name_th = 'ฮีโร่ ถุงขยะม้วนสีดำ รุ่นรักษ์โลก 18x20 นิ้ว 100 ถุง' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เอโร่ ชุดชามไมโครเวฟพร้อมฝา 350 มล. x 25','Microwave-Safe Bowl',null,'supply','แพ็ค',1.0,(select id from public.suppliers where name = 'Makro'),'ห้องเก็บของ_ชั้นวางของ',590
  where not exists (select 1 from public.items where name_th = 'เอโร่ ชุดชามไมโครเวฟพร้อมฝา 350 มล. x 25');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'เอโร่ ชุดชามไมโครเวฟพร้อมฝา 350 มล. x 25' from public.items i, public.suppliers s
  where i.name_th = 'เอโร่ ชุดชามไมโครเวฟพร้อมฝา 350 มล. x 25' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เมล็ดกาแฟ (ถุงซีล 18G)','Coffee beans(18g sealed bag)',null,'food','ซอง',10.0,null,'บาร์น้ำ_ตู้เย็น',600
  where not exists (select 1 from public.items where name_th = 'เมล็ดกาแฟ (ถุงซีล 18G)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ผงชาเขียว (กระปุกไม่รวมฝา 110g)','Green tea powder',null,'food','กรัม',60.0,null,'บาร์น้ำ_ตู้เย็น',610
  where not exists (select 1 from public.items where name_th = 'ผงชาเขียว (กระปุกไม่รวมฝา 110g)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ซอสโกโก้ (ขวดบีบ)','Cocoa sauce (squeeze bottle)',null,'food','กรัม',80.0,null,'บาร์น้ำ_ตู้เย็น',620
  where not exists (select 1 from public.items where name_th = 'ซอสโกโก้ (ขวดบีบ)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เบสชาไทย (ขวดบีบ)','Thai tea base(squeeze bottle)',null,'food','กรัม',160.0,null,'บาร์น้ำ_ตู้เย็น',630
  where not exists (select 1 from public.items where name_th = 'เบสชาไทย (ขวดบีบ)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'นมผสม (ขวดบีบ)','Mixed milk(squeeze bottle)',null,'food','กรัม',50.0,null,'บาร์น้ำ_ตู้เย็น',640
  where not exists (select 1 from public.items where name_th = 'นมผสม (ขวดบีบ)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'นมสด (แกลลอน)','Fresh milk',null,'food','กรัม',500.0,null,'บาร์น้ำ_ตู้เย็น',650
  where not exists (select 1 from public.items where name_th = 'นมสด (แกลลอน)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'น้ำเชื่อม (ขวดบีบ)','Syrup',null,'food','กรัม',30.0,null,'บาร์น้ำ_ตู้เย็น',660
  where not exists (select 1 from public.items where name_th = 'น้ำเชื่อม (ขวดบีบ)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'เมล็ดกาแฟ (1KG)','Coffee beans (1kg)',null,'food','ถุง',1.0,null,'บาร์น้ำ_ของแห้ง',670
  where not exists (select 1 from public.items where name_th = 'เมล็ดกาแฟ (1KG)');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'โกโก้ ดัทช์ 450กรัม','Cocoa powder',null,'food','กรัม',150.0,(select id from public.suppliers where name = 'Makro'),'บาร์น้ำ_ของแห้ง',680
  where not exists (select 1 from public.items where name_th = 'โกโก้ ดัทช์ 450กรัม');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'โกโก้ ดัทช์ 450กรัม' from public.items i, public.suppliers s
  where i.name_th = 'โกโก้ ดัทช์ 450กรัม' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ชาตรามือ ชาผงปรุงสำเร็จ ฉลากแดง 400ก.','Thai tea powder,red bag',null,'food','กรัม',150.0,(select id from public.suppliers where name = 'Makro'),'บาร์น้ำ_ของแห้ง',690
  where not exists (select 1 from public.items where name_th = 'ชาตรามือ ชาผงปรุงสำเร็จ ฉลากแดง 400ก.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ชาตรามือ ชาผงปรุงสำเร็จ ฉลากแดง 400ก.' from public.items i, public.suppliers s
  where i.name_th = 'ชาตรามือ ชาผงปรุงสำเร็จ ฉลากแดง 400ก.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ชาตรามือ ชาไทยสูตรเอ็กซ์ตร้าโกล ชนิดถุง400กรัม','Thai tea powder,golden bag',null,'food','กรัม',150.0,(select id from public.suppliers where name = 'Makro'),'บาร์น้ำ_ของแห้ง',700
  where not exists (select 1 from public.items where name_th = 'ชาตรามือ ชาไทยสูตรเอ็กซ์ตร้าโกล ชนิดถุง400กรัม');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'ชาตรามือ ชาไทยสูตรเอ็กซ์ตร้าโกล ชนิดถุง400กรัม' from public.items i, public.suppliers s
  where i.name_th = 'ชาตรามือ ชาไทยสูตรเอ็กซ์ตร้าโกล ชนิดถุง400กรัม' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'น้ำแดง','Hale''s blue boy / count as a unpack bottle',null,'food','ขวด',1.0,(select id from public.suppliers where name = 'Makro'),'บาร์น้ำ_ของแห้ง',710
  where not exists (select 1 from public.items where name_th = 'น้ำแดง');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'น้ำแดง' from public.items i, public.suppliers s
  where i.name_th = 'น้ำแดง' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'แก้ว','glass',null,'supply','แถว',4.0,null,'บาร์น้ำ_บรรจุภัณฑ์',720
  where not exists (select 1 from public.items where name_th = 'แก้ว');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ฝา',null,'အဖုံး','supply','แถว',4.0,null,'บาร์น้ำ_บรรจุภัณฑ์',730
  where not exists (select 1 from public.items where name_th = 'ฝา');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'หลอดงอสีน้ำตาลหุ้มฟิล์มใส 8มม ยาว 24 ซ.ม.',null,'ပိုက်','supply','แพ็ค',80.0,(select id from public.suppliers where name = 'Makro'),'บาร์น้ำ_บรรจุภัณฑ์',740
  where not exists (select 1 from public.items where name_th = 'หลอดงอสีน้ำตาลหุ้มฟิล์มใส 8มม ยาว 24 ซ.ม.');
insert into public.supplier_products (item_id,supplier_id,product_name)
  select i.id,s.id,'หลอดงอสีน้ำตาลหุ้มฟิล์มใส 8มม ยาว 24 ซ.ม.' from public.items i, public.suppliers s
  where i.name_th = 'หลอดงอสีน้ำตาลหุ้มฟิล์มใส 8มม ยาว 24 ซ.ม.' and s.name = 'Makro'
    and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ถุงน้ำแข็ง','Ice bag',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',750
  where not exists (select 1 from public.items where name_th = 'ถุงน้ำแข็ง');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'กระดาษปิดแก้ว','glass cover paper',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',760
  where not exists (select 1 from public.items where name_th = 'กระดาษปิดแก้ว');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ถุุงหิ้ว','carrying bag',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',770
  where not exists (select 1 from public.items where name_th = 'ถุุงหิ้ว');
insert into public.items (name_th,name_en,name_my,category,count_unit,safety_stock,default_supplier_id,location,sort_order)
  select 'ถุงซีลกาแฟ','Coffee seal bag',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',780
  where not exists (select 1 from public.items where name_th = 'ถุงซีลกาแฟ');
commit;
select count(*) as items_total, count(*) filter (where location is not null) as with_location from public.items;
