// Import Handlers
import excelHandler from './excel-handler.js';
import mainSegment from './donggala-main-segment.js';
import detailSegment from './donggala-detail-segment.js';

// Import Utilities
import currentDateTime from '../utils/get-current-datetime.js';

// Import Topology Data & Functions
import { generateTopologyImage } from '../topology/generate-topology-image.js';
import { primaryStyles } from '../topology/primary-styles.js';
import { iconStyles } from '../topology/icon-styles.js';
import { customStyles, nodes, edges } from '../topology/donggala/donggala-topology-elements.js';

async function monitoringDonggalaHandler(msg, defaultConfig) {
  // Get Dateks
  const dateks = await excelHandler('datek-cluster-donggala.xlsx');

  // Initial Message
  msg += `<b>Report Pantai Barat Donggala</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Monitor Main Segment
  const unmonitDevices = [];
  const losInterfaces = [];
  msg = await mainSegment(msg, dateks, defaultConfig, unmonitDevices);

  // Start Detail Segment
  msg += `\nDetail Segment :\n`;
  let title = '';
  let routes = [];
  let interfacesNE = [];
  let segmentInfo = {};

  // 1. Monitor Detail Segment : TWI-TBU
  interfacesNE = [];
  title = '1. TWI-TBU';
  routes = ['TWI', 'DGL105', 'DGL006', 'DGL129', 'TBU'];
  interfacesNE.push({
    src: 'TWI',
    dest: 'DGL105',
    interfaces: [{ name: 'GigabitEthernet3/0/4', alias: '-' }],
  });
  interfacesNE.push({
    src: 'DGL105',
    dest: 'DGL006',
    interfaces: [{ name: 'tengigabitethernet 1/1/27', alias: 'TGE1/1/27' }],
  });
  interfacesNE.push({
    src: 'DGL006',
    dest: 'DGL129',
    interfaces: [{ name: 'tengigabitethernet 1/1/28', alias: 'TGE1/1/28' }],
  });
  interfacesNE.push({
    src: 'DGL129',
    dest: 'TBU',
    interfaces: [{ name: 'tengigabitethernet 1/1/26', alias: 'TGE1/1/26' }],
  });
  segmentInfo = { title, routes, interfacesNE };
  msg = await detailSegment(msg, dateks, defaultConfig, segmentInfo, losInterfaces, unmonitDevices, edges);

  // 2. Monitor Detail Segment : TBU-PGI
  interfacesNE = [];
  title = '2. TBU-PGI';
  routes = ['TBU', 'PGI063', 'PGI004', 'PGI003', 'PGI'];
  interfacesNE.push({
    src: 'TBU',
    dest: 'PGI063',
    interfaces: [{ name: 'GigabitEthernet0/3/0', alias: '-' }],
  });
  interfacesNE.push({
    src: 'PGI063',
    dest: 'PGI004',
    interfaces: [{ name: 'tengigabitethernet 1/1/25', alias: 'TGE1/1/25' }],
  });
  interfacesNE.push({
    src: 'PGI004',
    dest: 'PGI003',
    interfaces: [{ name: '10gigaethernet 1/1/1', alias: '10ge1/1/1' }],
  });
  interfacesNE.push({
    src: 'PGI003',
    dest: 'PGI',
    interfaces: [
      { name: 'XGE0/1/1', alias: 'XGE0/1/1' },
      { name: 'XGE0/1/2', alias: 'XGE0/1/2' },
    ],
  });
  segmentInfo = { title, routes, interfacesNE };
  msg = await detailSegment(msg, dateks, defaultConfig, segmentInfo, losInterfaces, unmonitDevices, edges);

  // 3. Monitor Detail Segment : TBU-STG
  interfacesNE = [];
  title = '3. TBU-STG';
  routes = ['TBU', 'DGL030', 'DGL175', 'DGL079', 'DGL034', 'TLI005', 'TLI041', 'TLI008', 'STG'];
  interfacesNE.push({
    src: 'TBU',
    dest: 'DGL030',
    interfaces: [{ name: 'GigabitEthernet0/1/1', alias: '-' }],
  });
  interfacesNE.push({
    src: 'DGL030',
    dest: 'DGL175',
    interfaces: [{ name: 'xgigaethernet 1/2/1', alias: 'xge-1/2/1' }],
  });
  interfacesNE.push({
    src: 'DGL175',
    dest: 'DGL079',
    interfaces: [{ name: 'xgigaethernet 1/2/1', alias: 'xge-1/2/1' }],
  });
  interfacesNE.push({
    src: 'DGL079',
    dest: 'DGL034',
    interfaces: [{ name: 'xgigaethernet 1/2/1', alias: 'xge-1/2/1' }],
  });
  interfacesNE.push({
    src: 'DGL034',
    dest: 'TLI005',
    interfaces: [{ name: 'xgigaethernet 1/2/1', alias: 'xge-1/2/1' }],
  });
  interfacesNE.push({
    src: 'TLI005',
    dest: 'TLI041',
    interfaces: [{ name: 'tengigabitethernet 1/1/25', alias: 'TGE1/1/25' }],
  });
  interfacesNE.push({
    src: 'TLI041',
    dest: 'TLI008',
    interfaces: [{ name: 'tengigabitethernet 1/1/25', alias: 'TGE1/1/25' }],
  });
  interfacesNE.push({
    src: 'TLI008',
    dest: 'STG',
    interfaces: [{ name: 'xgigaethernet 1/1/2', alias: 'xge-1/1/2' }],
  });
  segmentInfo = { title, routes, interfacesNE };
  msg = await detailSegment(msg, dateks, defaultConfig, segmentInfo, losInterfaces, unmonitDevices, edges);

  // Add LOS Interfaces to Message
  if (losInterfaces.length > 0) {
    msg += `\n<b>Link Down :</b>\n`;
    msg += losInterfaces.join('\n');
    msg += `\n`;
  }

  // Add Unmonit Devices to Message
  if (unmonitDevices.length > 0) {
    // Remove Duplicates and Join The Elements
    const uniqueUnmonitDevices = [...new Set(unmonitDevices)];
    msg += `\n<b>NE Unmonit :</b>\n`;
    msg += uniqueUnmonitDevices.join(', ');
    msg += `\n`;

    // Change Unmonit Nodes
    uniqueUnmonitDevices.forEach((deviceHostname) => {
      const targetNode = nodes.find((node) => node.data.hostname === deviceHostname);
      if (targetNode) targetNode.data.type = targetNode.data.type === 'router' ? 'router-unmonit' : 'switch-unmonit';
    });
  }

  // Add CC When LOS or Unmonit
  if (msg.includes('❌') || msg.includes('⬛')) {
    msg += `\nCC: @ipyamol @fatahud @SURVEILLANCE_TIF4_MSO7 @haris_eos7 @Nawir_EOS_MSO7`;
  }

  // Define Styles, Elements & Output Path
  const styles = [...primaryStyles, ...iconStyles, ...customStyles];
  const elements = [...nodes, ...edges];
  const output = 'topology/donggala/donggala-topology.png';

  // Get Topology Image Buffer
  console.log('\nStarting Generate Topology Image....');
  const imageBuffer = await generateTopologyImage({ elements, styles, output, returnBuffer: true });
  console.log(`Buffer Created:`);
  console.log(imageBuffer);
  if (Buffer.isBuffer(imageBuffer) && imageBuffer.length > 0) return { imageBuffer, caption: msg };

  return msg;
}

export default monitoringDonggalaHandler;
