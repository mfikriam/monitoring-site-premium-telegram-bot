// IMPORT HANDLERS
import excelHandler from './excel-handler.js';
import singlePcdHandler from './single-pcd-handler.js';

// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';
import getStatusDesc from '../utils/get-status-descriptions.js';

function updateCounterPremium(countStatus, statusLink1, statusLink2) {
  const lossStatus = ['❌', '⬛'];

  if (statusLink1 === '✅' && statusLink2 === '✅') {
    countStatus.up2Link += 1; // Both links are up
  } else if (statusLink1 === '❌' && statusLink2 === '❌') {
    countStatus.down2Link += 1; // Both links are down
  } else if ((statusLink1 === '❌' && statusLink2 === '⬛') || (statusLink1 === '⬛' && statusLink2 === '❌')) {
    countStatus.down2Link += 1; // One link is down, the other is unknown
  } else if (statusLink1 === '✅' && lossStatus.includes(statusLink2)) {
    countStatus.up1Link += 1; // Link 1 is up, Link 2 is down or unknown
  } else if (lossStatus.includes(statusLink1) && statusLink2 === '✅') {
    countStatus.up1Link += 1; // Link 2 is up, Link 1 is down or unknown
  } else {
    countStatus.others += 1; // All other cases
  }
}

// Function to add delay
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function getStatusLink(site, defaultConfig) {
  // INITIALIZE VARIABLES
  const { ne, link } = site;
  const nmsConfig = ne === 'METRO' ? { ...defaultConfig.metro.nms } : { ...defaultConfig.gpon.nms };
  const neConfig = ne === 'METRO' ? { ...defaultConfig.metro.ne } : { ...defaultConfig.gpon.ne };

  // PRINT LINK TITLE
  console.log(`  > ${link}: ${ne}`);

  // HANDLE UNMONITORED LINKS
  if (ne === 'Unmonitor') {
    console.log(`    - Status Link: Unmonitor ⬛`);
    return '⬛';
  }

  // OVERWRITE NE CONFIG
  if (site.username_ne && site.username_ne !== 'username_nms') {
    neConfig.username = site.username_ne;
    neConfig.password = site.password_ne;
  }

  return await singlePcdHandler({ nmsConfig, neConfig, site });
}

async function monitoringPremiumHandler(msg, defaultConfig) {
  // GENERATE INITIAL MESSAGE
  msg += `<b>REPORT MONITORING SITE PREMIUM MSO TIF-4</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;
  msg += `Subdistrict | Site ID | Link 1 | Link 2 |\n`;

  // INITIALIZE VARIABLES
  const countStatus = { up2Link: 0, up1Link: 0, down2Link: 0, others: 0 };
  const allowedSites = [];
  // allowedSites.push('BLK001');

  // GET DATA SITES
  const premiumSites = await excelHandler('premium-sites.xlsx');
  if (premiumSites.length === 0) return null;

  // FILTER SITES
  const filteredSites =
    allowedSites.length > 0 ? premiumSites.filter((site) => allowedSites.includes(site.site_id)) : premiumSites;

  // GET SITE IDS
  const uniqueSiteIds = [...new Set(filteredSites.map((item) => item.site_id))];

  // MONITORING SITES
  for (const [index, siteId] of uniqueSiteIds.entries()) {
    // GET LINK DATA
    const link1 = filteredSites.find((item) => item.site_id === siteId && item.link === 'Link 1');
    const link2 = filteredSites.find((item) => item.site_id === siteId && item.link === 'Link 2');
    const site = link1;

    // PRINT SITE TITLE
    console.log(`${index + 1}. ${site.subdistrict} - ${site.site_id} - ${site.site_name}`);

    // GET STATUS LINK
    const statusLink1 = await getStatusLink(link1, defaultConfig);
    await delay(1000); // Wait for 1 second
    const statusLink2 = await getStatusLink(link2, defaultConfig);
    await delay(1000); // Wait for 1 second
    const descLink1 = getStatusDesc(statusLink1);
    const descLink2 = getStatusDesc(statusLink2);

    // UPDATE COUNTER
    updateCounterPremium(countStatus, statusLink1, statusLink2);

    // ADD STATUS LINKS TO MESSAGE
    msg += `${index + 1}. ${site.subdistrict} | ${site.site_id} | `;
    msg += `${descLink1} ${statusLink1} | `;
    msg += `${descLink2} ${statusLink2} |\n`;

    // ADD LOS LINK TO MESSAGE
    if (statusLink1 === '❌') {
      msg += `- ${link1.link}: ${link1.hostname_ne}, ${link1.ip_ne}, ${link1.interface_port_ne}, ${link1.sn_ont}\n`;
    }
    if (statusLink2 === '❌') {
      msg += `- ${link2.link}: ${link2.hostname_ne}, ${link2.ip_ne}, ${link2.interface_port_ne}, ${link2.sn_ont}\n`;
    }
    if (statusLink1 === '❌' || statusLink2 === '❌') msg += `\n`;
  }

  // GENERATE SUMMARY
  let summary = `\n`;
  summary += `Summary Report : Up 2 Link | Up 1 Link | Down 2 Link | Others\n`;
  summary += `${countStatus.up2Link} | ${countStatus.up1Link} | ${countStatus.down2Link} | ${countStatus.others}\n`;

  // PRINT AND ADD SUMMARY TO MESSAGE
  console.log(summary);
  msg += summary;

  return msg;
}

export default monitoringPremiumHandler;
