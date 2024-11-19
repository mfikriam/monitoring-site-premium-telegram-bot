import currentDateTime from './get-current-datetime.js';

function generateInitialMsg() {
  let msg = ``;
  msg += `<b>REPORT MONITORING SITE PREMIUM MSO TIF-4</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;
  msg += `Subdistrict | Site ID | Link 1 | Link 2 |\n`;

  return msg;
}

export default generateInitialMsg;
