function updateStatusCounter(countStatusLink, statusLink1, statusLink2) {
  if (statusLink1 === 'Working ✅' && statusLink2 === 'Working ✅') {
    countStatusLink.up2Link += 1;
    return;
  }

  if (statusLink1 === 'LOS ❌' && statusLink2 === 'LOS ❌') {
    countStatusLink.down2Link += 1;
    return;
  }

  if (statusLink1 === 'Working ✅' && statusLink2 === 'Unmonitor ⬛') {
    countStatusLink.up1Link += 1;
    return;
  }

  if (statusLink1 === 'Unmonitor ⬛' && statusLink2 === 'Working ✅') {
    countStatusLink.up1Link += 1;
    return;
  }

  if (statusLink1 === 'Working ✅' || statusLink2 === 'Working ✅') {
    countStatusLink.up1Link += 1;
    return;
  }

  countStatusLink.others += 1;
  return;
}

export default updateStatusCounter;
