// SITE ID : BLK001
// LINK 1  : L2SW ZTE ZXR10 VIA METRO
// LINK 2  : L2SW ZTE ZXR10 VIA METRO

import L2SW_ZTE_ZXR10_VIA_METRO from '../devices/L2SW_ZTE_ZXR10_VIA_METRO.js';
import updateStatusCounter from '../utils/update-status-counter.js';

async function site({ index, msg, site, sshConfig, countStatusLink }) {
  let telnetConfig;

  // LINK 1
  telnetConfig = {
    username: 'mso7-haris',
    password: 'JuliAgus@2024',
    host: 'ME-D7-SIN',
    command: 'display interface GigabitEthernet0/8/8',
  };
  console.log(`  > Link 1: L2SW ZTE ZXR10 VIA METRO`);
  const statusLink1 = await L2SW_ZTE_ZXR10_VIA_METRO({ sshConfig, telnetConfig });

  // LINK 2
  telnetConfig = {
    username: 'mso7-haris',
    password: 'JuliAgus@2024',
    host: 'ME-D7-SIN',
    command: 'display interface GigabitEthernet0/9/0',
  };
  console.log(`  > Link 2: L2SW ZTE ZXR10 VIA METRO`);
  const statusLink2 = await L2SW_ZTE_ZXR10_VIA_METRO({ sshConfig, telnetConfig });

  // UPDATE COUNTER
  updateStatusCounter(countStatusLink, statusLink1, statusLink2);

  // CREATE & SEND MESSAGE
  msg += `${index + 1}. ${site.subdistrict} | ${site.id} | ${statusLink1} | ${statusLink2} |\n`;
  return msg;
}

export default site;
