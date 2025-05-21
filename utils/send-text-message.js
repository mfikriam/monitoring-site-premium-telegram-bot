// Import Utils
import splitMessage from './split-message.js';
import sanitizeMessage from './sanitize-message.js';

async function sendTextMessage(bot, chatId, text) {
  const sanitizedText = sanitizeMessage(text); // Sanitize the text
  const messages = splitMessage(sanitizedText, 4096); // Telegram's max message length is 4096

  // Use for...of loop to await message sending to ensure order
  for (const message of messages) {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }
}

export default sendTextMessage;
