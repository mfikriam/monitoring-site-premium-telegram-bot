import { Client as SSHClient } from 'ssh2';

// Import Utils
import getWarningStatus from '../utils/get-warning-status.js';

function parseBandwidth(match) {
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  return unit === 'M' ? Math.round(value / 1000) : value; // Convert M to G, round to nearest GB
}

function resultParser(resultStr, resObj) {
  // Parse the result string to extract current and max bandwidth
  const currentBWMatch = resultStr.match(/Current BW:\s*(\d+)([GM])/);
  const maxBWMatch = resultStr.match(/Maximal BW:\s*(\d+)([GM])/);

  const currentBW = parseBandwidth(currentBWMatch);
  const maxBW = parseBandwidth(maxBWMatch);

  // Initialize statusLink to UP;
  let statusLink = '✅';

  // Check if the result string contains the expected format
  const portEntries = [];
  const regex = /(GigabitEthernet[\d/]+)\s+(\S+)/g;
  let match;
  while ((match = regex.exec(resultStr)) !== null) {
    const portName = match[1];
    let portStatus = match[2];

    // // Test LOS intarface
    // if (portName === 'GigabitEthernet3/1/1') portStatus = 'LOS';

    portEntries.push({ portName, portStatus });
    if (portStatus !== 'UP') statusLink = '❌';

    // Print status port
    console.log(`    - Status Interface ${portName}: ${portStatus} ${portStatus === 'UP' ? '✅' : '❌'}`);
  }

  // If no matches were found
  if (portEntries.length === 0) statusLink = '⬛';

  // Check warning status
  statusLink = getWarningStatus(statusLink, currentBW, maxBW);

  // Print status link
  console.log(`    - Status Link: ${currentBW}/${maxBW} ${statusLink}`);

  // Update the result object with the parsed values
  resObj.currentBW = currentBW;
  resObj.maxBW = maxBW;
  resObj.statusLink = statusLink;
  resObj.interfaces = portEntries;
}

async function METRO({ nmsConfig, neConfig, datek, resObj, timeout = 60000 }) {
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
        let finalResult = '';
        let loggedin = false;
        let commandExec = false;
        let finished = false;
        let streamClosed = false;
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
          if (authFailed) {
            resolve();
            return;
          }
          if (!isTimeOut) resultParser(finalResult, resObj); // Parse the result when the stream closes
          resolve();
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec) finalResult += dataStr;

          // Handle RNO NMS SSH To NE
          if (!loggedin && dataStr.includes('rno7app:~$')) {
            currentCommand = `ssh ${neConfig.username}@${datek.ip_ne}`;
            console.log(`    - Executing Command On RNO Server: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE FINGERPRINT PROMPT
          if (dataStr.includes('(yes/no/[fingerprint])?') && !loggedin) {
            console.log(`    - Fingerprint Prompt Detected: Sending yes`);
            stream.write('yes\n');
          }

          // HANDLE NE AUTH: PASSWORD
          if ((dataStr.includes('Enter password:') || dataStr.includes('Password:')) && !loggedin) {
            loggedin = true;
            console.log(`    - Entering NE Password: ${neConfig.password}`);
            stream.write(`${neConfig.password}\n`);
          }

          // HANDLE NE AUTH FAILED
          if (dataStr.includes('Received disconnect from')) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE MAIN COMMAND
          if (dataStr.includes(`<${datek.hostname_ne}>`) && !commandExec) {
            commandExec = true;
            currentCommand = `display interface ${datek.group_interface}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE PAGINATION
          if (dataStr.includes('---- More ----') && !finished) {
            finished = true;
            result += '\n';
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // HANDLE CLOSING SSH CONNECTION
          if (dataStr.includes(`<${datek.hostname_ne}>`) && finished && !streamClosed) {
            streamClosed = true;
            console.log('    - SSH Stream Closed');
            conn.end();
          }
        });

        // SSH TO NE VIA IP ADDRESS
        currentCommand = `ssh ${neConfig.username}@${datek.ip_ne}`;
        console.log(`    - Executing Command: ${currentCommand}`);
        stream.write(`${currentCommand}\n`);
      });
    });

    // ON ERROR
    conn.on('error', (err) => {
      clearTimeout(timeoutHandle); // Clear the timeout on error
      console.log('    - SSH Connection Error (SSH Failed)');
      resolve();
    });

    // ON CONNECT
    conn.connect(nmsConfig);
  });
}

export default METRO;
