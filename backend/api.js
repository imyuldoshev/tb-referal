const express = require('express');
const supabase = require('./supabase');
const bot = require('./bot');

const router = express.Router();

// GET /api/students - Talabalar va ularning ro'yxatini olish
router.get('/students', async (req, res) => {
    const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /api/courses - Barcha kurslarni olish
router.get('/courses', async (req, res) => {
    const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: true });
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/courses - Yangi kurs qo'shish
router.post('/courses', async (req, res) => {
    const { title, price } = req.body;
    const { data, error } = await supabase
        .from('courses')
        .insert([{ title, price }])
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// PATCH /api/courses/:id - Kursni tahrirlash
router.patch('/courses/:id', async (req, res) => {
    const { id } = req.params;
    const { title, price } = req.body;
    const { data, error } = await supabase
        .from('courses')
        .update({ title, price })
        .eq('id', id)
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// DELETE /api/courses/:id - Kursni o'chirish
router.delete('/courses/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// GET /api/referrals - Barcha referallarni olish (O'quvchilar va statuslarni ko'rish uchun)
// GET /api/students_full - Barcha talabalarni va ularni taklif qilganlarni olish
router.get('/students_full', async (req, res) => {
    const { data, error } = await supabase
        .from('students')
        .select(`
            id,
            telegram_id,
            full_name,
            phone,
            created_at,
            referral_code,
            referral_info:referrals!referrals_referee_id_fkey(
                id,
                status,
                course:courses(id, title),
                inviter:students!referrals_inviter_id_fkey(full_name)
            ),
            enrolled_courses:student_courses(
                course:courses(id, title)
            )
        `)
        .order('created_at', { ascending: false });
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// PATCH /api/students/:id - O'quvchini tahrirlash
router.patch('/students/:id', async (req, res) => {
    const { id } = req.params;
    const { full_name, phone } = req.body;
    const { data, error } = await supabase
        .from('students')
        .update({ full_name, phone })
        .eq('id', id)
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// GET /api/students/:id/invited - Talaba taklif qilgan o'quvchilar ro'yxatini olish
router.get('/students/:id/invited', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('referrals')
        .select(`
            *,
            course:courses(title, price),
            referee:students!referrals_referee_id_fkey(full_name, phone)
        `)
        .eq('inviter_id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// POST /api/students/:id/enroll - O'quvchiga yangi kurs qoshish
router.post('/students/:id/enroll', async (req, res) => {
    const { id } = req.params;
    const { course_id } = req.body;
    
    // Avval bu kursga qo'shilganini tekshiramiz
    const { data: existing } = await supabase
        .from('student_courses')
        .select('*')
        .eq('student_id', id)
        .eq('course_id', course_id)
        .single();
        
    if (existing) {
        return res.status(400).json({ error: "O'quvchi bu kursga allaqachon qo'shilgan!" });
    }

    const { data, error } = await supabase
        .from('student_courses')
        .insert([{ student_id: id, course_id }])
        .select();
        
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

// DELETE /api/students_archive/clear - Arxivdagi barcha o'quvchilarni o'chirish
router.delete('/students_archive/clear', async (req, res) => {
    const { data, error } = await supabase
        .from('students')
        .delete()
        .or('full_name.eq.pending,phone.is.null');
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// DELETE /api/students/:id - O'quvchini o'chirish
router.delete('/students/:id', async (req, res) => {
    const { id } = req.params;
    const { data, error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// POST /api/students/bulk-delete - Ko'p o'quvchilarni o'chirish
router.post('/students/bulk-delete', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
        return res.status(400).json({ error: "Invalid or no ids provided" });
    }
    
    const { data, error } = await supabase
        .from('students')
        .delete()
        .in('id', ids);
        
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
});

// PATCH /api/referrals/:id - Referal statusini o'zgartirish (va kursga biriktirish)
router.patch('/referrals/:id', async (req, res) => {
    const { id } = req.params;
    const { status, course_id } = req.body;
    
    let updateData = { status };
    if (course_id) updateData.course_id = course_id;

    const { data, error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', id)
        .select('*, inviter:students!referrals_inviter_id_fkey(telegram_id), referee:students!referrals_referee_id_fkey(full_name)')
        .single();
        
    if (error) return res.status(500).json({ error: error.message });

    // Agar status "active" ga o'zgarsa, taklif qilgan odamga telegramdan jami skidkasini hisoblab yuboramiz
    if (status === 'active' && data.inviter?.telegram_id) {
        try {
            // Inviterning barcha aktiv takliflarini sanaymiz
            const { data: activeReferrals } = await supabase
                .from('referrals')
                .select('id')
                .eq('inviter_id', data.inviter_id)
                .eq('status', 'active');
                
            const activeCount = activeReferrals ? activeReferrals.length : 1;
            let totalDiscount = activeCount * 5;
            if (totalDiscount > 100) totalDiscount = 100;

            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: data.inviter.telegram_id,
                    text: `🎉 Tabriklaymiz! Siz taklif qilgan ${data.referee.full_name} o'qishni boshladi.\n\nSizning jami chegirmangiz ${totalDiscount}% ga yetdi! (${activeCount} ta faol o'quvchi)`
                })
            });
        } catch (e) {
            console.error('Bot orqali xabar yuborishda xatolik:', e);
        }
    } else if (status === 'left' && data.inviter && data.inviter.telegram_id) {
        try {
            await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: data.inviter.telegram_id,
                    text: `⚠️ Do'stingiz ${data.referee.full_name} o'qishni to'xtatdi. Keyingi oydan sizning chegirmangiz qayta hisoblanadi.`
                })
            });
        } catch (botErr) {
            console.error("Telegram xabarini yuborishda xatolik:", botErr);
        }
    }

    res.json(data);
});

module.exports = router;
