function getEdgeType(statusLink) {
  switch (statusLink) {
    case '✅':
      return 'working';
    case '❌':
      return 'los';
    case '⚠️':
      return 'warning';
    case '⬛':
      return '';
  }

  return '';
}

export default getEdgeType;
