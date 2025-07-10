// Import Devices
import SPC_METRO from '../iwip-devices/SPC_METRO.js';
import MPC_METRO from '../iwip-devices/MPC_METRO.js';
import MPC_RIP_METRO from '../iwip-devices/MPC_RIP_METRO.js';
import MPC_L2SW_FH_S5800_SERIES from '../iwip-devices/MPC_L2SW_FH_S5800_SERIES.js';
import SPC_L2SW_FH_S5800v1 from '../iwip-devices/SPC_L2SW_FH_S5800v1.js';
import SPC_L2SW_FH_S5800v2 from '../iwip-devices/SPC_L2SW_FH_S5800v2.js';
import MPC_L2SW_RAISECOM from '../iwip-devices/MPC_L2SW_RAISECOM.js';

async function deviceHandler(defaultConfig, datek, resObj) {
  // Define NMS and NE Config
  const nmsConfig = datek.ne.includes('METRO') ? { ...defaultConfig.metro.nms } : { ...defaultConfig.gpon.nms };
  const neConfig = datek.ne.includes('METRO') ? { ...defaultConfig.metro.ne } : { ...defaultConfig.gpon.ne };

  // Overwrite NE Config if provided
  if (datek.username_ne && datek.username_ne !== 'username_nms') {
    neConfig.username = datek.username_ne;
    neConfig.password = datek.password_ne;
  }

  // Print Device Name
  console.log(`  > Device Name : ${datek.ne}`);

  const deviceParams = { nmsConfig, neConfig, datek, resObj };

  switch (datek.ne) {
    case 'SPC_METRO':
      return await SPC_METRO(deviceParams);
    case 'MPC_METRO':
      return await MPC_METRO(deviceParams);
    case 'MPC_RIP_METRO':
      return await MPC_RIP_METRO(deviceParams);
    case 'SPC_L2SW_FH_S5800v1':
      return await SPC_L2SW_FH_S5800v1(deviceParams);
    case 'SPC_L2SW_FH_S5800v2':
      return await SPC_L2SW_FH_S5800v2(deviceParams);
    case 'MPC_L2SW_FH_S5800_SERIES':
      return await MPC_L2SW_FH_S5800_SERIES(deviceParams);
    case 'MPC_L2SW_RAISECOM':
      return await MPC_L2SW_RAISECOM(deviceParams);
    default:
      console.log(`    - Device ${datek.ne} Not Recognized`);
  }
}

export default deviceHandler;
