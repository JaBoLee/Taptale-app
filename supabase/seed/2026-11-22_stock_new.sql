-- นำเข้ารายการจากแท็บ Stock_New ใน Google Sheet "สต๊อก Tap&Tale" (22 พ.ย. 2569)
-- รันครั้งเดียวใน SQL editor หลัง migration 0005; รันซ้ำได้ (ข้ามชื่อไทยที่มีอยู่แล้ว)
-- รายการจาก Makro: ชื่อในชีตคือชื่อสินค้าใน Makro จึงใส่เป็น supplier_products ด้วย
begin;
create temp table _new (name_th text, name_en text, name_my text, category text, count_unit text,
  safety_stock numeric, supplier text, location text, sort_order int) on commit drop;
insert into _new values
  ('มันไก่','Chicken Fat',null,'food','กรัม',1200.0,null,'ในครัว_ตู้เย็น',10),
  ('มันเนื้อ','Beef Fat',null,'food','กรัม',1000.0,null,'ในครัว_ตู้เย็น',20),
  ('ขิงแก่ ใหญ่ 1 กก.','Ginger',null,'food','กรัม',500.0,'ตลาด','ในครัว_ตู้เย็น',30),
  ('พริกแดง','Red Chili',null,'food','กรัม',1000.0,'ตลาด','ในครัว_ตู้เย็น',40),
  ('ต้นหอม','Spring Onion',null,'food','กรัม',800.0,'ตลาด','ในครัว_ตู้เย็น',50),
  ('เอโร่ ไข่ไก่ เบอร์ 1 มีฝา 30 ฟอง','Egg',null,'food','ฟอง',10.0,'Makro','ในครัว_ตู้เย็น',60),
  ('ผักชี','Coriander',null,'food','กรัม',100.0,'ตลาด','ในครัว_ตู้เย็น',70),
  ('รากผักชี','Coriander root',null,'food','กรัม',100.0,'ตลาด','ในครัว_ตู้เย็น',80),
  ('แตงกวา','Cucumber',null,'food','กรัม',1200.0,'ตลาด','ในครัว_ตู้เย็น',90),
  ('เอโร่ เอ็นไก่ทอด 800 ก.','Chicken Tendon',null,'food','ถุง (100g)',12.0,'Makro','ในครัว_ช่องฟรีส',100),
  ('เซพแพ็ค เฟรนช์ฟรายส์แช่แข็ง ขนาด 10 มม. เส้นตรง 2 กก.','French Fries',null,'food','ถุง (170g)',12.0,'Makro','ในครัว_ช่องฟรีส',110),
  ('เอโร่ ไก่ทอดคาราเกะแช่แข็ง 1 กก.','Karaage',null,'food','ถุง (5 ชิ้น)',12.0,'Makro','ในครัว_ช่องฟรีส',120),
  ('ใบกะเพรา','Basil leaf',null,'food','ก้อน',10.0,'ตลาด','ในครัว_ช่องฟรีส',130),
  ('มีนาฟู๊ดส์ เนื้อวัวบดแช่แข็ง 1 กก.','Minced Beef (Basil)',null,'food','ถุง (100g)',10.0,'Makro','ในครัว_ช่องฟรีส',140),
  ('เนื้อร่องซี่โครง 5 กก.','Beef belly',null,'food','กรัม',3000.0,null,'ในครัว_ช่องฟรีส',150),
  ('กระเทียมไทยแกะกลีบ 1 กก','Garlic',null,'food','แพ็ค',1.0,'Makro','ในครัว_ชั้นวาง',160),
  ('กระเทียมเจียวชนิดแผ่น','Fried Garlic Slice',null,'food','กรัม',1.0,'Makro','ในครัว_ชั้นวาง',170),
  ('ภูเขาทอง น้ำส้มสายชูกลั่น 5 ล','Vinegar',null,'food','กรัม',1000.0,null,'ในครัว_ชั้นวาง',180),
  ('โบนัส น้ำมันปาล์ม ปี๊บ 18 ล','Palm Oil (Bonus Brand)',null,'food','กก.',18.0,'Makro','ในครัว_ชั้นวาง',190),
  ('ฟ้าไทย ผงปรุงรส รสไก่ 165 ก. x 36','Chicken Seasoning Powder (Fa Thai)',null,'food','ซอง',15.0,'Makro','ในครัว_ชั้นวาง',200),
  ('คนอร์ ซุปรสเนื้อก้อน 20 ก. 24 ชิ้น','Beef Soup Cube (Knorr)',null,'food','กล่องเล็ก',5.0,'Makro','ในครัว_ชั้นวาง',210),
  ('แม่ประนอม น้ำจิ้มไก่ 5 กก.','Chicken Dipping Sauce (Mar Pranom)',null,'food','กรัม',1200.0,'Makro','ในครัว_ชั้นวาง',220),
  ('ง่วงเชียง ซีอิ้วหวาน 2.7 กก.(ขวด)','Sweet Soy Sauce (Nguan Chiang)',null,'food','กรัม',1000.0,'Makro','ในครัว_ชั้นวาง',230),
  ('เอโร่ สะโพกไก่ติดกระดูกแช่แข็ง 2 กก.','Chicken',null,'food','ถุง',10.0,'Makro','ห้องเก็บของ_ตู้แช่',240),
  ('Picanha','Picanha',null,'food','ชิ้น',7.0,null,'ห้องเก็บของ_ตู้แช่',250),
  ('เนื้อบด(เบอร์เกอร์)','Minced Beef (Burger)',null,'food','ชิ้น',10.0,null,'ห้องเก็บของ_ตู้แช่',260),
  ('เบอร์เกอร์บัน (ชิ้น)','Burger Bun',null,'food','ชิ้น',10.0,null,'ห้องเก็บของ_ตู้แช่',270),
  ('เอโร่ กล่องอาหารพลาสติก พีพี สีดำ 750 มล. x 25','Food Box (1 compartment)',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',280),
  ('เอโร่ กล่องอาหาร 2 ช่อง พร้อมฝา พีพี ใส 750 มล. x 25','Food Box (2 Compartment)',null,'supply','แพ็ค',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',290),
  ('เอโร่ ถุงพลาสติก ร้อน-เย็น HD 6x9 นิ้ว 1 กก.','Heat/Cold Resistant Plastic Bags',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',300),
  ('เอโร่ ชุดช้อนส้อมกระดาษ ไม้จิ้ม พีเอส สีขาว 15 ซ.ม. 50ชุด','Cutlery Set',null,'supply','แพ็ค',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',310),
  ('เอโร่ ถุงซิปใสใส่ซอส ขนาด 6x8 ซม. 700 ชิ้น 1แพ๊ค มี8ซอง','Zipper Bags for Sauce',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',320),
  ('เอโร่ ถุงหูหิ้ว PE 8x16 นิ้ว 1 กก','Carry Bags (8x16)',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',330),
  ('เอโร่ สเปรย์ปรับอากาศ กลิ่นคลีนแอนด์เฟรช 300 มล. x 3+1','Freshener Spray',null,'supply','ชิ้น',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',340),
  ('เด็กสมบูรณ์ ซีอิ้วขาว สูตร 1 1ล.x3','Soy Sauce (Formula 1)',null,'food','ขวด',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',350),
  ('โรซ่า ซอสมะเขือเทศ 1 กก.','Tomato Ketchup',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',360),
  ('เอโร่ ซอสพริกศรีราชา 1 กก.','Chili Sauce (Sriracha)',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',370),
  ('เบสท์ฟู้ดส์ เรียล มายองเนส 1 กก.','Mayonnaise (Best Foods)',null,'food','ถุง',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',380),
  ('ศิริเรืองอำไพ เครื่องตุ๋นยาจีน 20 ก. 10 ซอง','Chinese Herbal Soup (For braised beef)',null,'food','แพ็ค',3.0,'Makro','ห้องเก็บของ_ชั้นวางของ',390),
  ('ยูเอฟเอ็ม แป้งทอดกรอบ 1 กก.','UFM Crispy Flour',null,'food','ถุง',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',400),
  ('ปรุงทิพ เกลือ 5 กก.','Salt',null,'food','กก.',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',410),
  ('นกเพนกวิน 3 ตัว ซอสหอยนางรม 2 กก.','Oyster Sauce (Penguin Brand)',null,'food','แกลลอน',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',420),
  ('ทองการ์เด้น ถั่วปากอ้าอบเกลือ 500 กรัม','Salted Broad Beans',null,'food','ถุง',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',430),
  ('ทองการ์เด้น เม็ดมะม่วงหิมพานต์อบเกลือ 400 กรัม','Salted Cashew Nuts',null,'food','ถุง',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',440),
  ('ทองการ์เด้น ถั่วลิสงอบเกลือ 400 กรัม','Salted Peanuts',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',450),
  ('แม็กกาแรต ผงเบคกิ้งโซดา 300 ก','Baking Soda (McGarrett)',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',460),
  ('มิตรผล น้ำตาลทรายบริสุทธิ์ 1 กก. x 5','Sugar (Mitr Phol)',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',470),
  ('เด็กอ้วน เต้าเจี้ยวบด สูตร 1 2 กก.','Soybean Paste (Mo-Im-Si)',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',480),
  ('น้ำตาลเหลว ตรากุหลาบแดง 1 กก','Liquid Sugar (Red Rose)',null,'food','ถุง',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',490),
  ('ตราฉัตร ข้าวหอมมะลิใหม่ 100% 5 กก.','Jasmine Rice',null,'food','ถุง',2.0,'Makro','ห้องเก็บของ_ชั้นวางของ',500),
  ('ซันไลต์ น้ำยาล้างจาน เลมอนเทอร์โบ 3.2 ล.','Dishwashing Liquid (Sunlight)',null,'supply','ขวด',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',510),
  ('มาจิคลีน น้ำยาถูพื้น กลิ่นลาเวนเดอร์ 5 ล.','Floor Cleaner (Magiclean)',null,'supply','ขวด',0.5,'Makro','ห้องเก็บของ_ชั้นวางของ',520),
  ('คิเรอิ คิเรอิ โฟมล้างมือ ชนิดถุงเติม 200 มล. x 3','Hand Soap (kirei)',null,'supply','ถุง',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',530),
  ('แม๊กซ์โม่ กระดาษอเนกประสงค์ บิ๊กโรล 6+2','Multi-purpose Paper Towels',null,'supply','ม้วน',8.0,'Makro','ห้องเก็บของ_ชั้นวางของ',540),
  ('เอโร่ กระดาษเช็ดปาก 20x30 ซม. 500 แผ่น','Napkin tissue Aro Brand',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',550),
  ('savepak กระดาษเช็ดมือ 250 แผ่น 1แพ๊ค4ชิ้น','Paper Hand Towels',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',560),
  ('ฮีโร่ ถุงขยะม้วนดำ รุ่นรักษ์โลก 24x28 นิ้ว 50 ถุง','Garbage Bags  (24x28)',null,'supply','ม้วน',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',570),
  ('ฮีโร่ ถุงขยะม้วนสีดำ รุ่นรักษ์โลก 18x20 นิ้ว 100 ถุง','Garbage Bags (18x20)',null,'supply','ม้วน',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',580),
  ('เอโร่ ชุดชามไมโครเวฟพร้อมฝา 350 มล. x 25','Microwave-Safe Bowl',null,'supply','แพ็ค',1.0,'Makro','ห้องเก็บของ_ชั้นวางของ',590),
  ('เมล็ดกาแฟ (ถุงซีล 18G)','Coffee beans(18g sealed bag)',null,'food','ซอง',10.0,null,'บาร์น้ำ_ตู้เย็น',600),
  ('ผงชาเขียว (กระปุกไม่รวมฝา 110g)','Green tea powder',null,'food','กรัม',60.0,null,'บาร์น้ำ_ตู้เย็น',610),
  ('ซอสโกโก้ (ขวดบีบ)','Cocoa sauce (squeeze bottle)',null,'food','กรัม',80.0,null,'บาร์น้ำ_ตู้เย็น',620),
  ('เบสชาไทย (ขวดบีบ)','Thai tea base(squeeze bottle)',null,'food','กรัม',160.0,null,'บาร์น้ำ_ตู้เย็น',630),
  ('นมผสม (ขวดบีบ)','Mixed milk(squeeze bottle)',null,'food','กรัม',50.0,null,'บาร์น้ำ_ตู้เย็น',640),
  ('นมสด (แกลลอน)','Fresh milk',null,'food','กรัม',500.0,null,'บาร์น้ำ_ตู้เย็น',650),
  ('น้ำเชื่อม (ขวดบีบ)','Syrup',null,'food','กรัม',30.0,null,'บาร์น้ำ_ตู้เย็น',660),
  ('เมล็ดกาแฟ (1KG)','Coffee beans (1kg)',null,'food','ถุง',1.0,null,'บาร์น้ำ_ของแห้ง',670),
  ('โกโก้ ดัทช์ 450กรัม','Cocoa powder',null,'food','กรัม',150.0,'Makro','บาร์น้ำ_ของแห้ง',680),
  ('ชาตรามือ ชาผงปรุงสำเร็จ ฉลากแดง 400ก.','Thai tea powder,red bag',null,'food','กรัม',150.0,'Makro','บาร์น้ำ_ของแห้ง',690),
  ('ชาตรามือ ชาไทยสูตรเอ็กซ์ตร้าโกล ชนิดถุง400กรัม','Thai tea powder,golden bag',null,'food','กรัม',150.0,'Makro','บาร์น้ำ_ของแห้ง',700),
  ('น้ำแดง','Hale''s blue boy / count as a unpack bottle',null,'food','ขวด',1.0,'Makro','บาร์น้ำ_ของแห้ง',710),
  ('แก้ว','glass',null,'supply','แถว',4.0,null,'บาร์น้ำ_บรรจุภัณฑ์',720),
  ('ฝา',null,'အဖုံး','supply','แถว',4.0,null,'บาร์น้ำ_บรรจุภัณฑ์',730),
  ('หลอดงอสีน้ำตาลหุ้มฟิล์มใส 8มม ยาว 24 ซ.ม.',null,'ပိုက်','supply','แพ็ค',80.0,'Makro','บาร์น้ำ_บรรจุภัณฑ์',740),
  ('ถุงน้ำแข็ง','Ice bag',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',750),
  ('กระดาษปิดแก้ว','glass cover paper',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',760),
  ('ถุุงหิ้ว','carrying bag',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',770),
  ('ถุงซีลกาแฟ','Coffee seal bag',null,'supply','แพ็ค',1.0,null,'บาร์น้ำ_บรรจุภัณฑ์',780);

insert into public.items (name_th, name_en, name_my, category, count_unit, safety_stock, default_supplier_id, location, sort_order)
select n.name_th, n.name_en, n.name_my, n.category, n.count_unit, n.safety_stock, s.id, n.location, n.sort_order
from _new n left join public.suppliers s on s.name = n.supplier
where not exists (select 1 from public.items i where i.name_th = n.name_th);

insert into public.supplier_products (item_id, supplier_id, product_name)
select i.id, s.id, n.name_th
from _new n join public.items i on i.name_th = n.name_th join public.suppliers s on s.name = n.supplier
where n.supplier = 'Makro'
  and not exists (select 1 from public.supplier_products p where p.item_id = i.id and p.supplier_id = s.id);
commit;

select count(*) as items_total, count(*) filter (where location is not null) as with_location,
  (select count(*) from public.supplier_products) as supplier_products from public.items;
