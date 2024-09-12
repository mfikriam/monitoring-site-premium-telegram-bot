// SITE ID : TIM001
// LINK 1  : L2SW ZTE ZXR10
// LINK 2  : ONT ZTE C300

import L2SW_ZTE_ZXR10 from '../devices/L2SW_ZTE_ZXR10.js';
import config from '../utils/config.js';
import ONT_ZTE_C300 from '../devices/ONT_ZTE_C300.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;
  const { username, password } = config.ne[0];

  // LINK 1
  telnetConfig = {
    username: 'zxr10',
    password: 'zxr10',
    host: '10.199.158.194',
    command: ['enable', 'show interface gei-0/1/1/1'],
    keyword: 'gei-0/1/1/1 is up',
  };
  console.log(`  > Link 1: L2SW ZTE ZXR10`);
  const statusLink1 = await L2SW_ZTE_ZXR10({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username,
    password,
    host: 'GPON00-D7-TIM-3',
    command: 'show gpon onu detail gpon-onu_1/3/1:12',
  };
  console.log(`  > Link 2: ONT ZTE C300`);
  const statusLink2 = await ONT_ZTE_C300({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
