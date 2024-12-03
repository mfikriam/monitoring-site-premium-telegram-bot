function getStatusDesc(status) {
  switch (status) {
    case '✅':
      return 'Working';
    case '❌':
      return 'LOS';
    case '⬛':
      return 'Unmonitor';
    case '🟨':
      return 'SSH Failed';
    default:
      return 'ERROR';
  }
}

export default getStatusDesc;
