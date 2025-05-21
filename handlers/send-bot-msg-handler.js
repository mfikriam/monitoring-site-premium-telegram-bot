// Import Utils
import sendTextMessage from '../utils/send-text-message.js';
import sendImageWithCaption from '../utils/send-image-with-caption.js';

async function sendBotMessage(bot, chatIds, resMsg) {
  try {
    for (const chatId of chatIds) {
      if (typeof resMsg === 'object') {
        if ('caption' in resMsg && 'imageBuffer' in resMsg) await sendImageWithCaption(bot, chatId, resMsg);
      } else {
        await sendTextMessage(bot, chatId, resMsg);
      }
    }
  } catch (err) {
    console.error('Error sending message to Telegram:');
    console.error(err.message);
  }
}

export default sendBotMessage;
