// Import Handlers
import deviceHandler from './iwip-devices-handler.js';

async function ringL2SW(msg, dateks, defaultConfig, unmonitDevices, edges) {
  // Print title
  console.log(`\n[Ring L2SW]\n`);

  // Define routes for L2SW
  const routes = [
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
  const interfacesNE = [
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

  // Define LOS Interfaces Array
  const losInterfaces = [];

  // Add title to message
  msg += `\n<b>3. Ring L2SW</b>\n`;

  // Add First Route to Message
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

    // Initialize result object
    const resObj = { currentBW: '#', maxBW: '#', statusLink: '🟨', interfaces: [] };

    // Check if SPC or MPC
    if (datek.ne.includes('SPC')) {
      // Get Datek Group Interface
      datek.group_interface = interfacesNE.find((route) => route.src === src && route.dest === dest).group_interface;
    } else {
      // Get Datek Interfaces NE
      datek.interfaces_ne = interfacesNE.find((route) => route.src === src && route.dest === dest).interfaces_ne;

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

    // Check if device is unmonit
    if (resObj.statusLink === '🟨') unmonitDevices.push(datek.hostname_ne);

    // Add result object to message
    msg += ` &lt;${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}&gt; ${dest}`;

    // Update Edges
    const targetEdge = edges.find((edge) => edge.data.source === src && edge.data.target === dest);
    if (targetEdge) {
      targetEdge.data.label = `${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}`;
      targetEdge.data.type = resObj.statusLink === '✅' ? 'working' : 'los';
    }
  }

  // Add LOS interfaces to message
  if (losInterfaces.length > 0) {
    msg += `\n\n<b>Link Down :</b>\n`;
    msg += losInterfaces.join('\n');
  }

  return msg;
}

export default ringL2SW;
