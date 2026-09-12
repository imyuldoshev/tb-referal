const { Bot, Keyboard } = require('grammy');
const supabase = require('./supabase');
require('dotenv').config({ path: '../.env' });

const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

const showMainMenu = async (ctx) => {
    const keyboard = new Keyboard()
        .text("👤 Mening hisobim").row()
        .text("👥 Mening takliflarim").text("❓ Qoidalar").resized();
        
    await ctx.reply("Quyidagi menyulardan birini tanlang:", {
        reply_markup: keyboard
    });
};

bot.command('start', async (ctx) => {
    const telegramId = ctx.from.id;
    const inviterCode = ctx.match; 

    try {
        if (inviterCode && inviterCode.startsWith('LINK_')) {
            const manualStudentId = inviterCode.replace('LINK_', '');
            const { data: manualStudent } = await supabase.from('students').select('*').eq('id', manualStudentId).single();
            if (manualStudent) {
                if (manualStudent.telegram_id !== null) {
                    await ctx.reply("Bu akkaunt allaqachon botga ulangan!");
                    return;
                }
                // O'chirib tashlaymiz agarda ushbu user avval /start ni bosgan bo'lsa
                await supabase.from('students').delete().eq('telegram_id', telegramId);
                // Manualni yangilaymiz
                await supabase.from('students').update({ telegram_id: telegramId }).eq('id', manualStudentId);
                
                await ctx.reply(`Tabriklaymiz, ${manualStudent.full_name}! Sizning akkauntingiz botga muvaffaqiyatli ulandi.`);
                await showMainMenu(ctx);
                return;
            } else {
                await ctx.reply("Bunday akkaunt topilmadi yoki xato havola.");
                return;
            }
        }

        let { data: existingStudent } = await supabase
            .from('students')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (!existingStudent) {
            const myRefCode = `REF_${telegramId}`; 
            
            // 1. Bazaga yangi o'quvchini darhol qo'shamiz (ISMni 'pending' qilib)
            const { data: newStudent, error: insertError } = await supabase
                .from('students')
                .insert([{ 
                    telegram_id: telegramId, 
                    full_name: 'pending', // Vaqtinchalik
                    referral_code: myRefCode 
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            existingStudent = newStudent;

            // 2. Agar referal orqali kelgan bo'lsa
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

            // Haqiqiy Ism va Familiya so'raymiz
            await ctx.reply(`Assalomu alaykum!\nMarkazimizning referal botiga xush kelibsiz.\n\nIltimos, haqiqiy **Ism va Familiyangizni** kiriting (Masalan: Alisher G'aniyev):`, {
                reply_markup: { remove_keyboard: true }
            });
            return;
        } else if (existingStudent.full_name === 'pending') {
            await ctx.reply(`Iltimos, ro'yxatdan o'tishni davom ettirish uchun haqiqiy **Ism va Familiyangizni** kiriting:`);
            return;
        } else if (!existingStudent.phone) {
            const phoneKeyboard = new Keyboard().requestContact("📱 Raqamni yuborish").resized();
            await ctx.reply(`Iltimos, ro'yxatdan o'tishni yakunlash uchun telefon raqamingizni yuboring:`, {
                reply_markup: phoneKeyboard
            });
            return;
        }

        // Tizimda to'liq ro'yxatdan o'tgan bo'lsa
        await ctx.reply(`Assalomu alaykum yana bir bor, ${existingStudent.full_name}!`);
        await showMainMenu(ctx);
        
    } catch (err) {
        console.error(err);
        await ctx.reply("Xatolik yuz berdi. Iltimos keyinroq urinib ko'ring.");
    }
});

// Matnli xabarlarni tutib olish (Ism kiritilganda ishlashi uchun)
bot.on('message:text', async (ctx, next) => {
    const text = ctx.message.text;
    const telegramId = ctx.from.id;

    // Menyu tugmalariga ta'sir qilmasligi uchun
    if (['👤 Mening hisobim', '🔗 Referal havolam', '👥 Mening takliflarim', '❓ Qoidalar'].includes(text)) {
        return next();
    }

    try {
        const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        // Agar foydalanuvchi bazada bor bo'lsa va ismi 'pending' bo'lsa
        if (student && student.full_name === 'pending') {
            // Ismni yangilaymiz (Formatlash: azimov temur -> Azimov Temur)
            const formattedName = text.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
            
            await supabase
                .from('students')
                .update({ full_name: formattedName })
                .eq('telegram_id', telegramId);
            
            // Va telefon raqam so'raymiz
            const phoneKeyboard = new Keyboard().requestContact("📱 Raqamni yuborish").resized();
            await ctx.reply(`Rahmat, ${formattedName}!\n\nEndi telefon raqamingizni yuboring. Buning uchun pastdagi tugmani bosing:`, {
                reply_markup: phoneKeyboard
            });
            return;
        }
    } catch (err) {
        console.error(err);
    }
    
    return next();
});

// Kontakt (Telefon raqam) ni tutib olish
bot.on('message:contact', async (ctx) => {
    const phone = ctx.message.contact.phone_number;
    const telegramId = ctx.from.id;

    try {
        const { data: student } = await supabase
            .from('students')
            .select('*')
            .eq('telegram_id', telegramId)
            .single();

        if (student && !student.phone) {
            // Raqamni bazaga saqlaymiz
            await supabase
                .from('students')
                .update({ phone: phone })
                .eq('telegram_id', telegramId);

            await ctx.reply("Ro'yxatdan muvaffaqiyatli o'tdingiz!", { reply_markup: { remove_keyboard: true } });
            await showMainMenu(ctx);
        }
    } catch (err) {
        console.error(err);
        await ctx.reply("Raqamni saqlashda xatolik yuz berdi.");
    }
});

// --- Asosiy Menyular ---
bot.hears('👤 Mening hisobim', async (ctx) => {
    const telegramId = ctx.from.id;
    try {
        // 1. O'quvchini topamiz
        const { data: student } = await supabase.from('students').select('id').eq('telegram_id', telegramId).single();
        if (!student) {
            return await ctx.reply("Siz hali ro'yxatdan o'tmagansiz.");
        }

        // 2. Uning o'qiyotgan kurslari umumiy narxini hisoblaymiz
        const { data: sc } = await supabase.from('student_courses').select('course:courses(price)').eq('student_id', student.id);
        let baseFee = 0;
        if (sc && sc.length > 0) {
            sc.forEach(item => {
                if (item.course && item.course.price) baseFee += item.course.price;
            });
        }

        // 3. Uning faol takliflari sonini topamiz
        const { data: refs } = await supabase.from('referrals').select('id').eq('inviter_id', student.id).eq('status', 'active');
        const activeCount = refs ? refs.length : 0;

        // 4. Chegirmani hisoblaymiz (Har bir faol bola uchun o'z kursining 5% qismi)
        let discountPercent = activeCount * 5;
        if (discountPercent > 100) discountPercent = 100; // 100% dan oshmaydi

        const discountAmount = (baseFee * discountPercent) / 100;
        const finalFee = baseFee - discountAmount;

        const msg = `📊 **Sizning hisobingiz**\n\n` +
                    `O'qiyotgan kurslaringiz umumiy narxi: ${baseFee.toLocaleString()} so'm\n` +
                    `Chegirmalar summasi: ${discountAmount.toLocaleString()} so'm (Faol do'stlar: ${activeCount} ta, ${discountPercent}%)\n` +
                    `---------------------------------\n` +
                    `💸 **To'lanadigan yakuniy summa:** ${finalFee.toLocaleString()} so'm`;
                    
        await ctx.reply(msg, { parse_mode: "Markdown" });
    } catch (err) {
        console.error(err);
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
                msg += `${i+1}. ${r.referee.full_name} - ${courseName} (${statusEmoji} ${r.status})\n`;
                if (r.status === 'active') msg += `   *Chegirma:* +5% (Sizning o'z kursingizdan)\n`;
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
