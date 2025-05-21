// Import Handlers
import deviceHandler from './iwip-devices-handler.js';

async function ringMetroDWDM(msg, dateks, defaultConfig, unmonitDevices, edges) {
  // Print title
  console.log(`[Ring Metro-E via DWDM]\n`);

  // Define routes for Metro-E via DWDM
  const routes = ['SFI', 'WDA', 'IWP', 'MBA', 'SFI'];

  // Define Interfaces NE for Metro-E via DWDM
  const interfacesNE = [
    { src: 'SFI', dest: 'WDA', group_interface: 'Eth-Trunk25', ne: 'SPC_METRO' },
    { src: 'WDA', dest: 'IWP', group_interface: 'Eth-Trunk11', ne: 'SPC_METRO' },
    { src: 'IWP', dest: 'MBA', group_interface: 'Eth-Trunk25', ne: 'SPC_METRO' },
    { src: 'MBA', dest: 'SFI', group_interface: 'Eth-Trunk23', ne: 'SPC_METRO' },
  ];

  // Define LOS Interfaces Array
  const losInterfaces = [];

  // Add title to message
  msg += `<b>1. Ring Metro-E via DWDM</b>\n`;

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

    // Check if device is unmonit
    if (resObj.statusLink === '🟨') unmonitDevices.push(datek.hostname_ne);

    // Add result object to message
    msg += ` &lt;${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}&gt; ${dest}`;

    // Update Edges
    const targetEdge = edges.find((edge) => edge.data.source === src && edge.data.target === dest);
    if (targetEdge) {
      targetEdge.data.label = `${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink} DWDM`;
      targetEdge.data.type = resObj.statusLink === '✅' ? 'working' : 'los';
    }
  }

  // Add LOS interfaces to message
  if (losInterfaces.length > 0) {
    msg += `\n\n<b>Link Down :</b>\n`;
    msg += losInterfaces.join('\n');
  }

  // Add new line
  msg += `\n`;

  return msg;
}

export default ringMetroDWDM;
