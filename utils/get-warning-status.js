function getWarningStatus(statusLink, currentBW, maxBW) {
  if (typeof maxBW === 'number' && typeof currentBW === 'number' && maxBW > 0 && currentBW > 0 && currentBW < maxBW) {
    return '⚠️';
  }

  return statusLink;
}

export default getWarningStatus;
