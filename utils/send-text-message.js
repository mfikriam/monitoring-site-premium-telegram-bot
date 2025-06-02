// Import Utils
import splitMessage from './split-message.js';
import sanitizeMessage from './sanitize-message.js';

async function sendTextMessage(bot, chatId, text) {
  let modifiedText = text; // Make text mutable

  // Add redaction if the msg sent to group REROUTE VLAN TREG 7
  if (chatId === '-4674089782' && modifiedText.includes('❌')) {
    modifiedText += `\n\nMohon untuk dilakukan pengecekan dan diopenkan tiket preventive jika perlu @AndiFebriani @IOC7_QUALITY_0813483933 @SURVEILLANCE_TIF4_MSO7`;
  }

  const sanitizedText = sanitizeMessage(modifiedText); // Sanitize the text
  const messages = splitMessage(sanitizedText, 4096); // Telegram's max message length is 4096

  for (const message of messages) {
    await bot.sendMessage(chatId, message, { parse_mode: 'HTML' });
  }
}

export default sendTextMessage;
