// IMPORT SINGLE PORT CHECK DEVICES
import OLT_ZTE_CSERIES from '../single-port-check-devices/OLT_ZTE_CSERIES.js';
import OLT_ALU from '../single-port-check-devices/OLT_ALU.js';
import OLT_FH_A5161 from '../single-port-check-devices/OLT_FH_A5161.js';
import OLT_FH_A5261 from '../single-port-check-devices/OLT_FH_A5261.js';
import OLT_FH_A5261v2 from '../single-port-check-devices/OLT_FH_A5261v2.js';
import METRO from '../single-port-check-devices/METRO.js';
import L2SW_FH_S5800_SERIES from '../single-port-check-devices/L2SW_FH_S5800_SERIES.js';
import L2SW_ZTE_ZXR10 from '../single-port-check-devices/L2SW_ZTE_ZXR10.js';

async function singlePcdHandler(deviceParams) {
  // DEFINE DEVICE PARAMS
  const { site } = deviceParams;

  // CHECK NE
  switch (site.ne) {
    case 'L2SW FH S5800':
    case 'L2SW FH S5800v2':
      return await L2SW_FH_S5800_SERIES(deviceParams);

    case 'L2SW ZTE ZXR10':
      return await L2SW_ZTE_ZXR10(deviceParams);

    case 'METRO':
      return await METRO(deviceParams);

    case 'OLT ALU':
      return await OLT_ALU(deviceParams);

    case 'OLT FH A5161':
      return await OLT_FH_A5161(deviceParams);
    case 'OLT FH A5261':
      return await OLT_FH_A5261(deviceParams);
    case 'OLT FH A5261v2':
      return await OLT_FH_A5261v2(deviceParams);

    case 'OLT ZTE C600':
    case 'OLT ZTE C300':
    case 'OLT ZTE C300v2':
      return await OLT_ZTE_CSERIES(deviceParams);

    default:
      console.log(`    - Device ${site.ne} Not Recognized`);
      return '🟨';
  }
}
export default singlePcdHandler;
