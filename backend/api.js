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

// PATCH /api/referrals/:id - Referal statusini o'zgartirish (va kursga biriktirish)
router.patch('/referrals/:id', async (req, res) => {
    const { id } = req.params;
    const { status, course_id } = req.body; 
    
    // Status va kursni yangilash
    let updateData = { status };
    if (course_id) updateData.course_id = course_id;

    const { data, error } = await supabase
        .from('referrals')
        .update(updateData)
        .eq('id', id)
        .select(`
            *,
            inviter:students!referrals_inviter_id_fkey(telegram_id),
            referee:students!referrals_referee_id_fkey(full_name)
        `)
        .single();
        
    if (error) return res.status(500).json({ error: error.message });

    // Agar muvaffaqiyatli o'zgarsa, taklif qilgan odamga xabar yuborish
    if (data && data.inviter && data.inviter.telegram_id) {
        try {
            if (status === 'active') {
                await bot.api.sendMessage(
                    data.inviter.telegram_id, 
                    `🎉 Tabriklaymiz! Do'stingiz **${data.referee.full_name}** o'qishni boshladi va u uchun sizga chegirma qo'shildi!`, 
                    { parse_mode: 'Markdown' }
                );
            } else if (status === 'left') {
                await bot.api.sendMessage(
                    data.inviter.telegram_id, 
                    `⚠️ Do'stingiz **${data.referee.full_name}** o'qishni to'xtatdi. Keyingi oydan sizning chegirmangiz qayta hisoblanadi.`, 
                    { parse_mode: 'Markdown' }
                );
            }
        } catch (botErr) {
            console.error("Telegram xabarini yuborishda xatolik:", botErr);
        }
    }

    res.json(data);
});

module.exports = router;
