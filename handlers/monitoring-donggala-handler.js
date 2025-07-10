// Import Handlers
import excelHandler from './excel-handler.js';
import mainSegment from './donggala-main-segment.js';
import detailSegment from './donggala-detail-segment.js';

// Import Utilities
import currentDateTime from '../utils/get-current-datetime.js';

async function monitoringDonggalaHandler(msg, defaultConfig) {
  // Get Dateks
  const dateks = await excelHandler('datek-cluster-donggala.xlsx');

  // Initial Message
  msg += `<b>Report Pantai Barat Donggala</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Monitor Main Segment
  msg = await mainSegment(msg, dateks, defaultConfig);

  // // Start Detail Segment
  // msg += `\nDetail Segment :\n`;
  // let title = '';
  // let routes = [];
  // let interfacesNE = [];
  // let segmentInfo = {};

  // // 1. Monitor Detail Segment : TWI-TBU
  // title = '1. TWI-TBU';
  // routes = ['TWI', 'DGL105', 'DGL006', 'DGL129', 'TBU'];
  // routes = ['TWI', 'DGL105', 'DGL006', 'DGL129'];
  // interfacesNE = [
  //   { src: 'TWI', dest: 'DGL105', interface: 'GigabitEthernet3/0/4' },
  //   { src: 'DGL105', dest: 'DGL006', interface: 'tengigabitethernet 1/1/27', interfaceAlias: 'TGE1/1/27' },
  //   { src: 'DGL006', dest: 'DGL129', interface: 'tengigabitethernet 1/1/28', interfaceAlias: 'TGE1/1/28' },
  //   { src: 'DGL129', dest: 'TBU', interface: 'tengigabitethernet 1/1/26', interfaceAlias: 'TGE1/1/26' },
  // ];
  // segmentInfo = { title, routes, interfacesNE };
  // msg = await detailSegment(msg, dateks, defaultConfig, segmentInfo);

  // // 2. Monitor Detail Segment : TBU-PGI
  // title = '2. TBU-PGI';
  // routes = ['TBU', 'PGI063', 'PGI004', 'PGI003', 'PGI'];
  // interfacesNE = [
  //   { src: 'TBU', dest: 'PGI063', interface: 'GigabitEthernet0/3/0' },
  //   { src: 'PGI063', dest: 'PGI004', interface: 'tengigabitethernet 1/1/25', interfaceAlias: 'TGE1/1/25' },
  //   { src: 'PGI004', dest: 'PGI003', interface: '10gigaethernet 1/1/1', interfaceAlias: '10ge1/1/1' },
  //   { src: 'PGI003', dest: 'PGI', interface: 'XGE0/1/2', interfaceAlias: 'XGE0/1/2' },
  // ];
  // segmentInfo = { title, routes, interfacesNE };
  // msg = await detailSegment(msg, dateks, defaultConfig, segmentInfo);

  // // 3. Monitor Detail Segment : TBU-STG
  // title = '3. TBU-STG';
  // routes = ['TBU', 'DGL030', 'DGL175', 'DGL079', 'DGL034', 'TLI005', 'TLI041', 'TLI008', 'STG'];
  // routes = ['TLI005', 'TLI041', 'TLI008'];
  // interfacesNE = [
  //   { src: 'TBU', dest: 'DGL030', interface: 'GigabitEthernet0/1/1' },
  //   { src: 'DGL030', dest: 'DGL175', interface: 'xgigaethernet 1/2/1', interfaceAlias: 'xge-1/2/1' },
  //   { src: 'DGL175', dest: 'DGL079', interface: 'xgigaethernet 1/2/1', interfaceAlias: 'xge-1/2/1' },
  //   { src: 'DGL079', dest: 'DGL034', interface: 'xgigaethernet 1/2/1', interfaceAlias: 'xge-1/2/1' },
  //   { src: 'DGL034', dest: 'TLI005', interface: 'xgigaethernet 1/2/1', interfaceAlias: 'xge-1/2/1' },
  //   { src: 'TLI005', dest: 'TLI041', interface: 'tengigabitethernet 1/1/25', interfaceAlias: 'TGE1/1/25' },
  //   { src: 'TLI041', dest: 'TLI008', interface: 'tengigabitethernet 1/1/25', interfaceAlias: 'TGE1/1/25' },
  //   { src: 'TLI008', dest: 'STG', interface: 'xgigaethernet 1/1/2', interfaceAlias: 'xge-1/1/2' },
  // ];
  // segmentInfo = { title, routes, interfacesNE };
  // msg = await detailSegment(msg, dateks, defaultConfig, segmentInfo);

  // msg += `CC: @ipyamol @fatahud @SURVEILLANCE_TIF4_MSO7 @haris_eos7 @Nawir_EOS_MSO7`;
  return msg;
}

export default monitoringDonggalaHandler;
