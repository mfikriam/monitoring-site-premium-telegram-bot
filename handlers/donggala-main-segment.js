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
      { portRoute: 'TWI-TBU', portName: 'GE0/1/0.13', portStatus: '⬛' },
      { portRoute: 'TBU-PGI', portName: 'GE0/3/0.14', portStatus: '⬛' },
      { portRoute: 'TBU-STG', portName: 'GE0/1/1.15', portStatus: '⬛' },
    ],
  };

  // Call deviceHandler
  datek.ne = 'OSPF METRO';
  await deviceHandler(defaultConfig, datek, resObj);

  // Add Interfaces Status to Message
  resObj.interfaces.forEach((intf) => {
    let statusDesc = 'Unmonitor';
    if (intf.portStatus === '✅') statusDesc = 'FULL';
    if (intf.portStatus === '❌') statusDesc = 'DOWN';
    msg += `${intf.portRoute} : ${statusDesc} ${intf.portStatus}\n`;
  });

  // Add Unmonit Devices to Array
  if (resObj.statusLink === '⬛') unmonitDevices.push(datek.hostname_ne);

  return msg;
}

export default mainSegment;
