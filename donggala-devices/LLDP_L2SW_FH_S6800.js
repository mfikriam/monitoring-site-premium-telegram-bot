import { Client as SSHClient } from 'ssh2';

function checkInterfaceStatus(resultString, resObj) {
  // console.log(resultString);

  // Update Interface Bandwidth
  const maxBWMatch = resultString.match(/Speed\s*:\s*(\d+)\(Mbps\)/i);
  resObj.currentBW = 0;
  resObj.maxBW = maxBWMatch ? parseInt(maxBWMatch[1], 10) / 1000 : 0;

  // Update Interface Status
  const lines = resultString.trim().split('\n');
  const localInterfaces = lines.map((line) => line.trim().split(/\s+/)[0]);
  if (localInterfaces.includes(resObj.interfaceAlias)) {
    resObj.currentBW += resObj.maxBW;
    resObj.statusLink = '✅';
  } else {
    resObj.statusLink = '❌';
  }

  // Print Status Link
  console.log(`    - Status Link: ${resObj.currentBW}/${resObj.maxBW} ${resObj.statusLink}`);
}

async function L2SW({ nmsConfig, neConfig, datek, resObj, timeout = 30000 }) {
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
        let finalResult = '';
        let loggedin = false;
        let commandExec = false;
        let secondCommand = false;
        let finished = false;
        let currentCommand = '';
        let isTimeOut = false;
        let authFailed = false;

        // SET A TIMEOUT TO LIMIT STREAMING TIME
        timeoutHandle = setTimeout(() => {
          console.log('    - Streaming Timeout Exceeded');
          stream.end(); // End the stream if timeout is reached
          console.log('    - SSH Stream Closed');
          conn.end(); // Close the SSH connection
        }, timeout);

        // STREAM CLOSE HANDLER
        stream.on('close', () => {
          clearTimeout(timeoutHandle);
          if (!authFailed && !isTimeOut) checkInterfaceStatus(finalResult, resObj);
          resolve();
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();
          // console.log(dataStr);

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec) finalResult += dataStr;

          // Handle RNO NMS SSH To NE
          if (!loggedin && dataStr.includes('rno7app:~$')) {
            currentCommand = `telnet ${datek.ip_ne}`;
            console.log(`    - Executing Command On RNO Server: ${currentCommand} (${datek.hostname_ne})`);
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
          if (dataStr.includes('User login failed.') && loggedin) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // Run LLDP Command
          if (dataStr.includes(`${datek.hostname_ne}#`) && !commandExec) {
            commandExec = true;
            currentCommand = `show lldp remote`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // Handle Pagination
          if (dataStr.includes('--More--')) {
            result += '\n';
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // Run Interface Command
          if (commandExec && dataStr.includes(`${datek.hostname_ne}#`) && !finished && !secondCommand) {
            secondCommand = true;
            currentCommand = `show interface ${resObj.interface}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // Quit The NMS Server
          if (commandExec && secondCommand && dataStr.includes(`${datek.hostname_ne}#`) && !finished) {
            finished = true;
            console.log(`    - Quit the NMS Server`);
            stream.write(`quit\n`);
          }

          // HANDLE CLOSING SSH CONNECTION
          if (finished && dataStr.includes('Connection closed by foreign host.')) {
            console.log('    - SSH Stream Closed');
            conn.end();
          }
        });

        // TELNET TO NE VIA IP ADDRESS
        console.log(`    - Executing Command: telnet ${datek.ip_ne} (${datek.hostname_ne})`);
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
