// Import Handlers
import deviceHandler from './donggala-devices-handler.js';

async function mainSegment(msg, dateks, defaultConfig, unmonitDevices) {
  // Print title
  console.log(`[Main Segment]\n`);

  // Get datek for Main Segment
  const datek = { ...dateks.find((data) => data.id === 'TBU') };

  // Print Segment Title
  console.log(`1. ${datek.id}`);

  // Initialize result object
  const resObj = {
    // currentBW: '#',
    // maxBW: '#',
    statusLink: '⬛',
    interfaces: [
      { route: 'TWI-TBU', name: 'GE0/1/0.13', status: '⬛' },
      { route: 'TBU-PGI', name: 'GE0/3/0.14', status: '⬛' },
      { route: 'TBU-STG', name: 'GE0/1/1.15', status: '⬛' },
    ],
  };

  // Call deviceHandler
  datek.ne = 'OSPF METRO';
  await deviceHandler(defaultConfig, datek, resObj);

  // Add Interfaces Status to Message
  resObj.interfaces.forEach((intf) => {
    let statusDesc = 'Unmonitor';
    if (intf.status === '✅') statusDesc = 'FULL';
    if (intf.status === '❌') statusDesc = 'DOWN';
    msg += `${intf.route} : ${statusDesc} ${intf.status}\n`;
  });

  // Add Unmonit Devices to Array
  if (resObj.statusLink === '⬛') unmonitDevices.push(datek.hostname_ne);

  return msg;
}

export default mainSegment;
