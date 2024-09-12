function parser(text) {
  if (text && text.includes('<Physical link state:UP>')) return 'Working ✅';
  return 'LOS ❌';
}

export default parser;
