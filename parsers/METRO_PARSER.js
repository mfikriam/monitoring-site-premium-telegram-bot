function parser(text) {
  if (text && text.includes('current state : UP')) return 'Working ✅';
  return 'LOS ❌';
}

export default parser;
