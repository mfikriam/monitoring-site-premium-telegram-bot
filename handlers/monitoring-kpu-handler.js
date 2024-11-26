import yargs from 'yargs';
import { hideBin } from 'yargs/helpers'; // Required for parsing arguments with ES Modules

// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';

// IMPORT DATA
import allowedKPUSites from '../data/allowed-kpu-sites.js';

// IMPORT HANDLERS
import excelHandler from './excel-handler.js';

// IMPORT DEVICES
import OLT_ZTE_CSERIES from '../new-devices/OLT_ZTE_CSERIES.js';
import OLT_ALU from '../new-devices/OLT_ALU.js';
import OLT_FH_A5161 from '../new-devices/OLT_FH_A5161.js';
import OLT_FH_A5261 from '../new-devices/OLT_FH_A5261.js';
import OLT_FH_A5261v2 from '../new-devices/OLT_FH_A5261v2.js';
import METRO from '../new-devices/METRO.js';

async function getStatusLink(site) {
  // GET SERVER LOCATION
  const argv = yargs(hideBin(process.argv)) // Parse the command-line arguments
    .option('server', {
      alias: 's',
      type: 'string',
      description: 'Server location',
      default: 'kosong', // Set a default value
    })
    .parse(); // Explicitly call .parse() when using ES Modules
  let hostGPON;
  let hostMETRO;
  switch (argv.server) {
    case 'sentul':
      hostGPON = '10.60.190.16';
      hostMETRO = '10.60.190.15';
      break;
    case 'jatinegara':
      hostGPON = '10.62.165.21';
      hostMETRO = '10.62.170.56';
      break;
    default:
      hostGPON = process.env.GPON_NMS_HOST;
      hostMETRO = process.env.METRO_NMS_HOST;
      break;
  }

  // DEFICE SSH & NE CONFIG
  let sshConfig = {};
  let neConfig = {};
  if (site.device === 'METRO') {
    sshConfig = {
      host: hostMETRO,
      username: process.env.METRO_NMS_USERNAME,
      password: process.env.METRO_NMS_PASSWORD,
      port: Number(process.env.METRO_NMS_PORT),
    };
    neConfig = { username: process.env.METRO_NE_USERNAME, password: process.env.METRO_NE_PASSWORD };
  } else {
    sshConfig = {
      host: hostGPON,
      username: process.env.GPON_NMS_USERNAME,
      password: process.env.GPON_NMS_PASSWORD,
      port: Number(process.env.GPON_NMS_PORT),
    };
    neConfig = { username: process.env.GPON_NE_USERNAME, password: process.env.GPON_NE_PASSWORD };
  }

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

  if (site.device === 'METRO') {
    return await METRO({ sshConfig, site, neConfig });
  }

  console.log(`    - Device ${site.device} Not Recognized`);
  return '🟨';
}

async function monitoringKPUHandler(msg) {
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
      const status = await getStatusLink(site);

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
        // msg += `${site.name}, ${site.note} ${status} | `;
        msg += `${site.note} ${status} | `;
      } else {
        msg += `${site.name} ${status} | `;
      }
    }

    // ADD SITE LOS TO MESSAGE
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
