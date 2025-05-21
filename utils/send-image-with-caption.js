// Import Utils
import splitMessage from './split-message.js';
import sanitizeMessage from './sanitize-message.js';

async function sendImageWithCaption(bot, chatId, resMsg) {
  const { caption, imageBuffer } = resMsg;
  const sanitizedCaption = sanitizeMessage(caption); // Sanitize the text/caption
  const messages = splitMessage(sanitizedCaption, 1024); // Telegram's max message length

  // Send the first part as the caption with the image
  await bot.sendPhoto(chatId, imageBuffer, {
    caption: messages[0],
    parse_mode: 'HTML',
  });

  // Send any remaining parts as separate messages
  for (const message of messages.slice(1)) {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }
}

export default sendImageWithCaption;
