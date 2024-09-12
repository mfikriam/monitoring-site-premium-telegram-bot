// SITE ID : ADL007
// LINK 1  : L2SW ZTE ZXR10
// LINK 2  : L2SW ZTE ZXR10

import L2SW_ZTE_ZXR10 from '../devices/L2SW_ZTE_ZXR10.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;

  // LINK 1
  telnetConfig = {
    username: 'zxr10',
    password: 'zxr10',
    host: '10.199.154.234',
    command: ['enable', 'show interface gei-0/1/1/7'],
    keyword: 'gei-0/1/1/7 is up',
  };
  console.log(`  > Link 1: L2SW ZTE ZXR10`);
  const statusLink1 = await L2SW_ZTE_ZXR10({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username: 'zxr10',
    password: 'zxr10',
    host: '10.199.154.234',
    command: ['enable', 'show interface gei-0/1/1/8'],
    keyword: 'gei-0/1/1/8 is up',
  };
  console.log(`  > Link 2: L2SW ZTE ZXR10`);
  const statusLink2 = await L2SW_ZTE_ZXR10({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
