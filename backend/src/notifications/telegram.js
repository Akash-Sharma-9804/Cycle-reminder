// notifications/telegram.js
// -----------------------------------------------------------------------
// How Telegram bot integration works:
// 1. You talk to @BotFather on Telegram, send /newbot, and follow the
//    prompts. BotFather gives you a Bot Token (looks like
//    "123456789:AAF...").
// 2. Each Telegram user/chat has a numeric "chat_id". To find yours,
//    message your new bot anything, then open in a browser:
//    https://api.telegram.org/bot<TOKEN>/getUpdates
//    The JSON response contains "chat": { "id": 123456789, ... } - that's
//    the chat_id to store in Settings for that person.
// 3. To send a message, we just POST to Telegram's HTTP API endpoint
//    sendMessage with the chat_id and text. No SDK needed.
// -----------------------------------------------------------------------

const fetch = require("node-fetch");

async function sendTelegramMessage({ chatId, text }) {
  if (!chatId) throw new Error("No Telegram chat ID configured");
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${data.description || "unknown error"}`);
  }
  return data;
}

module.exports = { sendTelegramMessage };
