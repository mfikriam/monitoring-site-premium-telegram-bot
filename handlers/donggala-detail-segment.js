// Import Handlers
import deviceHandler from './donggala-devices-handler.js';

// Import Utilities
import getEdgeType from '../utils/get-edge-type.js';

// Delay Function
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function detailSegment(msg, dateks, defaultConfig, segmentInfo, losInterfaces, unmonitDevices, edges) {
  // Destruct Segment Info
  const { title, routes, interfacesNE, segBreak = false } = segmentInfo;

  // Print Title
  if (!segBreak) console.log(`\n[Detail Segment : ${title}]\n`);

  // Add Title to Message
  if (!segBreak) msg += `\n<b>${title}</b>\n`;

  // Add First Route to Message
  msg += `- ${routes[0]}`;

  // Loop through routes and update datek objects
  for (let i = 0; i < routes.length - 1; i++) {
    // Get Source and Destination
    const src = routes[i];
    const dest = routes[i + 1];

    // Print Route Title
    console.log(`${i + 1}. ${src} → ${dest}`);

    // Find the datek object for the source
    const datek = dateks.find((data) => data.id === src);
    const datekDest = dateks.find((data) => data.id === dest);

    // Initialize Result Object
    const resObj = {
      currentBW: '#',
      maxBW: '#',
      statusLink: '⬛',
      interface: interfacesNE.find((route) => route.src === src && route.dest === dest).interface,
      interfaceAlias: interfacesNE.find((route) => route.src === src && route.dest === dest).interfaceAlias,
    };

    // Monitor Device
    const numMonitor = 3;
    for (let i = 0; i < numMonitor; i++) {
      await deviceHandler(defaultConfig, datek, resObj); // Call Device Handler
      if (resObj.statusLink === '✅') break;
      if (resObj.statusLink === '❌' && resObj.maxBW !== 0) break;

      // Handle False LOS or Unmonit
      const delayTime = (i + 1) * 3000;
      console.log(`    - Trying Recheck Device with Delay ${delayTime / 1000} Seconds (Attempt ${i + 1})`);
      await delay(delayTime);
    }

    // Add Result Object to Message
    msg += ` <${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}> ${dest}`;

    // Add LOS Interface to Array
    if (resObj.statusLink === '❌') {
      losInterfaces.push(`- ${datek.hostname_ne} ${resObj.interface} &lt;&gt; ${datekDest.hostname_ne} LOS ❌`);
    }

    // Add Unmonit Devices to Array
    if (resObj.statusLink === '⬛') unmonitDevices.push(datek.hostname_ne);

    // Update Edges
    const targetEdge = edges.find((edge) => edge.data.source === src && edge.data.target === dest);
    if (targetEdge) {
      targetEdge.data.label = `${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}`;
      targetEdge.data.type = getEdgeType(resObj.statusLink);
    }
  }

  msg += `\n`;
  return msg;
}

export default detailSegment;
