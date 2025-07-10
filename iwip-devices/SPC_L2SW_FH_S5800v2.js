import { Client as SSHClient } from 'ssh2';

// Import Utils
import getWarningStatus from '../utils/get-warning-status.js';

function resultParser(resObj) {
  // Initialize statusLink to UP
  resObj.statusLink = '✅';

  for (const intf of resObj.interfaces) {
    // Get result string
    const resultString = intf.resultString;

    // Check keyword
    const isUp =
      (resultString.includes('admin state : up') && resultString.includes('current state : up')) ||
      resultString.includes('Admin state is up,operation state is up');

    // Update interface status
    if (resultString && isUp) {
      intf.portStatus = 'Up';
    } else {
      resObj.statusLink = '❌';
      intf.portStatus = 'LOS';
    }

    // // Test LOS interface
    // if (intf.portName === 'xgigaethernet 1/0/18') {
    //   resObj.statusLink = '❌';
    //   intf.portStatus = 'LOS';
    // }

    // Print status port
    console.log(
      `    - Status Interface ${intf.portName}: ${intf.portStatus} ${intf.portStatus === 'Up' ? '✅' : '❌'}`,
    );
  }

  // Check warning status
  resObj.statusLink = getWarningStatus(resObj.statusLink, resObj.currentBW, resObj.maxBW);

  // Print status link
  console.log(`    - Status Link: ${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}`);
}

function bandwidthParser(resObj) {
  // Extract Max BW & Current BW
  const portBWMatch = resObj.bwString.match(/Cur-BW:\(M\):\s*(\d+)/);
  const maxBWMatch = resObj.bwString.match(/Max-BW:\(M\):\s*(\d+)/);
  resObj.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) / 1000 : '#'; // Gbps
  resObj.maxBW = maxBWMatch ? parseInt(maxBWMatch[1], 10) / 1000 : '#'; // Gbps

  // Extract Port List
  const portListMatch = resObj.bwString.match(/Port-List:([a-z0-9]+)\s+([\d\/,]+)/i);
  let portList = [];
  if (portListMatch) {
    const typeMap = {
      xge: 'xgigaethernet',
      '100ge': '100gigaethernet',
      '40ge': '40gigaethernet',
    };
    const portType = typeMap[portListMatch[1].toLowerCase()] || portListMatch[1].toLowerCase();
    const portNumbers = portListMatch[2].split(',').map((p) => p.trim());
    portList = portNumbers.map((p) => `${portType} ${p}`);
  }
  resObj.interfaces = portList.map((intf) => ({ portName: intf, portStatus: '#', resultString: '#' }));
}

async function SPC({ nmsConfig, neConfig, datek, mainCommand, timeout = 30000 }) {
  return new Promise((resolve, reject) => {
    // CREATE SSH CONN INSTANCE
    const conn = new SSHClient();

    // INITIALIZE TIMEOUT HANDLE
    let timeoutHandle;

    // ON READY
    conn.on('ready', () => {
      // PRINT CONNECTION TITLE
      const connTitle = `ssh ${nmsConfig.username}@${nmsConfig.host} ${nmsConfig.password}`;
      console.log(`    - SSH Connection Established: ${connTitle}`);

      // TYPE & STREAM ON TERMINAL AFTER SSH
      conn.shell((err, stream) => {
        // ERROR HANDLING
        if (err) {
          console.log('    - Error Starting Shell');
          return resolve();
        }

        // INITIALIZED VARIABLES
        let result = '';
        let linkResult = '';
        let loggedin = false;
        let commandExec = false;
        let finished = false;
        let currentCommand = '';
        let isTimeOut = false;
        let authFailed = false;

        // Set a timeout to limit streaming time
        timeoutHandle = setTimeout(() => {
          isTimeOut = true; // Set time out to true
          console.log('    - Streaming Timeout Exceeded');
          stream.end(); // End the stream if timeout is reached
          console.log('    - SSH Stream Closed');
          conn.end(); // Close the SSH connection
        }, timeout);

        // STREAM CLOSE HANDLER
        stream.on('close', () => {
          clearTimeout(timeoutHandle); // Clear the timeout if stream closes before time limit
          resolve(linkResult);
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();
          // console.log(dataStr);

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec) linkResult += dataStr;

          // Ensure RNO NMS SSH To NE is ready
          if (!loggedin && dataStr.includes('rno7app:~$')) {
            currentCommand = `telnet ${datek.ip_ne}`;
            console.log(`    - Executing Command On RNO Server: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE NE AUTH: USERNAME
          if (dataStr.includes('Username:') && !loggedin) {
            console.log(`    - Entering NE Username: ${neConfig.username}`);
            stream.write(`${neConfig.username}\n`);
          }

          // HANDLE NE AUTH: PASSWORD
          if (dataStr.includes('Password:') && !loggedin) {
            loggedin = true;
            console.log(`    - Entering NE Password: ${neConfig.password}`);
            stream.write(`${neConfig.password}\n`);
          }

          // HANDLE NE AUTH FAILED
          if (dataStr.includes('%No such user or bad password.')) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // Main Command
          if (dataStr.includes(`${datek.hostname_ne}#`) && !commandExec) {
            commandExec = true;
            console.log(`    - Executing Command: ${mainCommand}`);
            stream.write(`${mainCommand}\n`);
          }

          // Handle Paginations
          if (dataStr.includes('--More--')) {
            finished = true;
            result += '\n';
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // Handle Finishing Verbose Check
          if (dataStr.includes(`Port-List:`)) {
            finished = true;
          }

          // HANDLE CLOSING SSH CONNECTION
          if (dataStr.includes(`${datek.hostname_ne}#`) && finished) {
            console.log('    - SSH Stream Closed');
            conn.end();
          }
        });

        // TELNET TO NE VIA IP ADDRESS
        console.log(`    - Executing Command: telnet ${datek.ip_ne}`);
        stream.write(`telnet ${datek.ip_ne}\n`);
      });
    });

    // ON ERROR
    conn.on('error', (err) => {
      clearTimeout(timeoutHandle); // Clear the timeout on error
      console.log('    - SSH Connection Error (SSH Failed)');
      console.log(err);
      resolve();
    });

    // ON CONNECT
    conn.connect(nmsConfig);
  });
}

async function MultiChecker({ nmsConfig, neConfig, datek, resObj }) {
  // Get Bandwidth & Port List
  let mainCommand = `show interface ${datek.group_interface} verbose`;
  resObj.bwString = await SPC({ nmsConfig, neConfig, datek, mainCommand });
  bandwidthParser(resObj);

  // Check If BW & Port List Exist
  if (resObj.currentBW === '#' || resObj.maxBW === '#') return;

  // Check Ports Status
  for (const intf of resObj.interfaces) {
    mainCommand = `show interface ${intf.portName}`;
    intf.resultString = await SPC({ nmsConfig, neConfig, datek, mainCommand });
  }
  resultParser(resObj);

  return;
}

export default MultiChecker;
