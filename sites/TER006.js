// SITE ID : TER006
// LINK 1  : ONT Fiberhome A5161
// LINK 2  : Unmonitor

import config from '../utils/config.js';
import ONT_Fiberhome_A5161 from '../devices/ONT_Fiberhome_A5161.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;
  const { username, password } = config.ne[0];

  // LINK 1
  telnetConfig = {
    username,
    password,
    host: 'GPON01-D7-JLL-4',
    command: ['cd onu', 'show onu_state slot 2 pon 8 onu 1'],
    keyword: 'active',
  };
  console.log(`  > Link 1: ONT Fiberhome A5161`);
  const statusLink1 = await ONT_Fiberhome_A5161({ sshConfig, telnetConfig });

  // LINK 2
  console.log(`  > Link 2: Unmonitor ⬛`);
  const statusLink2 = 'Unmonitor ⬛';

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
