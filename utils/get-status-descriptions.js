function getStatusDesc(status) {
  switch (status) {
    case '✅':
      return 'Working';
    case '❌':
      return 'LOS';
    default:
      return 'SSH Failed';
  }
}

export default getStatusDesc;
