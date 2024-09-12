// SITE ID : JAP368
// LINK 1  : ONT ZTE C600
// LINK 2  : ONT ZTE C600

import config from '../utils/config.js';
import ONT_ZTE_C600 from '../devices/ONT_ZTE_C600.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;
  const { username, password } = config.ne[0];

  // LINK 1
  telnetConfig = {
    username,
    password,
    host: 'GPON04-D7-JAP-3',
    command: 'show gpon onu detail-info gpon_onu-1/9/6:50',
  };
  console.log(`  > Link 1: ONT ZTE C600`);
  const statusLink1 = await ONT_ZTE_C600({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username,
    password,
    host: 'GPON02-D7-JPB-3',
    command: 'show gpon onu detail-info gpon_onu-1/1/16:1',
  };
  console.log(`  > Link 2: ONT ZTE C600`);
  const statusLink2 = await ONT_ZTE_C600({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
