// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';

// IMPORT DATA
import allowedKPUSites from '../data/allowed-kpu-sites.js';

// IMPORT HANDLERS
import excelHandler from './excel-handler.js';

// IMPORT DEVICES
import OLT_ZTE_CSERIES from '../single-port-check-devices/OLT_ZTE_CSERIES.js';
import OLT_ALU from '../single-port-check-devices/OLT_ALU.js';
import OLT_FH_A5161 from '../single-port-check-devices/OLT_FH_A5161.js';
import OLT_FH_A5261 from '../single-port-check-devices/OLT_FH_A5261.js';
import OLT_FH_A5261v2 from '../single-port-check-devices/OLT_FH_A5261v2.js';
import METRO from '../single-port-check-devices/METRO.js';

async function getStatusLink(site, defaultConfig) {
  // DEFINE SSH & NE CONFIG
  let sshConfig = defaultConfig.gpon.nms;
  let neConfig = defaultConfig.gpon.ne;
  if (site.device === 'METRO') {
    sshConfig = defaultConfig.metro.nms;
    neConfig = defaultConfig.metro.ne;
  }

  // CHECK DEVICE
  switch (site.device) {
    case 'OLT ZTE C600':
    case 'OLT ZTE C300':
    case 'OLT ZTE C300v2':
      return await OLT_ZTE_CSERIES({ sshConfig, site, neConfig });
    case 'OLT ALU':
      return await OLT_ALU({ sshConfig, site, neConfig });
    case 'OLT FH A5161':
      return await OLT_FH_A5161({ sshConfig, site, neConfig });
    case 'OLT FH A5261':
      return await OLT_FH_A5261({ sshConfig, site, neConfig });
    case 'OLT FH A5261v2':
      return await OLT_FH_A5261v2({ sshConfig, site, neConfig });
    case 'METRO':
      return await METRO({ sshConfig, site, neConfig });
    default:
      console.log(`    - Device ${site.device} Not Recognized`);
      return '🟨';
  }
}

async function monitoringKPUHandler(msg, defaultConfig) {
  // GENERATE INITIAL MESSAGE
  msg += `<b>REPORT MONITORING SITE KPU MSO TIF-4</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // INITIALIZE COUNT STATUS LINK
  const countStatusIpTransit = { up: 0, down: 0, others: 0 };
  const countStatusMetroBackhaul = { up: 0, down: 0, others: 0 };
  const countStatusMetroChild = { up: 0, down: 0, others: 0 };

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
    'IP TRANSIT',
    'METRO BACKHAUL',
  ];

  // GET KPU CONFIG
  const kpuConfig = await excelHandler('kpu-config.xlsx');
  if (kpuConfig.length === 0) return null;

  // GET ALLOWED KPU SITES
  const kpuSites = kpuConfig.filter((site) => allowedKPUSites.includes(site.name));

  // INITIALIZE INDEX SITES
  let indexSite = 0;

  // Metro E Child
  for (let i = 0; i < subdistricts.length; i++) {
    // GET SUBDISTRICT
    const subdistrict = subdistricts[i];

    // FILTER KPU CONFIG BASED ON SUBDISTRICT
    const filteredSites = kpuSites.filter((site) => site.subdistrict === subdistrict);

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
      const status = await getStatusLink(site, defaultConfig);

      // UPDATE COUNT LINK STATUS
      switch (status) {
        case '✅':
          if (subdistrict === 'IP TRANSIT') countStatusIpTransit.up++;
          else if (subdistrict === 'METRO BACKHAUL') countStatusMetroBackhaul.up++;
          else countStatusMetroChild.up++;
          break;
        case '❌':
          siteLOS.push(site);
          if (subdistrict === 'IP TRANSIT') countStatusIpTransit.down++;
          else if (subdistrict === 'METRO BACKHAUL') countStatusMetroBackhaul.down++;
          else countStatusMetroChild.down++;
          break;
        default:
          siteLOS.push(site);
          if (subdistrict === 'IP TRANSIT') countStatusIpTransit.others++;
          else if (subdistrict === 'METRO BACKHAUL') countStatusMetroBackhaul.others++;
          else countStatusMetroChild.others++;
          break;
      }

      // ADD STATUS TO TEXT MESSAGE
      if (subdistrict === 'IP TRANSIT' || subdistrict === 'METRO BACKHAUL') {
        msg += `${site.note} ${status} | `;
      } else {
        msg += `${site.name} ${status} | `;
      }
    }

    // ADD DATEK SITE LOS TO MESSAGE
    if (siteLOS.length > 0) {
      msg += `\n\n`;
      siteLOS.forEach((site) => {
        if (subdistrict === 'IP TRANSIT' || subdistrict === 'METRO BACKHAUL') {
          msg += `- ${site.name}, ${site.note}, ${site.hostname}, ${site.ip}, ${site.interface}, ${site.sn}\n`;
        } else {
          msg += `- ${site.name}, ${site.hostname}, ${site.ip}, ${site.interface}, ${site.sn}\n`;
        }
      });
    }

    // ADD NEWLINE
    if (sortedSites.length > 0) msg += `\n`;
    if (siteLOS.length === 0) msg += `\n`;
    msg += `\n`;
  }

  // COUNT TOTAL SITES
  const totalIpTransit = Object.values(countStatusIpTransit).reduce((sum, value) => sum + value, 0);
  const totalMetroBackhaul = Object.values(countStatusMetroBackhaul).reduce((sum, value) => sum + value, 0);
  const totalMetroChild = Object.values(countStatusMetroChild).reduce((sum, value) => sum + value, 0);

  // GENERATE SUMMARY
  msg += `<b>Layanan KPU Milenet | Total |  Total UP | Total Down</b>\n`;
  msg += `IP Transit | ${totalIpTransit} | ${countStatusIpTransit.up} | ${countStatusIpTransit.down}\n`;
  msg += `Metro E Back Haul | ${totalMetroBackhaul} | ${countStatusMetroBackhaul.up} | ${countStatusMetroBackhaul.down}\n`;
  msg += `Metro E Child | ${totalMetroChild} | ${countStatusMetroChild.up} | ${countStatusMetroChild.down}\n`;

  return msg;
}

export default monitoringKPUHandler;
