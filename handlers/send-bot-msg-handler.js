async function sendBotMessage(bot, chatIds, message) {
  try {
    // Define Telegram's max message length
    const MAX_LENGTH = 4096;

    // Split the message by newlines if it exceeds the max length
    const splitMessage = (msg) => {
      const parts = [];
      let currentPart = '';

      msg.split('\n').forEach((line) => {
        // Check if adding the current line would exceed the max length
        if ((currentPart + line + '\n').length > MAX_LENGTH) {
          parts.push(currentPart.trim()); // Add the current part to the array
          currentPart = ''; // Reset for the next part
        }
        currentPart += line + '\n'; // Add the line to the current part
      });

      if (currentPart) {
        parts.push(currentPart.trim()); // Add the last part if any
      }

      return parts;
    };

    // Process each chatId
    for (const chatId of chatIds) {
      const messages = splitMessage(message); // Split the message into parts
      for (const part of messages) {
        await bot.sendMessage(chatId, part, { parse_mode: 'HTML' });
      }
    }
  } catch (err) {
    console.error('Error sending message to Telegram:', err.message);
  }
}

export default sendBotMessage;
