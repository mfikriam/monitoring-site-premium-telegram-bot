// IMPORT DATA
import kpuSites from '../data/kpu-sites.js';

// IMPORT HANDLERS
import excelHandler from './excel-handler.js';

// IMPORT DEVICES
import OLT_ZTE_CSERIES from '../new-devices/OLT_ZTE_CSERIES.js';
import OLT_ALU from '../new-devices/OLT_ALU.js';
import OLT_FH_A5161 from '../new-devices/OLT_FH_A5161.js';
import OLT_FH_A5261 from '../new-devices/OLT_FH_A5261.js';
import OLT_FH_A5261v2 from '../new-devices/OLT_FH_A5261v2.js';

async function getStatusLink(site) {
  const sshConfig = {
    host: process.env.GPON_NMS_HOST,
    username: process.env.GPON_NMS_USERNAME,
    password: process.env.GPON_NMS_PASSWORD,
    port: Number(process.env.GPON_NMS_PORT),
  };

  const neConfig = {
    username: process.env.GPON_NE_USERNAME,
    password: process.env.GPON_NE_PASSWORD,
  };

  if (site.device.includes('OLT ZTE C')) {
    return await OLT_ZTE_CSERIES({ sshConfig, site, neConfig });
  }

  if (site.device === 'OLT ALU') {
    return await OLT_ALU({ sshConfig, site, neConfig });
  }

  if (site.device === 'OLT FH A5161') {
    return await OLT_FH_A5161({ sshConfig, site, neConfig });
  }

  if (site.device === 'OLT FH A5261') {
    return await OLT_FH_A5261({ sshConfig, site, neConfig });
  }

  if (site.device === 'OLT FH A5261v2') {
    return await OLT_FH_A5261v2({ sshConfig, site, neConfig });
  }

  console.log(`    - Device ${site.device} Not Recognized`);
  return '🟨';
}

async function monitoringKPUHandler(msg, countStatusLink) {
  // DEFINE SUBDISTRCTS
  const subdistricts = [
    'MAKASSAR',
    'SULSELBAR',
    'SULTRA',
    'SULTENG',
    'GORONTALO',
    'SULUT MALUT',
    'MALUKU',
    'JAYAPURA',
    'PAPUA BARAT',
  ];

  // GET KPU CONFIG
  const kpuConfig = await excelHandler('kpu-config.xlsx');

  // GET ALLOWED KPU SITES
  const sites = kpuConfig.filter((site) => kpuSites.includes(site.name));

  // INITIALIZE INDEX SITES
  let indexSite = 0;

  for (let i = 0; i < subdistricts.length; i++) {
    // GET SUBDISTRICT
    const subdistrict = subdistricts[i];

    // FILTER KPU CONFIG BASED ON SUBDISTRICT
    const filteredSites = sites.filter((site) => site.subdistrict === subdistrict);

    // SORT SITES KPU BASED ON SITE NAME (ASCENDING)
    const sortedSites = filteredSites.sort((a, b) => a.name.localeCompare(b.name));

    // GENERATE SUBDISTRICT TITLE
    msg += `<b>${i + 1}. ${subdistrict} : ${sortedSites.length} Site\n</b>`;

    // INITIALIZED SITE LOS
    const siteLOS = [];

    // GENERATE SITES STATUS
    for (const site of sortedSites) {
      // PRINT SITE TITLE
      console.log(`${++indexSite}. ${site.subdistrict} - ${site.name}`);
      console.log(`  > Link: ${site.device}`);

      // GET STATUS LINK
      const status = await getStatusLink(site);

      // UPDATE COUNT LINK STATUS
      switch (status) {
        case '✅':
          countStatusLink.up++;
          break;
        case '❌':
          siteLOS.push(site);
          countStatusLink.down++;
          break;
        default:
          siteLOS.push(site);
          countStatusLink.others++;
          break;
      }

      // ADD STATUS TO TEXT MESSAGE
      msg += `${site.name} ${status} | `;
    }

    // ADD SITE LOS TO MESSAGE
    if (siteLOS.length > 0) {
      msg += `\n\n`;
      siteLOS.forEach((site) => {
        msg += `- ${site.name}, ${site.hostname}, ${site.ip}, ${site.interface}, ${site.sn}\n`;
      });
    }

    // ADD NEWLINE
    if (sortedSites.length > 0) msg += `\n`;
    if (siteLOS.length === 0) msg += `\n`;
  }

  // GENERATE SUMMARY
  msg += `<b>Total : ${sites.length} Site</b>\n`;
  msg += `<b>Summary Report : Up | Down | Others</b>\n`;
  msg += `<b>${countStatusLink.up} | ${countStatusLink.down} | ${countStatusLink.others}</b>\n`;

  return msg;
}

export default monitoringKPUHandler;
