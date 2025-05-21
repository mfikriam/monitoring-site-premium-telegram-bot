// Function to split a message into smaller chunks by '\n' and move the last line to the next chunk if it exceeds maxLength
function splitMessage(message, maxLength) {
  const messages = [];
  const messageLines = message.split('\n');

  let chunk = '';

  messageLines.forEach((line) => {
    if ((chunk + line).length + 1 > maxLength) {
      // +1 for '\n'
      const lastLine = chunk.lastIndexOf('\n') !== -1 ? chunk.slice(chunk.lastIndexOf('\n') + 1) : chunk;
      chunk = chunk.slice(0, chunk.lastIndexOf('\n'));
      messages.push(chunk.trim());
      chunk = `${lastLine}\n${line}`;
    } else {
      chunk += (chunk ? '\n' : '') + line;
    }
  });

  if (chunk.length > 0) {
    messages.push(chunk.trim());
  }

  return messages;
}

export default splitMessage;
