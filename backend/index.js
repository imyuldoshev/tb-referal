require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const { webhookCallback } = require('grammy');
const bot = require('./bot');
const apiRoutes = require('./api');

const app = express();

app.use(cors());
app.use(express.json());

// API marshrutlarni ulash (Admin panel uchun)
app.use('/api', apiRoutes);

// Vercel Serverless uchun Webhook marshruti
// Telegram bot xabarlari endi shu manzilga keladi
app.use('/api/webhook', webhookCallback(bot, 'express'));

// Server ishlashini tekshirish
app.get('/', (req, res) => {
    res.send('TB-Referal Backend is running on Vercel Serverless!');
});

// Mahalliy kompyuterda (Localhost) test qilish uchun (Vercel'da NODE_ENV = 'production' bo'ladi)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, async () => {
        console.log(`🚀 Server http://localhost:${PORT} da ishga tushdi.`);
        try {
            await bot.start();
            console.log("🤖 Telegram Bot long-polling rejimida ishga tushdi!");
        } catch (err) {
            console.error("Botni ishga tushirishda xatolik:", err);
        }
    });
}

// Express ilovasini Vercel uchun eksport qilamiz
module.exports = app;
