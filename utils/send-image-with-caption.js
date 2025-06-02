// Import Utils
import splitMessage from './split-message.js';
import sanitizeMessage from './sanitize-message.js';

async function sendImageWithCaption(bot, chatId, resMsg) {
  const { caption, imageBuffer } = resMsg;
  let modifiedCaption = caption; // Make caption mutable

  // Add redaction if the msg sent to group REROUTE VLAN TREG 7
  if (chatId === '-4674089782' && modifiedCaption.includes('❌')) {
    modifiedCaption += `\n\nMohon untuk dilakukan pengecekan dan diopenkan tiket preventive jika perlu @AndiFebriani @IOC7_QUALITY_0813483933 @SURVEILLANCE_TIF4_MSO7`;
  }

  const sanitizedCaption = sanitizeMessage(modifiedCaption); // Sanitize the text/caption
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
