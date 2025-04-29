import { Client as SSHClient } from 'ssh2';

function resultsParser(resObj) {
  // Assume status link is UP;
  resObj.statusLink = '✅';

  for (const intf of resObj.interfaces) {
    // Get result string
    const resultString = intf.resultString;

    // Update interface status
    const keyword = `${intf.portName} current state : UP`;
    if (resultString && resultString.includes(keyword)) {
      resObj.numUpInterfaces++;
      intf.portStatus = 'UP';
    } else {
      resObj.statusLink = '❌';
      intf.portStatus = 'LOS';
    }

    // // Test LOS interface
    // if (intf.portName === 'Eth-Trunk1.12') {
    //   resObj.numUpInterfaces--;
    //   resObj.statusLink = '❌';
    //   intf.portStatus = 'LOS';
    // }

    // Print status port
    console.log(
      `    - Status Interface ${intf.portName}: ${intf.portStatus} ${intf.portStatus === 'UP' ? '✅' : '❌'}`,
    );
  }

  // Print status link
  console.log(`    - Status Link: ${resObj.statusLink}`);
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
        let linkResult = '';
        let loggedin = false;
        let commandExec = false;
        let finished = false;
        let streamClosed = false;
        let currentCommand = '';
        let indexLink = 0;

        // SET A TIMEOUT TO LIMIT STREAMING TIME
        timeoutHandle = setTimeout(() => {
          console.log('    - Streaming Timeout Exceeded');
          stream.end(); // End the stream if timeout is reached
          console.log('    - SSH Stream Closed');
          conn.end(); // Close the SSH connection
        }, timeout);

        // STREAM CLOSE HANDLER
        stream.on('close', () => {
          clearTimeout(timeoutHandle); // Clear the timeout if stream closes before time limit
          resultsParser(resObj);
          console.log('    - SSH Stream Closed');
          resolve();
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec) linkResult += dataStr;

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
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE LINK COMMAND
          if (dataStr.includes(`<${datek.hostname_ne}>`) && !commandExec && indexLink < resObj.interfaces.length) {
            commandExec = true;
            currentCommand = `display interface ${resObj.interfaces[indexLink].portName}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE LINK PAGINATION
          if (dataStr.includes('---- More ----') && !finished) {
            result += '\n';
            resObj.interfaces[indexLink].resultString = linkResult;
            linkResult = '';
            commandExec = false;
            indexLink++;
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // HANDLE FINISHING
          if (dataStr.includes(`<${datek.hostname_ne}>`) && !finished && indexLink === resObj.interfaces.length) {
            finished = true;
          }

          // HANDLE CLOSING SSH CONNECTION
          if (finished && !streamClosed) {
            streamClosed = true;
            console.log('    - Closing SSH Connection');
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
