// Import Handlers
import excelHandler from './excel-handler.js';
import ringMetroDWDM from './iwip-ring-metro-dwdm.js';
import ringMetroRIP from './iwip-ring-metro-rip.js';
import ringL2SW from './iwip-ring-l2sw.js';

// Import Utilities
import currentDateTime from '../utils/get-current-datetime.js';
import { generateTopologyImage } from '../topology/generate-topology-image.js';

// Import Data
import { nodes, edgesDWDM, edgesRIP, edgesL2SW } from '../topology/topology-elements.js';

async function monitoringPremiumHandler(msg, defaultConfig) {
  // Get Dateks
  const dateks = await excelHandler('datek-cluster-iwip.xlsx');

  // Initial Message
  msg += `<b>REPORT MONITORING CLUSTER IWIP</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Declare variables
  const unmonitDevices = [];
  // unmonitDevices.push('ME-D7-SFI');
  // unmonitDevices.push('ME-D7-MBA');
  // unmonitDevices.push('SW-D7-BUL');
  // unmonitDevices.push('SW-D7-SBM');
  // unmonitDevices.push('ME-D7-MBA');

  // Check All The Rings
  msg = await ringMetroDWDM(msg, dateks, defaultConfig, unmonitDevices, edgesDWDM);
  msg = await ringMetroRIP(msg, dateks, defaultConfig, unmonitDevices, edgesRIP);
  msg = await ringL2SW(msg, dateks, defaultConfig, unmonitDevices, edgesL2SW);

  if (unmonitDevices.length > 0) {
    const uniqueUnmonitDevices = [...new Set(unmonitDevices)];

    // Add Unmonit Devices to Message
    msg += `\n\n<b>NE Unmonit :</b>\n`;
    msg += uniqueUnmonitDevices.join(', '); // Remove duplicates and join the elements

    // Change Unmonit Nodes
    uniqueUnmonitDevices.forEach((deviceHostname) => {
      const targetNode = nodes.find((node) => node.data.hostname === deviceHostname);
      if (targetNode) targetNode.data.type = targetNode.data.type === 'router' ? 'router-unmonit' : 'switch-unmonit';
    });
  }

  // Define Elements
  const elements = [...nodes, ...edgesDWDM, ...edgesRIP, ...edgesL2SW];

  // Get Topology Image Buffer
  console.log('\nStarting Generate Topology Image....');
  const imageBuffer = await generateTopologyImage({ elements, returnBuffer: true });
  console.log(`Buffer Created:`);
  console.log(imageBuffer);
  if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 0) return { imageBuffer, caption: msg };

  return msg;
}

export default monitoringPremiumHandler;
