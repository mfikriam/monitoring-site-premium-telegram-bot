// SITE ID : TER006
// LINK 1  : L2SW Fiberhome S5800
// LINK 2  : L2SW Fiberhome S5800

import config from '../utils/config.js';
import L2SW_Fiberhome_S5800 from '../devices/L2SW_Fiberhome_S5800.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;
  const { username, password } = config.ne[0];

  // LINK 1
  telnetConfig = {
    username: 'admin',
    password: '12345',
    host: '10.199.238.6',
    command: 'show rlink interface xgigaethernet 1/1/1',
    keyword: 'up/up',
  };
  console.log(`  > Link 1: L2SW Fiberhome S5800`);
  const statusLink1 = await L2SW_Fiberhome_S5800({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username: 'admin',
    password: '12345',
    host: '10.199.238.6',
    command: 'show rlink interface xgigaethernet 1/1/2',
    keyword: 'up/up',
  };
  console.log(`  > Link 2: L2SW Fiberhome S5800`);
  const statusLink2 = await L2SW_Fiberhome_S5800({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
