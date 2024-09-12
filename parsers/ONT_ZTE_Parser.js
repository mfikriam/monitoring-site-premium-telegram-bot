// 'Phase state:          working'

function parser(text) {
  const keyword = 'Phase state:';

  const regex = new RegExp(`${keyword}\\s*(\\w+)`);
  const searchResult = text.match(regex);

  if (searchResult) {
    const key = searchResult[1]; // The next word after keyword
    if (key === 'working') return 'Working ✅';
  }

  return 'LOS ❌';
}

export default parser;
