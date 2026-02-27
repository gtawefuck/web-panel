const TelegramBot = require('node-telegram-bot-api');

let bot = null;

function getBot() {
    if (!bot && process.env.TELEGRAM_BOT_TOKEN && process.env.DEMO_MODE !== 'true') {
        bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: false });
    }
    return bot;
}

/**
 * Send OTP to a Telegram user
 * @param {string} tgId - Telegram User ID
 * @param {string} otp  - 6-digit OTP
 * @returns {Promise<{success: boolean, demo?: boolean, demoOtp?: string}>}
 */
async function sendOTP(tgId, otp) {
    if (process.env.DEMO_MODE === 'true') {
        console.log(`[DEMO] OTP for ${tgId}: ${otp}`);
        return { success: true, demo: true, demoOtp: otp };
    }

    const instance = getBot();
    if (!instance) {
        throw new Error('Telegram bot is not configured. Set TELEGRAM_BOT_TOKEN in environment.');
    }

    const message = `🔐 *Admin Panel OTP*\n\nYour one-time password is:\n\n\`${otp}\`\n\n⏱ This OTP expires in *5 minutes*.\n\n_Do not share this with anyone._`;

    await instance.sendMessage(tgId, message, { parse_mode: 'Markdown' });
    return { success: true };
}

module.exports = { sendOTP };
