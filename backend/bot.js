const { Bot, Keyboard } = require('grammy');
const supabase = require('./supabase');
require('dotenv').config({ path: '../.env' });

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const showMainMenu = async (ctx) => {
    const keyboard = new Keyboard()
        .text("👤 Mening hisobim").text("🔗 Referal havolam").row()
        .text("👥 Mening takliflarim").text("❓ Qoidalar").resized();
        
    await ctx.reply("Quyidagi menyulardan birini tanlang:", {
        reply_markup: keyboard
    });
};

bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id;
    // Telegram'dagi ismini olamiz
    const fullName = `${ctx.from.first_name} ${ctx.from.last_name || ''}`.trim();
    const inviterCode = ctx.match; // ref kodni ushlab qolamiz

    try {
        let { data: existingStudent } = await supabase
            .from('students')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (!existingStudent) {
            const myRefCode = `REF_${telegramId}`; 
            
            // 1. Bazaga yangi o'quvchini darhol qo'shamiz (telefon raqamsiz)
            const { data: newStudent, error: insertError } = await supabase
                .from('students')
                .insert([{ 
                    telegram_id: telegramId, 
                    full_name: fullName, 
                    referral_code: myRefCode 
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            existingStudent = newStudent;

            // 2. Agar referal orqali kelgan bo'lsa, referrals jadvaliga qo'shamiz
            if (inviterCode && inviterCode !== myRefCode) {
                const { data: inviter } = await supabase
                    .from('students')
                    .select('id')
                    .eq('referral_code', inviterCode)
                    .single();

                if (inviter) {
                    await supabase.from('referrals').insert([{
                        inviter_id: inviter.id,
                        referee_id: newStudent.id,
                        status: 'pending'
                    }]);
                }
            }

            // Raqam so'raymiz
            const phoneKeyboard = new Keyboard().requestContact("📱 Raqamni yuborish").resized();
            await ctx.reply(`Assalomu alaykum, ${fullName}!\nMarkazimizning referal botiga xush kelibsiz.\n\nRo'yxatdan o'tishni yakunlash uchun pastdagi tugma orqali telefon raqamingizni yuboring:`, {
                reply_markup: phoneKeyboard
            });
            return;
        } else if (!existingStudent.phone) {
            // Akkaunti bor, lekin telefon raqami yo'q
            const phoneKeyboard = new Keyboard().requestContact("📱 Raqamni yuborish").resized();
            await ctx.reply(`Iltimos, ro'yxatdan o'tishni yakunlash uchun telefon raqamingizni yuboring:`, {
                reply_markup: phoneKeyboard
            });
            return;
        }

        // Tizimda to'liq bor bo'lsa
        await ctx.reply(`Assalomu alaykum yana bir bor, ${existingStudent.full_name}!`);
        await showMainMenu(ctx);
        
    } catch (err) {
        console.error(err);
        await ctx.reply("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    }
});

// Kontakt (Telefon raqam) ni tutib olish
bot.on('message:contact', async (ctx) => {
    const phone = ctx.message.contact.phone_number;
    const telegramId = ctx.from.id;

    try {
        // Raqamni bazaga saqlaymiz (UPDATE)
        const { error } = await supabase
            .from('students')
            .update({ phone: phone })
            .eq('telegram_id', telegramId);

        if (error) throw error;

        await ctx.reply("Ro'yxatdan muvaffaqiyatli o'tdingiz!", { reply_markup: { remove_keyboard: true } });
        await showMainMenu(ctx);
        
    } catch (err) {
        console.error(err);
        await ctx.reply("Raqamni saqlashda xatolik yuz berdi.");
    }
});

// --- Asosiy Menyular ---
bot.hears('👤 Mening hisobim', async (ctx) => {
    const telegramId = ctx.from.id;
    try {
        const { data, error } = await supabase.rpc('get_student_billing_summary', { p_telegram_id: telegramId });
        if (error) throw error;
        if (data && data.length > 0) {
            const summary = data[0];
            const msg = `📊 **Sizning hisobingiz**\n\n` +
                        `O'qiyotgan kurslaringiz umumiy narxi: ${summary.total_base_fee} so'm\n` +
                        `Chegirmalar summasi: ${summary.total_discount} so'm (Faol do'stlar: ${summary.active_referrals_count} ta)\n` +
                        `---------------------------------\n` +
                        `💸 **To'lanadigan yakuniy summa:** ${summary.final_fee} so'm`;
            await ctx.reply(msg, { parse_mode: "Markdown" });
        } else {
            await ctx.reply("Hisob ma'lumotlari topilmadi yoki siz hali hech qanday kursga yozilmagansiz.");
        }
    } catch (err) {
        await ctx.reply("Xatolik yuz berdi.");
    }
});

bot.hears('🔗 Referal havolam', async (ctx) => {
    const telegramId = ctx.from.id;
    try {
        const { data: student } = await supabase.from('students').select('referral_code').eq('telegram_id', telegramId).single();
        if (student) {
            const botInfo = await bot.api.getMe();
            const refLink = `https://t.me/${botInfo.username}?start=${student.referral_code}`;
            const msg = `🔗 **Sizning shaxsiy referal havolangiz:**\n\n${refLink}\n\nUshbu havolani do'stlaringizga yuboring va ular o'qishni boshlaganda kurs narxidan 5% chegirma oling!`;
            await ctx.reply(msg);
        } else {
            await ctx.reply("Foydalanuvchi topilmadi. Iltimos /start buyrug'ini bosing.");
        }
    } catch (err) {
        await ctx.reply("Xatolik yuz berdi.");
    }
});

bot.hears('👥 Mening takliflarim', async (ctx) => {
    const telegramId = ctx.from.id;
    try {
        const { data: student } = await supabase.from('students').select('id').eq('telegram_id', telegramId).single();
        if (!student) return ctx.reply("Ro'yxatdan o'tmagansiz.");

        const { data: refs, error } = await supabase
            .from('referrals')
            .select('status, course:courses(title, price), referee:students!referrals_referee_id_fkey(full_name)')
            .eq('inviter_id', student.id);

        if (error) throw error;
        if (refs && refs.length > 0) {
            let msg = `👥 **Siz taklif qilgan do'stlar:**\n\n`;
            refs.forEach((r, i) => {
                const statusEmoji = r.status === 'active' ? '✅' : (r.status === 'pending' ? '⏳' : '❌');
                const courseName = r.course ? r.course.title : 'Kurs tanlanmagan';
                const discount = r.status === 'active' && r.course ? (r.course.price * 0.05) : 0;
                msg += `${i+1}. ${r.referee.full_name} - ${courseName} (${statusEmoji} ${r.status})\n`;
                if (r.status === 'active') msg += `   *Chegirma:* ${discount} so'm\n`;
            });
            await ctx.reply(msg, { parse_mode: "Markdown" });
        } else {
            await ctx.reply("Siz hali hech kimni taklif qilmadingiz.");
        }
    } catch (err) {
        await ctx.reply("Xatolik yuz berdi.");
    }
});

bot.hears('❓ Qoidalar', (ctx) => {
    const msg = `❓ **Chegirma tizimi qoidalari:**\n\n` +
                `1. Siz bergan havola orqali botga kirgan va markazimizda o'qishni boshlagan har bir do'stingiz uchun uning kurs narxidan **5% chegirma** olasiz.\n` +
                `2. Chegirma faqat siz o'qiydigan kurs to'loviga ta'sir qiladi.\n` +
                `3. Agar do'stingiz o'qishni to'xtatsa, u uchun berilayotgan chegirma ham to'xtatiladi.\n` +
                `4. Chegirmalar har oy avtomatik hisoblanadi.`;
    ctx.reply(msg, { parse_mode: "Markdown" });
});

bot.catch((err) => {
    console.error("Bot Error:", err);
});

module.exports = bot;
