// IMPORT HANDLERS
import excelHandler from './excel-handler.js';
import multiPcdHandler from './multi-pcd-handler.js';

// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';
import getStatusDesc from '../utils/get-status-descriptions.js';

async function getStatusLinks(linksObj, defaultConfig) {
  const site = linksObj[0];
  const nmsConfig = site.ne === 'METRO' ? { ...defaultConfig.metro.nms } : { ...defaultConfig.gpon.nms };
  const neConfig = site.ne === 'METRO' ? { ...defaultConfig.metro.ne } : { ...defaultConfig.gpon.ne };

  // PRINT LINK TITLE
  console.log(`  > Link: ${site.ne}`);

  // OVERWRITE NE CONFIG
  if (site.username_ne && site.username_ne !== 'username_nms') {
    neConfig.username = site.username_ne;
    neConfig.password = site.password_ne;
  }

  await multiPcdHandler({ nmsConfig, neConfig, site, linksObj });

  // console.log(linksObj);
}

async function monitoringPremiumHandler(msg, defaultConfig) {
  // GENERATE INITIAL MESSAGE
  msg += `<b>REPORT MONITORING SITE IWIP, MABA, & WEDA</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;
  msg += `Site | IP NTE | Current BW (Max BW)\n`;
  msg += `\n`;

  // INITIALIZE VARIABLES
  const allowedSites = [];
  // allowedSites.push('ME-D7-IWP');

  // GET DATA SITES
  const iwipSites = await excelHandler('iwip-sites.xlsx');
  if (iwipSites.length === 0) return null;

  // FILTER SITES
  const filteredSites =
    allowedSites.length > 0 ? iwipSites.filter((site) => allowedSites.includes(site.site_id)) : iwipSites;

  // GET SITE IDS
  const uniqueSiteIds = [...new Set(filteredSites.map((item) => item.site_id))];

  // MONITORING SITES
  for (const [index, siteId] of uniqueSiteIds.entries()) {
    // GET LINKS
    const links = filteredSites.filter((site) => site.site_id === siteId);

    // DEFINE SITE
    const site = links[0];

    // DEFINE LINK OBJECT
    const linksObj = [];
    links.forEach((link) => {
      linksObj.push({ ...link, currentBW: 0, maxBW: 0, statusLink: '🟨' });
    });

    // PRINT SITE TITLE
    console.log(`${index + 1}. ${site.site_id} - ${site.ne}`);

    // GET STATUS LINKS
    await getStatusLinks(linksObj, defaultConfig);

    // CALCULATE THE SUM OF currentBW AND maxBW
    const totals = linksObj.reduce(
      (acc, item) => {
        acc.currentBW += item.currentBW;
        acc.maxBW += item.maxBW;
        return acc;
      },
      { currentBW: 0, maxBW: 0 }, // Initial values
    );
    const currentBW = totals.currentBW === 0 ? '#' : `${totals.currentBW}G`;
    const maxBW = totals.maxBW === 0 ? '#' : `${totals.maxBW}G`;

    // ADD SUBDISTRCT TITLE TO MESSAGE
    msg += `<b>${index + 1}. ${site.site_id} | ${site.ip_ne} | ${currentBW} (${maxBW})</b>\n`;

    // ADD LINKS TO MESSAGE
    for (const link of linksObj) {
      const statusDesc = getStatusDesc(link.statusLink);
      const currentBW = link.currentBW === 0 ? '#' : `${link.currentBW}G`;
      const maxBW = link.maxBW === 0 ? '#' : `${link.maxBW}G`;
      msg += `- ${link.site_id} → ${link.site_dest}, `;
      msg += `${currentBW} (${maxBW}), `;
      msg += `${link.interface_port_ne}, ${statusDesc} ${link.statusLink}\n`;
    }

    // ADD NEW LINE
    msg += `\n`;
  }

  return msg;
}

export default monitoringPremiumHandler;
