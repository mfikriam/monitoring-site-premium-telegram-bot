// IMPORT MULTI PORT CHECK DEVICES
import MPC_METRO from '../multi-port-check-devices/MPC_METRO.js';
import MPC_L2SW_FH_S5800_SERIES from '../multi-port-check-devices/MPC_L2SW_FH_S5800_SERIES.js';

async function multiPcdHandler(deviceParams) {
  // GET SITE
  const ne = deviceParams.site.ne;

  // CHECK NE
  switch (ne) {
    case 'METRO':
      return await MPC_METRO(deviceParams);

    case 'L2SW FH S5800v2':
    case 'L2SW FH S5800v3':
      return await MPC_L2SW_FH_S5800_SERIES(deviceParams);

    default:
      console.log(`    - Device ${ne} Not Recognized`);
      return '🟨';
  }
}

export default multiPcdHandler;
