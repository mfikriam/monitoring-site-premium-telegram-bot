// Import Devices
import SMETRO from '../special-devices/SMALL_METRO.js';

// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';

async function monitoringDonggalaHandler(msg, defaultConfig) {
  // Generate Intial Message
  msg += `<b>Report Pantai Barat Donggala</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Define Configs
  const nmsConfig = { ...defaultConfig.metro.nms };
  const neConfig = { ...defaultConfig.metro.ne };

  // Define site
  const site = {
    site_id: 'PGI063',
    site_name: 'MSO Posona',
    ne: 'METRO',
    hostname_ne: 'SME-D7-TBU',
    ip_ne: '172.31.250.64',
  };

  // Define ports
  const linksObj = [
    { name: 'TWI-TBU', port: 'GE0/1/0.13', status: '-' },
    { name: 'TBU-PGI', port: 'GE0/3/0.14', status: '-' },
    { name: 'TBU-STG', port: 'GE0/1/1.15', status: '-' },
  ];

  // Print Site Title
  console.log(`1. Site ${site.site_id} - ${site.site_name}`);

  // Print Link Titile
  console.log(`  > Link: ${site.ne} ${site.hostname_ne} (${site.ip_ne})`);

  // Check links status
  await SMETRO({ nmsConfig, neConfig, site, linksObj });

  // Add links status to message
  for (const link of linksObj) {
    msg += `${link.name} (${link.port}) : ${link.status}\n`;
  }

  return msg;
}

export default monitoringDonggalaHandler;
