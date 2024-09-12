function generateSummaryMsg(msg, countStatusLink) {
  msg += `\n`;
  msg += `Summary Report : UP 2 Link | Up 1 Link | Down 2 Link | Others\n`;
  msg += `${countStatusLink.up2Link} | ${countStatusLink.up1Link} | ${countStatusLink.down2Link} | ${countStatusLink.others}\n`;

  return msg;
}

export default generateSummaryMsg;
