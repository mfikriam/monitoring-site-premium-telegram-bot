function sanitizeMessage(message) {
  if (typeof message !== 'string') {
    return message; // If the input is not a string, return it as is
  }

  // Replace '&' but preserve valid entities
  message = message.replace(/&(?![a-zA-Z0-9]+;)/g, '&amp;');

  // Escape `<` and `>` only if they are not part of valid HTML tags
  message = message.replace(/<(?!\/?(b|i|u|a|code|pre|blockquote|strong|em|s|strike|br|span|p)[\s/>])/g, '&lt;');
  message = message.replace(/>(?<!<\/?(b|i|u|a|code|pre|blockquote|strong|em|s|strike|br|span|p)[\s/>])/g, '&gt;');

  // Replace `<br>` with newlines
  message = message.replace(/<br>/g, '\n');

  // Replace `&nbsp;` with spaces
  message = message.replace(/&nbsp;/g, ' ');

  return message;
}

export default sanitizeMessage;
