// Import Handlers
import deviceHandler from './donggala-devices-handler.js';

async function detailSegment(msg, dateks, defaultConfig, segmentInfo, losInterfaces, unmonitDevices) {
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

    // Call Device Handler
    await deviceHandler(defaultConfig, datek, resObj);

    // Add Result Object to Message
    msg += ` <${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}> ${dest}`;

    // Add LOS Interface to Array
    if (resObj.statusLink === '❌') {
      losInterfaces.push(`- ${datek.hostname_ne} ${resObj.interface} &lt;&gt; ${datekDest.hostname_ne} LOS ❌`);
    }

    // Add Unmonit Devices to Array
    if (resObj.statusLink === '⬛') unmonitDevices.push(datek.hostname_ne);
  }

  msg += `\n`;
  return msg;
}

export default detailSegment;
