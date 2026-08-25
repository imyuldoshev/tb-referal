-- TEST QILISH UCHUN MOCK MA'LUMOTLAR

-- 1. 2 ta kurs kiritish
INSERT INTO courses (title, price) VALUES
('Frontend', 500000),
('Ingliz tili', 300000);

-- 2. 2 ta talaba kiritish
-- Talaba A (Taklif qiluvchi)
INSERT INTO students (telegram_id, full_name, phone, referral_code) VALUES
(111111111, 'Ali', '+998901112233', 'REF_ALI');

-- Talaba B (Taklif qilingan do'sti)
INSERT INTO students (telegram_id, full_name, phone, referral_code) VALUES
(222222222, 'Vali', '+998904445566', 'REF_VALI');

-- Talabalarning UUID larini topib olish
DO $$
DECLARE
    v_course_frontend UUID;
    v_course_english UUID;
    v_student_ali UUID;
    v_student_vali UUID;
BEGIN
    -- ID larni olish
    SELECT id INTO v_course_frontend FROM courses WHERE title = 'Frontend' LIMIT 1;
    SELECT id INTO v_course_english FROM courses WHERE title = 'Ingliz tili' LIMIT 1;
    SELECT id INTO v_student_ali FROM students WHERE telegram_id = 111111111 LIMIT 1;
    SELECT id INTO v_student_vali FROM students WHERE telegram_id = 222222222 LIMIT 1;

    -- 3. Ali Frontend, Vali esa Ingliz tiliga yozilsin
    INSERT INTO student_courses (student_id, course_id) VALUES
    (v_student_ali, v_course_frontend),
    (v_student_vali, v_course_english);

    -- 4. Vali Ali orqali keldii va uning statusini 'active' qilamiz
    INSERT INTO referrals (inviter_id, referee_id, course_id, status) VALUES
    (v_student_ali, v_student_vali, v_course_english, 'active');
END $$;

-- 5. Ali (111111111) ning hisob kitobini tekshirish:
-- Kutilayotgan natija:
-- Base fee: 500000
-- Discount: 15000 (Ingliz tili kursi 300000 * 5%)
-- Final fee: 485000
-- Active referrals: 1
--
-- Bu so'rovni alohida ajratib ishga tushiring:
-- SELECT * FROM get_student_billing_summary(111111111);
