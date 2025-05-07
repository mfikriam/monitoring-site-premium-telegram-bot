// Import Handlers
import excelHandler from './excel-handler.js';

// Import Utilities
import currentDateTime from '../utils/get-current-datetime.js';

// Import Devices
import SPC_METRO from '../iwip-devices/SPC_METRO.js';
import MPC_METRO from '../iwip-devices/MPC_METRO.js';
import MPC_L2SW_FH_S5800_SERIES from '../iwip-devices/MPC_L2SW_FH_S5800_SERIES.js';
import SPC_L2SW_FH_S5800v1 from '../iwip-devices/SPC_L2SW_FH_S5800v1.js';
import SPC_L2SW_FH_S5800v2 from '../iwip-devices/SPC_L2SW_FH_S5800v2.js';
import MPC_L2SW_RAISECOM from '../iwip-devices/MPC_L2SW_RAISECOM.js';

async function deviceHandler(defaultConfig, datek, resObj) {
  // Define NMS and NE Config
  const nmsConfig = datek.ne.includes('METRO') ? { ...defaultConfig.metro.nms } : { ...defaultConfig.gpon.nms };
  const neConfig = datek.ne.includes('METRO') ? { ...defaultConfig.metro.ne } : { ...defaultConfig.gpon.ne };

  // Overwrite NE Config if provided
  if (datek.username_ne && datek.username_ne !== 'username_nms') {
    neConfig.username = datek.username_ne;
    neConfig.password = datek.password_ne;
  }

  const deviceParams = { nmsConfig, neConfig, datek, resObj };

  switch (datek.ne) {
    case 'SPC_METRO':
      return await SPC_METRO(deviceParams);
    case 'MPC_METRO':
      return await MPC_METRO(deviceParams);
    case 'SPC_L2SW_FH_S5800v1':
      return await SPC_L2SW_FH_S5800v1(deviceParams);
    case 'SPC_L2SW_FH_S5800v2':
      return await SPC_L2SW_FH_S5800v2(deviceParams);
    case 'MPC_L2SW_FH_S5800_SERIES':
      return await MPC_L2SW_FH_S5800_SERIES(deviceParams);
    case 'MPC_L2SW_RAISECOM':
      return await MPC_L2SW_RAISECOM(deviceParams);
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
  let losInterfaces = [];

  // ----------------------------- 1. Ring Metro-E via DWDM -----------------------------

  // Print title
  console.log(`[Ring Metro-E via DWDM]\n`);

  // Define routes for Metro-E via DWDM
  routes = ['SFI', 'WDA', 'IWP', 'MBA', 'SFI'];

  // Define Interfaces NE for Metro-E via DWDM
  interfacesNE = [
    { src: 'SFI', dest: 'WDA', group_interface: 'Eth-Trunk25', ne: 'SPC_METRO' },
    { src: 'WDA', dest: 'IWP', group_interface: 'Eth-Trunk11', ne: 'SPC_METRO' },
    { src: 'IWP', dest: 'MBA', group_interface: 'Eth-Trunk25', ne: 'SPC_METRO' },
    { src: 'MBA', dest: 'SFI', group_interface: 'Eth-Trunk23', ne: 'SPC_METRO' },
  ];

  // Add title to message
  msg += `<b>1. Ring Metro-E via DWDM</b>\n`;
  msg += `${routes[0]}`;

  // Loop through routes and update datek objects
  for (let i = 0; i < routes.length - 1; i++) {
    // Get source and destination
    const src = routes[i];
    const dest = routes[i + 1];

    // Print route title
    console.log(`${i + 1}. ${src} → ${dest}`);

    // Find the datek object for the source
    const datek = dateks.find((data) => data.id === src);
    const datekDest = dateks.find((data) => data.id === dest);

    // Get Datek NE
    datek.ne = interfacesNE.find((route) => route.src === src && route.dest === dest).ne;

    // Get Datek Group Interface
    datek.group_interface = interfacesNE.find((route) => route.src === src && route.dest === dest).group_interface;

    // Initialize result object
    const resObj = { currentBW: '#', maxBW: '#', statusLink: '🟨', interfaces: [] };

    // Call deviceHandler
    datek.ne = 'SPC_METRO';
    await deviceHandler(defaultConfig, datek, resObj);

    // Check if any interfaces is down
    if (resObj.statusLink === '❌') {
      resObj.interfaces.forEach((data) => {
        if (data.portStatus !== 'UP')
          losInterfaces.push(`- ${datek.hostname_ne} ${data.portName} &lt;&gt; ${datekDest.hostname_ne} LOS ❌`);
      });
    }

    // Add result object to message
    msg += ` &lt;${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}&gt; ${dest}`;
  }

  // Add LOS interfaces to message
  if (losInterfaces.length > 0) {
    msg += `\n\n<b>Link Down :</b>\n`;
    losInterfaces.forEach((data) => {
      msg += `${data}\n`;
    });
  }

  // Add new line
  msg += `\n`;

  // --------------------------- End of 1. Ring Metro-E via DWDM ---------------------------

  // ----------------------------- 2. Ring Metro-E via Radio IP -----------------------------

  // Print title
  console.log();
  console.log(`[Ring Metro-E via Radio IP]\n`);

  // Add title to message
  msg += `\n`;
  msg += `<b>2. Ring Metro-E via Radio IP</b>\n`;

  // Get datek for WDA
  const datek = dateks.find((data) => data.id === 'WDA');
  const datekDest = dateks.find((data) => data.id === 'IWP');

  // Print route title
  console.log(`1. WDA → IWP`);

  // Set interface NE
  datek.interfaces_ne = ['Eth-Trunk1.10', 'Eth-Trunk1.11', 'Eth-Trunk1.12', 'Eth-Trunk1.13'];

  // Set Datek NE
  datek.ne = 'MPC_METRO';

  // Initialize result object
  const resObj = {
    numUpInterfaces: '#',
    numInterfaces: '#',
    statusLink: '🟨',
    interfaces: datek.interfaces_ne.map((intf) => ({ portName: intf, portStatus: '#', resultString: '#' })),
  };

  // Call deviceHandler
  await deviceHandler(defaultConfig, datek, resObj);

  // Add result object to message
  msg += `WDA &lt;${resObj.numUpInterfaces}/${resObj.numInterfaces} ${resObj.statusLink}&gt; IWP`;

  // Check if any interfaces is down
  if (resObj.statusLink === '❌') {
    msg += `\n\n<b>Link Down :</b>\n`;
    resObj.interfaces.forEach((data) => {
      if (data.portStatus !== 'UP')
        msg += `- ${datek.hostname_ne} ${data.portName} &lt;&gt; ${datekDest.hostname_ne} LOS ❌\n`;
    });
  }

  // Add new line
  msg += `\n`;

  // -------------------------- End of 2. Ring Metro-E via Radio IP --------------------------

  // ------------------------------------- 3. Ring L2SW -------------------------------------

  // Print title
  console.log();
  console.log(`[Ring L2SW]\n`);

  // Define routes for L2SW
  routes = [
    'WDA',
    'SSU020',
    'IWP',
    'SSU005',
    'SSU043',
    'OLD-SSU007',
    'NEW-SSU007',
    'SSU015',
    'MBA012',
    'MBA',
    'BUL',
    'SFI',
    'SBM',
    'MBA',
  ];

  // Define Interfaces NE for L2SW
  interfacesNE = [
    { src: 'WDA', dest: 'SSU020', group_interface: 'Eth-Trunk5', ne: 'SPC_METRO' },
    { src: 'SSU020', dest: 'IWP', group_interface: 'eth-trunk 2', ne: 'SPC_L2SW_FH_S5800v1' },
    { src: 'IWP', dest: 'SSU005', group_interface: 'Eth-Trunk10', ne: 'SPC_METRO' },
    { src: 'SSU005', dest: 'SSU043', interfaces_ne: ['10gigaethernet 1/0/16'], ne: 'MPC_L2SW_FH_S5800_SERIES' },
    { src: 'SSU043', dest: 'OLD-SSU007', interfaces_ne: ['xgigaethernet 1/1/1'], ne: 'MPC_L2SW_FH_S5800_SERIES' },
    { src: 'OLD-SSU007', dest: 'NEW-SSU007', interfaces_ne: ['gigaethernet 1/0/1'], ne: 'MPC_L2SW_FH_S5800_SERIES' },
    {
      src: 'NEW-SSU007',
      dest: 'SSU015',
      group_interface: 'eth-trunk 1',
      ne: 'SPC_L2SW_FH_S5800v2',
    },
    {
      src: 'SSU015',
      dest: 'MBA012',
      group_interface: 'eth-trunk 2',
      ne: 'SPC_L2SW_FH_S5800v2',
    },
    {
      src: 'MBA012',
      dest: 'MBA',
      group_interface: 'eth-trunk 1',
      ne: 'SPC_L2SW_FH_S5800v2',
    },
    { src: 'MBA', dest: 'BUL', group_interface: 'Eth-Trunk9', ne: 'SPC_METRO' },
    {
      src: 'BUL',
      dest: 'SFI',
      interfaces_ne: ['port-channel 1'],
      ne: 'MPC_L2SW_RAISECOM',
    },
    { src: 'SFI', dest: 'SBM', group_interface: 'Eth-Trunk13', ne: 'SPC_METRO' },
    {
      src: 'SBM',
      dest: 'MBA',
      interfaces_ne: ['port-channel 2'],
      ne: 'MPC_L2SW_RAISECOM',
    },
  ];

  // Add title to message
  msg += `\n`;
  msg += `<b>3. Ring L2SW</b>\n`;
  msg += `${routes[0]}`;

  // Initialized LOS interfaces
  losInterfaces = [];

  // Loop through routes and update datek objects
  for (let i = 0; i < routes.length - 1; i++) {
    // Get source and destination
    const src = routes[i];
    const dest = routes[i + 1];

    // Print route title
    console.log(`${i + 1}. ${src} → ${dest}`);

    // Find the datek object for the source
    const datek = dateks.find((data) => data.id === src);
    const datekDest = dateks.find((data) => data.id === dest);

    // Get Datek NE
    datek.ne = interfacesNE.find((route) => route.src === src && route.dest === dest).ne;

    // Initialize result object
    const resObj = { currentBW: '#', maxBW: '#', statusLink: '🟨', interfaces: [] };

    // Check if SPC or MPC
    if (datek.ne.includes('SPC')) {
      // Get Datek Group Interface
      datek.group_interface = interfacesNE.find((route) => route.src === src && route.dest === dest).group_interface;
    } else {
      // Get Datek Interfaces NE
      datek.interfaces_ne = interfacesNE.find((route) => route.src === src && route.dest === dest).interfaces_ne;

      // Get Double Pagination
      datek.doublePagination =
        interfacesNE.find((route) => route.src === src && route.dest === dest).doublePagination || null;

      // Get Datek Interfaces
      resObj.interfaces = datek.interfaces_ne.map((intf) => ({ portName: intf, portStatus: '#', resultString: '#' }));
    }

    // Call deviceHandler
    await deviceHandler(defaultConfig, datek, resObj);

    // Check if any interfaces is down
    if (resObj.statusLink === '❌') {
      resObj.interfaces.forEach((data) => {
        if (data.portStatus !== 'UP' && data.portStatus !== 'Up') {
          losInterfaces.push(`- ${datek.hostname_ne} ${data.portName} &lt;&gt; ${datekDest.hostname_ne} LOS ❌`);
        }
      });
    }

    // Add result object to message
    msg += ` &lt;${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}&gt; ${dest}`;
  }

  // Add LOS interfaces to message
  if (losInterfaces.length > 0) {
    msg += `\n\n<b>Link Down :</b>\n`;
    losInterfaces.forEach((data) => {
      msg += `${data}\n`;
    });
  }

  // ---------------------------------- End of 3. Ring L2SW ----------------------------------

  return msg;
}

export default monitoringPremiumHandler;
