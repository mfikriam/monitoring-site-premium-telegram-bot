async function sendBotMessage(bot, chatIds, message) {
  try {
    for (const chatId of chatIds) {
      await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
    }
  } catch (err) {
    console.error('Error sending message to Telegram');
  }
}

export default sendBotMessage;
