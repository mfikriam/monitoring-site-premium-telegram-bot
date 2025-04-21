// IMPORT UTILS
import currentDateTime from '../utils/get-current-datetime.js';

const dateks = {
  SFI: {
    ne: 'METRO',
    hostname_ne: 'ME-D7-SFI',
    ip_ne: '172.31.242.196',
    username: 'default_nms',
    password: 'default_nms',
  },
  WDA: {
    ne: 'METRO',
    hostname_ne: 'ME-D7-WDA',
    ip_ne: '172.31.242.185',
    username: 'default_nms',
    password: 'default_nms',
  },
  IWP: {
    ne: 'METRO',
    hostname_ne: 'ME-D7-IWP',
    ip_ne: '172.31.242.183',
    username: 'default_nms',
    password: 'default_nms',
  },
  MBA: {
    ne: 'METRO',
    hostname_ne: 'ME-D7-MBA',
    ip_ne: '172.31.242.187',
    username: 'default_nms',
    password: 'default_nms',
  },
  SSU020: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-NEWSSU020',
    ip_ne: '10.199.238.199',
    username: 'admin',
    password: 'Telkom123!',
  },
  SSU005: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SFI-SSU005-NEW',
    ip_ne: '172.25.106.15',
    username: 'mz19900215',
    password: 'Maret@2025',
  },
  SSU043: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SFI-SSU043',
    ip_ne: '10.199.238.81',
    username: 'admin',
    password: 'Lelilef1234',
  },
  'OLD-SSU007': {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SFI-SSU007-OLD',
    ip_ne: '10.199.238.200',
    username: 'admin',
    password: 'Lelilef1234',
  },
  'NEW-SSU007': {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SFI-SSU007-NEW',
    ip_ne: '172.25.106.11',
    username: 'default_nms',
    password: 'default_nms',
  },
  SSU015: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SFI-SSU-015',
    ip_ne: '172.25.106.10',
    username: 'default_nms',
    password: 'default_nms',
  },
  MBA012: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SFI-MBA-0012',
    ip_ne: '172.25.106.9',
    username: 'default_nms',
    password: 'default_nms',
  },
  BUL: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-BUL',
    ip_ne: '10.198.1.155',
    username: 'raisecom',
    password: 'raisecom',
  },
  SBM: {
    ne: 'L2SW',
    hostname_ne: 'SW-D7-SBM',
    ip_ne: '10.198.1.156',
    username: 'raisecom',
    password: 'raisecom',
  },
};

async function monitoringPremiumHandler(msg, defaultConfig) {
  // Initial Message
  msg += `<b>REPORT MONITORING CLUSTER IWIP</b>\n`;
  msg += `${currentDateTime()}\n`;
  msg += `\n`;

  // Declare variables
  let devicesRoute = [];
  let routes = [];

  // ----------------- 1. Ring Metro-E via DWDM -----------------
  routes = [
    { src: 'SFI', dest: 'WDA', interface: 'Eth-Trunk25' },
    { src: 'WDA', dest: 'IWP', interface: 'Eth-Trunk11' },
    { src: 'IWP', dest: 'MBA', interface: 'Eth-Trunk25' },
    { src: 'MBA', dest: 'SFI', interface: 'Eth-Trunk23' },
  ];

  devicesRoute = ['SFI', 'WDA', 'IWP', 'MBA', 'SFI'];
  msg += `1. Ring Metro-E via DWDM\n`;
  msg += `${devicesRoute[0]}`;
  for (let i = 0; i < devicesRoute.length - 1; i++) {
    const route1 = devicesRoute[i];
    const route2 = devicesRoute[i];
    msg += ` &lt;&gt; ${route2}`;
  }
  msg += `\n`;

  return msg;
}

export default monitoringPremiumHandler;
