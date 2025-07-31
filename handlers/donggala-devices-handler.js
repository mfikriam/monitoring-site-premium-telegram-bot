// Import Devices
import OSPF_METRO from '../donggala-devices/OSPF_METRO.js';
import LLDP_METRO from '../donggala-devices/LLDP_METRO.js';
import LLDP_L2SW_RAISECOM from '../donggala-devices/LLDP_L2SW_RAISECOM.js';
import LLDP_L2SW_FH_S_SERIES from '../donggala-devices/LLDP_L2SW_FH_S_SERIES.js';
import LLDP_L2SW_FH_CITRANS from '../donggala-devices/LLDP_L2SW_FH_CITRANS.js';
import L2SW_FH_S5800 from '../donggala-devices/L2SW_FH_S5800.js';

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

  if (datek.id === 'DGL034') return await L2SW_FH_S5800(deviceParams);

  switch (datek.ne) {
    case 'OSPF METRO':
      return await OSPF_METRO(deviceParams);
    case 'METRO':
      return await LLDP_METRO(deviceParams);
    case 'L2SW RAISECOM':
      return await LLDP_L2SW_RAISECOM(deviceParams);
    case 'L2SW FH S5800':
    case 'L2SW FH S6800':
      return await LLDP_L2SW_FH_S_SERIES(deviceParams);
    case 'L2SW FH CITRANS':
      return await LLDP_L2SW_FH_CITRANS(deviceParams);
    default:
      console.log(`    - Device ${datek.ne} Not Recognized`);
  }
}

export default deviceHandler;
