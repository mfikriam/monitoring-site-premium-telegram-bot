import premiumSites from '../data/premium-sites.js';
import printSiteTitleMsg from '../utils/print-site-title-msg.js';
import config from '../utils/config.js';

// PREMIUM SITES
import JAP368 from '../sites/JAP368.js';
import JAP423 from '../sites/JAP423.js';
import BIA038 from '../sites/BIA038.js';
import UPD104 from '../sites/UPD104.js';
import PAL005 from '../sites/PAL005.js';
import PAL125 from '../sites/PAL125.js';
import MDO492 from '../sites/MDO492.js';
import PAL356 from '../sites/PAL356.js';
import JAP246 from '../sites/JAP246.js';
import BLK001 from '../sites/BLK001.js';
import ADL007 from '../sites/ADL007.js';
import TIM001 from '../sites/TIM001.js';
import SDR006 from '../sites/SDR006.js';
import WTG001 from '../sites/WTG001.js';
import MDO029 from '../sites/MDO029.js';
import PAL006 from '../sites/PAL006.js';
import PAL016 from '../sites/PAL016.js';
import MDO004 from '../sites/MDO004.js';
import UNH001 from '../sites/UNH001.js';
import TDO009 from '../sites/TDO009.js';
import TER006 from '../sites/TER006.js';
import WTP005 from '../sites/WTP005.js';
import BAU006 from '../sites/BAU006.js';
import LBA005 from '../sites/LBA005.js';
import BAU027 from '../sites/BAU027.js';
import KDI010 from '../sites/KDI010.js';

async function monitoringSitesHandler(msg, countStatusLink) {
  // SORT THE SITES BASED ON ITS ID
  premiumSites.sort((a, b) => a.id.localeCompare(b.id));

  // SORT THE SITES BASED ON ITS SUBDISTRICT
  premiumSites.sort((a, b) => a.subdistrict.localeCompare(b.subdistrict));

  for (let index = 0; index < premiumSites.length; index++) {
    // DEFINE SITE
    const site = premiumSites[index];

    // PRINT SITE TITLE
    printSiteTitleMsg({ index, site });

    // PROCESS SITE BASED ON ITS ID
    switch (site.id) {
      case 'JAP368':
        msg = await JAP368({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'JAP423':
        msg = await JAP423({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'BIA038':
        msg = await BIA038({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'UPD104':
        msg = await UPD104({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'PAL005':
        msg = await PAL005({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'PAL125':
        msg = await PAL125({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'MDO492':
        msg = await MDO492({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'PAL356':
        msg = await PAL356({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'JAP246':
        // msg = await JAP246({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        msg = await JAP246({ index, msg, countStatusLink, site, sshConfig: config.nms.metro });
        break;
      case 'BLK001':
        msg = await BLK001({ index, msg, countStatusLink, site, sshConfig: config.nms.metro });
        break;
      case 'ADL007':
        msg = await ADL007({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'TIM001':
        msg = await TIM001({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'SDR006':
        msg = await SDR006({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'WTG001':
        msg = await WTG001({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'MDO029':
        msg = await MDO029({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'PAL006':
        msg = await PAL006({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'PAL016':
        msg = await PAL016({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'MDO004':
        msg = await MDO004({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'UNH001':
        msg = await UNH001({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'TDO009':
        msg = await TDO009({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'TER006':
        msg = await TER006({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'WTP005':
        msg = await WTP005({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'BAU006':
        msg = await BAU006({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'LBA005':
        msg = await LBA005({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'BAU027':
        msg = await BAU027({ index, msg, countStatusLink, site, sshConfig: config.nms.gpon });
        break;
      case 'KDI010':
        msg = await KDI010({ index, msg, countStatusLink, site, sshConfig: config.nms.metro });
        break;
      default:
        console.log(`   Site ${site.id} Not Recognized`);
        msg += `${index + 1}. Site ${site.id} Not Recognized\n`;
        break;
    }
  }

  return msg;
}

export default monitoringSitesHandler;
