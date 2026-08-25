# TB-Referal Loyihasi Roadmap

Ushbu roadmap **TB-Referal** tizimini bosqichma-bosqich, xatosiz va Agentic workflow (Cursor AI / Claude / Gemini) yordamida to'liq yaratish va test qilish uchun mo'ljallangan.

---

## 📌 Loyiha Arxitekturasi va Asosiy Qoidalar
* **Bot foydalanuvchilari:** Markaz o'quvchilari o'z shaxsiy referal havolasini oladi, taklif etilgan do'stlari holatini va har bir kurs bo'yicha tejalgan summa/chegirmalarini kuzatadi.
* **Chegirma hisoblash qoidasi:** Har bir faol olib kelingan bola o'qiydigan kurs narxidan **5%** hisoblanadi va taklif qilgan talabaning to'lovidan ayirib beriladi.
* **Qayta hisoblash:** Har oy do'stlarning faollik holati (`active` / `left`) asosida oylik chegirma qayta hisoblanadi.
* **Admin nazorati:** O'quvchilarning haqiqatda darsga qatnashishi, kurslarga biriktirilishi va chegirmalar faollashuvi to'liq admin panel orqali tasdiqlanadi.

---

## 🛠 Texnologik Stek
* **Database:** Supabase (PostgreSQL)
* **Telegram Bot & Backend:** Node.js (Grammy / Telegraf + Express)
* **Admin Panel:** React + Vite + Tailwind CSS / shadcn/ui
* **Hosting:** Vercel (Frontend & Serverless Functions) / Railway

---

## 🚀 1-bosqich: Ma'lumotlar Bazasi va Arxitektura (Supabase)

Tizimning poydevori bo'lgan SQL sxema, aloqador jadvallar va hisob-kitob funksiyalarini qurish.

### 📋 Vazifalar:
- [ ] Supabase loyihasini yaratish va loyiha kalitlarini olish (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`).
- [ ] Quyidagi 4 ta asosiy jadvalni yaratish:
  - `courses` (id, title, price, created_at)
  - `students` (id, telegram_id, full_name, phone, referral_code, created_at)
  - `student_courses` (id, student_id, course_id, created_at)
  - `referrals` (id, inviter_id, referee_id, course_id, status ['pending', 'active', 'left'], created_at, updated_at)
- [ ] SQL darajasida avtomatik hisob-kitob funksiyasini (`get_student_billing_summary`) yaratish.
- [ ] Indekslar va kerakli cheklovlarni (Unique constraint va Foreign Key) o'rnatish.

### 🧪 Test qilish (Testing):
1. **Mock Data kiritish:** SQL Editor orqali 2 ta test kursi (Frontend: 500 000, Ingliz tili: 300 000) kiritish.
2. **Referal zanjiri:** 2 ta talaba yaratib, birini ikkinchisiga referal sifatida bog'lash (`status = 'active'`).
3. **Hisoblash testi:** `SELECT get_student_billing_summary('<telegram_id>');` chaqirib, `total_discount`, `final_fee` va faol do'stlar soni to'g'ri qaytayotganini tekshirish.

---

## ⚙️ 2-bosqich: Backend API va Telegram Bot (Node.js)

Telegram botning muloqot mantig'i va admin panel bilan aloqa qiluvchi REST API qatlamini yaratish.

### 📋 Vazifalar:
- [ ] Node.js loyihasini sozlash (`grammy` / `telegraf`, `@supabase/supabase-js`, `dotenv`, `cors`).
- [ ] Telegram bot buyruqlari va interfeysi:
  - `/start` va `/start ref_<code_yoki_id>` — yangi foydalanuvchini bazaga qo'shish yoki mavjudini aniqlash.
  - 👤 **Mening hisobim (Kabinet)** — har bir kurs narxi, berilgan chegirmalar summasi va to'lanadigan yakuniy summani chiqarish.
  - 🔗 **Referal havolam** — shaxsiy taklif linkini va ulashish uchun qulay matnni shakllantirish.
  - 👥 **Mening takliflarim** — taklif qilingan bolalar ro'yxati va ularning joriy holati (`active`, `pending`, `left`).
  - ❓ **Qoidalar** — chegirma tizimi va oylik hisob-kitob qoidalari bo'yicha yo'riqnoma.
- [ ] Admin panel uchun API marshrutlari:
  - `GET /api/students` — talabalar va ularning referallari ro'yxati.
  - `POST /api/courses` — yangi kurs qo'shish va narx belgilash.
  - `PATCH /api/referrals/:id` — statusni (`active` / `left`) o'zgartirish va talabaga bot orqali xabar yuborish.

### 🧪 Test qilish (Testing):
1. Telegram orqali botga `/start` bosib ro'yxatdan o'tish va DB ga yangi qator tushganini tekshirish.
2. Botda shaxsiy link to'g'ri generatsiya bo'lishini va boshqa akkaunt orqali kirganda `pending` holatida saqlanishini tekshirish.
3. Postman/curl orqali barcha REST endpointlarga so'rov yuborib ko'rish.

---

## 💻 3-bosqich: Admin Panel (React + Vite + Tailwind CSS)

Markaz ma'murlari uchun o'quvchilarni, kurslarni va referal chegirmalarini boshqarish paneli.

### 📋 Vazifalar:
- [ ] React + Vite + Tailwind CSS loyihasini ko'tarish.
- [ ] **Kurslar bo'limi:**
  - Kurslar ro'yxati jadvali.
  - Yangi kurs qo'shish / narxini tahrirlash modal oynasi.
- [ ] **O'quvchilar va Referallar bo'limi:**
  - O'quvchilar ro'yxati (Ism, telefon, o'qiyotgan kursi, taklif qilgan shaxs).
  - Qidiruv tizimi (Ism va telefon raqami bo'yicha filter).
  - Status almashtirish tugmalari (`pending` -> `active` -> `left`).
  - Kursga biriktirish funksiyasi.

### 🧪 Test qilish (Testing):
1. Yangi kurs kiritib, jadvalda to'g'ri aks etishini ko'rish.
2. Yangi o'quvchini admin paneldan topib, kursga biriktirish va uning statusini `active` ga o'zgartirish.
3. Ma'lumot bazada va botda darhol yangilanishini tekshirish.

---

## 🔔 4-bosqich: Integratsiya va Real-Time Notifikatsiyalar

Bot, backend va admin panel o'rtasidagi to'liq xabarnomalar zanjirini ulash.

### 📋 Vazifalar:
- [ ] Status o'zgarganda bot orqali avtomatik xabar jo'natish:
  - *"Do'stingiz [Ism] o'qishga qabul qilindi! Keyingi oydan chegirmangiz oshdi."*
  - *"Do'stingiz [Ism] o'qishni to'xtatdi. Keyingi oydan chegirmangiz kamaydi."*
- [ ] Edge-case va chegaralarni himoyalash:
  - Chegirma umumiy to'lovdan oshib ketmasligi (`GREATEST(0, ...)`).
  - Mavjud bo'lmagan referal kod bilan start bosilganda to'g'ri ishlash.

### 🧪 Test qilish (End-to-End Testing):
1. **Talaba A** botdan referal havola oladi.
2. **Talaba B** havola orqali botga kiradi.
3. **Admin** Talaba B ni `Ingliz tili (300 000)` kursiga biriktiradi va `active` qiladi.
4. **Talaba A** botidan tabrik xabari keladi va uning hisobida 15 000 so'm chegirma ko'rinadi.
5. **Admin** Talaba B ni `left` qiladi -> Talaba A ga xabarnoma boradi va chegirma 0 ga tushadi.

---

## 🌐 5-bosqich: Deploy va Production Sozlamalari

Loyihani serverga joylash va doimiy ishlashini ta'minlash.

### 📋 Vazifalar:
- [ ] Admin panelni Vercel ga deploy qilish.
- [ ] Node.js backend va botni Vercel Serverless (Webhook) yoki Railway ga deploy qilish.
- [ ] Telegram Bot uchun Webhook URL manzilini sozlash (`setWebhook`).
- [ ] Muhit o'zgaruvchilarini (`.env`) production uchun xavfsiz sozlash.

### 🧪 Test qilish (Testing):
1. Jonli veb-sayt va botning tezligi va uzluksizligini tekshirish.
2. Webhook orqali xabarlar kechikmasdan kelayotganini sinash.