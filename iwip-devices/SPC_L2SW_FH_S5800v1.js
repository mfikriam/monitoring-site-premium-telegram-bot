import { Client as SSHClient } from 'ssh2';

// Import Utils
import getWarningStatus from '../utils/get-warning-status.js';

function resultParser(resultStr, resObj) {
  // Parsing Max BW & Current BW
  const portBWMatch = resultStr.match(/Cur-BW\(M\):\s*(\d+)/);
  const maxBWMatch = resultStr.match(/Max-BW\(M\):\s*(\d+)/);
  const currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) / 1000 : 0; // Convert To Gbps
  const maxBW = maxBWMatch ? parseInt(maxBWMatch[1], 10) / 1000 : 0; // Convert To Gbps

  // Initialize statusLink to UP
  let statusLink = '✅';

  // Parse interfaces
  const portEntries = [];
  const regex = /Interface\s+([\w/]+),\s+link\s+(\w+),/g;
  let match;
  while ((match = regex.exec(resultStr)) !== null) {
    const portName = match[1];
    let portStatus = match[2];

    // // Test LOS intarface
    // if (portName === '10ge1/1/4') portStatus = 'LOS';

    portEntries.push({ portName, portStatus });
    if (portStatus !== 'Up') statusLink = '❌';

    // Print status per port
    console.log(`    - Status Interface ${portName}: ${portStatus} ${portStatus === 'Up' ? '✅' : '❌'}`);
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

async function L2SW({ nmsConfig, neConfig, datek, resObj, timeout = 60000 }) {
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
        let currentCommand = '';
        let isTimeOut = false;

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
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE MAIN COMMAND
          if (dataStr.includes(`${datek.hostname_ne}#`) && !commandExec) {
            commandExec = true;
            currentCommand = `show interface ${datek.group_interface}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE PAGINATION
          if (dataStr.includes('--More--')) {
            finished = true;
            result += '\n';
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
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
      resolve();
    });

    // ON CONNECT
    conn.connect(nmsConfig);
  });
}

export default L2SW;
