function parser(text, keyword) {
  if (text && text.includes(keyword)) return 'Working ✅';
  return 'LOS ❌';
}

export default parser;
