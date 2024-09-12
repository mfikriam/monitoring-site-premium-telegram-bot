function generateSshErrorMsg(msg) {
  msg += `\n\n`;
  msg += `<b>Error while SSH to NMS server. Contact admin for more information @muhammad_fikri_17</b>`;

  return msg;
}

export default generateSshErrorMsg;
