// Import Handlers
import deviceHandler from './iwip-devices-handler.js';

// Import Utils
import getEdgeType from '../utils/get-edge-type.js';

async function ringMetroRIP(msg, dateks, defaultConfig, unmonitDevices, edges) {
  // Print title
  console.log(`\n[Ring Metro-E via Radio IP]\n`);

  // Add title to message
  msg += `\n<b>2. Ring Metro-E via Radio IP</b>\n`;

  // Define LOS Interfaces Array
  const losInterfaces = [];

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
    statusLink: '⬛',
    interfaces: datek.interfaces_ne.map((intf) => ({ portName: intf, portStatus: '#', resultString: '#' })),
  };

  // Call deviceHandler
  await deviceHandler(defaultConfig, datek, resObj);

  // Add result object to message
  msg += `WDA &lt;${resObj.numUpInterfaces}/${resObj.numInterfaces} ${resObj.statusLink}&gt; IWP`;

  // Check if device is unmonit
  if (resObj.statusLink === '⬛') unmonitDevices.push(datek.hostname_ne);

  // Check if any interfaces is down
  if (resObj.statusLink === '❌' || resObj.statusLink === '⚠️') {
    resObj.interfaces.forEach((data) => {
      if (data.portStatus !== 'UP')
        losInterfaces.push(`- ${datek.hostname_ne} ${data.portName} &lt;&gt; ${datekDest.hostname_ne} LOS ❌`);
    });
  }

  // Update Edges
  const targetEdge = edges.find((edge) => edge.data.source === 'WDA' && edge.data.target === 'IWP');
  if (targetEdge) {
    targetEdge.data.label = `${resObj.numUpInterfaces}/${resObj.numInterfaces} ${resObj.statusLink} RADIO`;
    targetEdge.data.type = getEdgeType(resObj.statusLink);
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

export default ringMetroRIP;
