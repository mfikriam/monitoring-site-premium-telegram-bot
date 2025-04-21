// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';

const data = [
  {
    src: 'SFI',
    dest: 'WDA',
    interfaces: [],
  },
];

async function monitoringPremiumHandler(msg, defaultConfig) {
  // Initial Message
  msg += `<b>REPORT MONITORING CLUSTER IWIP</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Declare variables
  let devicesRoute = [];

  // ----------------- 1. Ring Metro-E via DWDM -----------------
  devicesRoute = ['SFI', 'WDA', 'IWP', 'MBA', 'SFI'];
  msg += `1. Ring Metro-E via DWDM\n`;
  msg += `${devicesRoute[0]}`;
  for (let i = 0; i < devicesRoute.length - 1; i++) {
    const route1 = devicesRoute[i];
    const route2 = devicesRoute[i];
    msg += ` &lt;&gt; ${route2}`;
  }
  msg += `\n`;

  return msg;
}

export default monitoringPremiumHandler;
