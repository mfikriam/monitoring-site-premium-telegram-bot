import { Client as SSHClient } from 'ssh2';

// Import Utils
import getWarningStatus from '../utils/get-warning-status.js';

function resultParser(resObj) {
  // Initialized Current BW & Max Bw
  resObj.currentBW = 0;
  resObj.maxBW = resObj.interfaces.length * 10;

  // Initialize statusLink to UP
  resObj.statusLink = '✅';

  for (const intf of resObj.interfaces) {
    // Get result string
    const resultString = intf.resultString;

    // Update interface status
    if (resultString && resultString.includes(`${intf.portName.replace(' ', '')} is UP, administrative status is UP`)) {
      resObj.currentBW += 10;
      intf.portStatus = 'Up';
    } else {
      resObj.statusLink = '❌';
      intf.portStatus = 'LOS';
    }

    // // Test LOS interface
    // if (intf.portName === 'port-channel 1') {
    //   resObj.currentBW -= 10;
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

async function L2SW({ nmsConfig, neConfig, datek, resObj, timeout = 60000 }) {
  return new Promise((resolve, reject) => {
    // CREATE SSH CONN INSTANCE
    const conn = new SSHClient();

    // INITIALIZE TIMEOUT HANDLE
    let timeoutHandle;

    // ON READY
    conn.on('ready', () => {
      // PRINT CONNECTION TITLE
      const connTitle = `${nmsConfig.username}@${nmsConfig.host} ${nmsConfig.password}`;
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
        let streamClosed = false;
        let currentCommand = '';
        let indexLink = 0;
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
          if (!isTimeOut) resultParser(resObj); // Parse the result when the stream closes
          resolve();
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();
          // console.log(dataStr);

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec) linkResult += dataStr;

          // Handle RNO NMS SSH To NE
          if (!loggedin && dataStr.includes('rno7app:~$')) {
            currentCommand = `telnet ${datek.ip_ne}`;
            console.log(`    - Executing Command On RNO Server: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE NE AUTH: USERNAME
          if (dataStr.includes('Login:') && !loggedin) {
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
          if (dataStr.includes('Login:') && loggedin) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE MAIN COMMAND
          if (dataStr.includes(`${datek.hostname_ne}#`) && !commandExec && indexLink < resObj.interfaces.length) {
            commandExec = true;
            currentCommand = `show interface ${resObj.interfaces[indexLink].portName}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // Save Result String
          if (
            dataStr.includes(`${datek.hostname_ne}#`) &&
            dataStr.includes(`output(hwc):`) &&
            indexLink < resObj.interfaces.length
          ) {
            resObj.interfaces[indexLink].resultString = linkResult;
            linkResult = '';
            console.log(`    - Save result string for ${resObj.interfaces[indexLink].portName}`);

            indexLink++;
            // commandExec = false;

            // Move To Next Interface
            if (indexLink < resObj.interfaces.length) {
              console.log('    - Move to next interface');
              currentCommand = `show interface ${resObj.interfaces[indexLink].portName}`;
              console.log(`    - Executing Command: ${currentCommand}`);
              stream.write(`${currentCommand}\n`);
            }
          }

          // HANDLE FINISHING
          if (dataStr.includes(`${datek.hostname_ne}#`) && !finished && indexLink === resObj.interfaces.length) {
            finished = true;
          }

          // HANDLE CLOSING SSH CONNECTION
          if (finished && !streamClosed) {
            streamClosed = true;
            console.log('    - Closing SSH Connection');
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
