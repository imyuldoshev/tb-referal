-- 1-bosqich: Ma'lumotlar bazasi sxemasi (Supabase SQL Editor uchun)

-- Referal holatlari uchun ENUM turini yaratamiz
CREATE TYPE referral_status AS ENUM ('pending', 'active', 'left');

-- 1. Kurslar jadvali
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Talabalar jadvali
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  telegram_id BIGINT UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  referral_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Talabalarning o'qiyotgan kurslari (Many-to-Many ulanish)
CREATE TABLE student_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, course_id) -- Bitta talaba bitta kursga faqat 1 marta yozilishi mumkin
);

-- 4. Referallar jadvali
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status referral_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referee_id, course_id) -- Bitta taklif qilingan bola bitta kurs uchun faqat 1 marta referal bo'lishi mumkin
);

-- Indekslar (Tezroq qidirish uchun)
CREATE INDEX idx_students_telegram_id ON students(telegram_id);
CREATE INDEX idx_students_referral_code ON students(referral_code);
CREATE INDEX idx_student_courses_student_id ON student_courses(student_id);
CREATE INDEX idx_referrals_inviter_id ON referrals(inviter_id);
CREATE INDEX idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX idx_referrals_status ON referrals(status);

-- 5. Avtomatik hisob-kitob funksiyasi (get_student_billing_summary)
DROP FUNCTION IF EXISTS get_student_billing_summary(BIGINT);

CREATE OR REPLACE FUNCTION get_student_billing_summary(p_telegram_id BIGINT)
RETURNS TABLE (
    total_base_fee NUMERIC,
    total_discount NUMERIC,
    final_fee NUMERIC,
    active_referrals_count BIGINT
) AS $$
DECLARE
    v_student_id UUID;
    v_base_fee NUMERIC := 0;
    v_discount NUMERIC := 0;
    v_active_count BIGINT := 0;
BEGIN
    -- Telegram ID orqali talabani topish
    SELECT id INTO v_student_id FROM students WHERE telegram_id = p_telegram_id;
    
    -- Agar talaba topilmasa nol qaytaramiz
    IF v_student_id IS NULL THEN
        RETURN QUERY SELECT 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::BIGINT;
        RETURN;
    END IF;

    -- Talabaning o'zi o'qiyotgan kurslari umumiy narxini hisoblash
    SELECT COALESCE(SUM(c.price), 0) INTO v_base_fee
    FROM student_courses sc
    JOIN courses c ON c.id = sc.course_id
    WHERE sc.student_id = v_student_id;

    -- Faol referallardan tushgan chegirmalar summasi (5%) va ularning sonini hisoblash
    SELECT 
        COALESCE(SUM(c.price * 0.05), 0),
        COUNT(r.id)
    INTO v_discount, v_active_count
    FROM referrals r
    JOIN courses c ON c.id = r.course_id
    WHERE r.inviter_id = v_student_id AND r.status = 'active';

    -- Natijani qaytarish: final_fee manfiy bo'lib ketmasligi uchun GREATEST(0, ...) ishlatildi
    RETURN QUERY SELECT 
        v_base_fee,
        v_discount,
        GREATEST(0::NUMERIC, v_base_fee - v_discount),
        v_active_count;
END;
$$ LANGUAGE plpgsql;

-- Vaqtni yangilovchi trigger (updated_at uchun)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_referrals_updated_at
BEFORE UPDATE ON referrals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
