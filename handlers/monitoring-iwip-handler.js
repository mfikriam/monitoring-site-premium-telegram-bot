// Import Handlers
import excelHandler from './excel-handler.js';

// Import Utilities
import currentDateTime from '../utils/get-current-datetime.js';

// Import Devices
import METRO from '../iwip-devices/METRO.js';

async function deviceHandler(defaultConfig, datek, resObj) {
  // Define NMS and NE Config
  const nmsConfig = datek.ne === 'METRO' ? { ...defaultConfig.metro.nms } : { ...defaultConfig.gpon.nms };
  const neConfig = datek.ne === 'METRO' ? { ...defaultConfig.metro.ne } : { ...defaultConfig.gpon.ne };

  // Overwrite NE Config if provided
  if (datek.username_ne && datek.username_ne !== 'username_nms') {
    neConfig.username = datek.username_ne;
    neConfig.password = datek.password_ne;
  }

  const deviceParams = { nmsConfig, neConfig, datek, resObj };

  switch (datek.ne) {
    case 'METRO':
      return await METRO(deviceParams);

    default:
      console.log(`    - Device ${ne} Not Recognized`);
  }
}

async function monitoringPremiumHandler(msg, defaultConfig) {
  // Get Dateks
  const dateks = await excelHandler('datek-cluster-iwip.xlsx');

  // Initial Message
  msg += `<b>REPORT MONITORING CLUSTER IWIP</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Declare variables
  let routes = [];
  let interfacesNE = [];

  // ----------------------------- 1. Ring Metro-E via DWDM -----------------------------

  // Print title
  console.log(`[Ring Metro-E via DWDM]\n`);

  // Define routes for Metro-E via DWDM
  routes = ['SFI', 'WDA', 'IWP', 'MBA', 'SFI'];
  // routes = ['SFI', 'WDA'];

  // Define Interfaces NE for Metro-E via DWDM
  interfacesNE = [
    { src: 'SFI', dest: 'WDA', group_interface: 'Eth-Trunk25' },
    { src: 'WDA', dest: 'IWP', group_interface: 'Eth-Trunk11' },
    { src: 'IWP', dest: 'MBA', group_interface: 'Eth-Trunk25' },
    { src: 'MBA', dest: 'SFI', group_interface: 'Eth-Trunk23' },
  ];

  // Add title to message
  msg += `1. Ring Metro-E via DWDM\n`;
  msg += `${routes[0]}`;

  // Loop through routes and update datek objects
  for (let i = 0; i < routes.length - 1; i++) {
    // Get source and destination
    const src = routes[i];
    const dest = routes[i + 1];

    // Find the datek object for the source
    const datek = dateks.find((data) => data.id === src);
    datek.group_interface = interfacesNE.find((route) => route.src === src && route.dest === dest).group_interface;

    // Initialize result object
    const resObj = { currentBW: '#', maxBW: '#', statusLink: '🟨', interfaces: [] };

    // Print route title
    console.log(`${i + 1}. ${src} → ${dest}`);

    // Call deviceHandler
    await deviceHandler(defaultConfig, datek, resObj);

    // Add result object to message
    msg += ` &lt;${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}&gt; ${dest}`;
  }
  msg += `\n`;

  return msg;
}

export default monitoringPremiumHandler;
