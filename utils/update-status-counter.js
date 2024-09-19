function updateStatusCounter(countStatusLink, statusLink1, statusLink2) {
  const mainStatus = ['Working ✅', 'LOS ❌', 'Unmonitor ⬛'];
  const lossStatus = ['LOS ❌', 'Unmonitor ⬛'];
  const accountStatus = ['SSH Failed 🟨', 'Auth Failed 🟨'];

  if (statusLink1 === 'Working ✅' && statusLink2 === 'Working ✅') {
    countStatusLink.up2Link += 1;
    return;
  }

  if (statusLink1 === 'LOS ❌' && statusLink2 === 'LOS ❌') {
    countStatusLink.down2Link += 1;
    return;
  }

  if (statusLink1 === 'LOS ❌' && statusLink2 === 'Unmonitor ⬛') {
    countStatusLink.down2Link += 1;
    return;
  }

  if (statusLink1 === 'Unmonitor ⬛' && statusLink2 === 'LOS ❌') {
    countStatusLink.down2Link += 1;
    return;
  }

  if (statusLink1 === 'Working ✅' && lossStatus.includes(statusLink2)) {
    countStatusLink.up1Link += 1;
    return;
  }

  if (lossStatus.includes(statusLink1) && statusLink2 === 'Working ✅') {
    countStatusLink.up1Link += 1;
    return;
  }

  countStatusLink.others += 1;
  return;
}

export default updateStatusCounter;
