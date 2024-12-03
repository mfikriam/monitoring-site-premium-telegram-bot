// IMPORT HANDLERS
import excelHandler from './excel-handler.js';
import singlePcdHandler from './single-pcd-handler.js';

// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';

function updateCounterKPU(
  statusLink,
  subdistrict,
  countStatusIpTransit,
  countStatusMetroBackhaul,
  countStatusMetroChild,
) {
  switch (statusLink) {
    case '✅':
      if (subdistrict === 'IP TRANSIT') countStatusIpTransit.up++;
      else if (subdistrict === 'METRO BACKHAUL') countStatusMetroBackhaul.up++;
      else countStatusMetroChild.up++;
      break;
    case '❌':
      if (subdistrict === 'IP TRANSIT') countStatusIpTransit.down++;
      else if (subdistrict === 'METRO BACKHAUL') countStatusMetroBackhaul.down++;
      else countStatusMetroChild.down++;
      break;
    default:
      if (subdistrict === 'IP TRANSIT') countStatusIpTransit.others++;
      else if (subdistrict === 'METRO BACKHAUL') countStatusMetroBackhaul.others++;
      else countStatusMetroChild.others++;
      break;
  }
}

async function getStatusLink(site, defaultConfig) {
  // INITIALIZE VARIABLES
  const { ne } = site;
  const nmsConfig = ne === 'METRO' ? { ...defaultConfig.metro.nms } : { ...defaultConfig.gpon.nms };
  const neConfig = ne === 'METRO' ? { ...defaultConfig.metro.ne } : { ...defaultConfig.gpon.ne };

  // PRINT LINK TITLE
  console.log(`  > Link: ${ne}`);

  return await singlePcdHandler({ nmsConfig, neConfig, site });
}

async function monitoringKPUHandler(msg, defaultConfig) {
  // GENERATE INITIAL MESSAGE
  msg += `<b>REPORT MONITORING SITE KPU MSO TIF-4</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // INITIALIZE VARIABLES
  const countStatusIpTransit = { up: 0, down: 0, others: 0 };
  const countStatusMetroBackhaul = { up: 0, down: 0, others: 0 };
  const countStatusMetroChild = { up: 0, down: 0, others: 0 };
  let indexSite = 0;
  const allowedSites = [];
  // allowedSites.push('BIAK NUMFOR');

  // GET DATA SITES
  const kpuSites = await excelHandler('kpu-sites.xlsx');
  if (kpuSites.length === 0) return null;

  // FILTER SITES
  const filteredSites =
    allowedSites.length > 0 ? kpuSites.filter((site) => allowedSites.includes(site.site_name)) : kpuSites;

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

  // ACCESS SUBDISTRICT
  for (const [indexSubdistrict, subdistrict] of subdistricts.entries()) {
    // GET SITES BASED ON SUBDISTRICT
    const subdistrictSites = filteredSites.filter((site) => site.subdistrict === subdistrict);

    // SORT SITES KPU BASED ON SITE NAME (ASCENDING)
    const sortedSites = subdistrictSites.sort((a, b) => a.site_name.localeCompare(b.site_name));

    // ADD SUBDISTRCT TITLE TO MESSAGE
    msg += `<b>${indexSubdistrict + 1}. ${subdistrict} : ${sortedSites.length} Site\n</b>`;

    // INITIALIZED LOS SITES
    const losSites = [];

    // MONITORING SITES
    for (const site of sortedSites) {
      // PRINT SITE TITLE
      console.log(`${++indexSite}. ${site.subdistrict} - ${site.site_name}`);

      // GET STATUS LINK
      const statusLink = await getStatusLink(site, defaultConfig);

      // UPDATE COUNTER
      updateCounterKPU(statusLink, subdistrict, countStatusIpTransit, countStatusMetroBackhaul, countStatusMetroChild);

      // ADD LOS SITE TO ARRAY
      if (statusLink !== '✅') losSites.push(site);

      // ADD STATUS TO TEXT MESSAGE
      msg += `${
        subdistrict === 'IP TRANSIT' || subdistrict === 'METRO BACKHAUL' ? site.note : site.site_name
      } ${statusLink} | `;
    }

    // ADD DATEK LOS SITE TO MESSAGE
    if (losSites.length > 0) {
      msg += `\n\n`;
      losSites.forEach((site) => {
        const details =
          subdistrict === 'IP TRANSIT' || subdistrict === 'METRO BACKHAUL'
            ? `${site.site_name}, ${site.note}, ${site.hostname_ne}, ${site.ip_ne}, ${site.interface_port_ne}, ${site.sn_ont}`
            : `${site.site_name}, ${site.hostname_ne}, ${site.ip_ne}, ${site.interface_port_ne}, ${site.sn_ont}`;
        msg += `- ${details}\n`;
      });
    }

    // ADD NEWLINE
    if (sortedSites.length > 0) msg += `\n`;
    if (losSites.length === 0) msg += `\n`;
    msg += `\n`;
  }

  // COUNT TOTAL SITES
  const totalIpTransit = Object.values(countStatusIpTransit).reduce((sum, value) => sum + value, 0);
  const totalMetroBackhaul = Object.values(countStatusMetroBackhaul).reduce((sum, value) => sum + value, 0);
  const totalMetroChild = Object.values(countStatusMetroChild).reduce((sum, value) => sum + value, 0);

  // GENERATE SUMMARY
  let summary = '';
  summary += `<b>Layanan KPU Milenet | Total |  Total UP | Total Down</b>\n`;
  summary += `IP Transit | ${totalIpTransit} | ${countStatusIpTransit.up} | ${countStatusIpTransit.down}\n`;
  summary += `Metro E Back Haul | ${totalMetroBackhaul} | ${countStatusMetroBackhaul.up} | ${countStatusMetroBackhaul.down}\n`;
  summary += `Metro E Child | ${totalMetroChild} | ${countStatusMetroChild.up} | ${countStatusMetroChild.down}\n`;

  // PRINT AND ADD SUMMARY TO MESSAGE
  console.log();
  console.log(summary);
  msg += summary;

  return msg;
}

export default monitoringKPUHandler;
