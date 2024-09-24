// SITE ID : JAP246
// LINK 1  : L2SW Fiberhome Citrans VIA METRO
// LINK 2  : L2SW Fiberhome Citrans VIA METRO

import config from '../utils/config.js';
import L2SW_Fiberhome_Citrans_VIA_METRO from '../devices/L2SW_Fiberhome_Citrans_VIA_METRO.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;
  const { username, password } = config.ne[1];

  // LINK 1
  telnetConfig = {
    username,
    password,
    host: 'ME-D7-STN',
    command: 'dis int gi3/1/1',
  };
  console.log(`  > Link 1: L2SW Fiberhome Citrans VIA METRO`);
  const statusLink1 = await L2SW_Fiberhome_Citrans_VIA_METRO({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username,
    password,
    host: 'ME-D7-STN',
    command: 'dis int gi2/1/5',
  };
  console.log(`  > Link 2: L2SW Fiberhome Citrans VIA METRO`);
  const statusLink2 = await L2SW_Fiberhome_Citrans_VIA_METRO({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
