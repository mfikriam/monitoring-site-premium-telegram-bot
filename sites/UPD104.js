// SITE ID : UPD104
// LINK 1  : ONT Fiberhome A5161
// LINK 2  : ONT ZTE C300

import config from '../utils/config.js';
import ONT_Fiberhome_A5161 from '../devices/ONT_Fiberhome_A5161.js';
import ONT_ZTE_C300 from '../devices/ONT_ZTE_C300.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;
  const { username, password } = config.ne[0];

  // LINK 1
  telnetConfig = {
    username,
    password,
    host: 'GPON07-D7-PNK-4',
    command: ['config', 'show authorization 1/13/15 | include FHTT05e879f0'],
    keyword: 'up',
  };
  console.log(`  > Link 1: ONT Fiberhome A5161`);
  const statusLink1 = await ONT_Fiberhome_A5161({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username,
    password,
    host: 'GPON02-D7-PNK-3',
    command: 'show gpon onu detail gpon-onu_1/4/13:50',
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
