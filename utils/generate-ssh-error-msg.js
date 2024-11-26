function generateSshErrorMsg(msg) {
  msg += `\n\n`;
  msg += `Error while SSH to NMS server. Contact admin for more information @muhammad_fikri_17`;

  return msg;
}

export default generateSshErrorMsg;
