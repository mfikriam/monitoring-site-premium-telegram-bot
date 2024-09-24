// SITE ID : JAP246
// LINK 1  : L2SW Fiberhome Citrans
// LINK 2  : L2SW Fiberhome Citrans

import L2SW_Fiberhome_Citrans from '../../devices/L2SW_Fiberhome_Citrans.js';
import updateStatusCounter from '../../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;

  // LINK 1
  telnetConfig = {
    username: 'fiberhome',
    password: 'fiberhome',
    host: '10.199.157.78',
    command: 'show int XGE0/1/1',
  };
  console.log(`  > Link 1: L2SW Fiberhome Citrans`);
  const statusLink1 = await L2SW_Fiberhome_Citrans({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username: 'fiberhome',
    password: 'fiberhome',
    host: '10.199.157.78',
    command: 'show int XGE0/1/3',
  };
  console.log(`  > Link 2: L2SW Fiberhome Citrans`);
  const statusLink2 = await L2SW_Fiberhome_Citrans({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
