import { Client as SSHClient } from 'ssh2';

function resultParser(resObj) {
  // Initialized Current BW & Max Bw
  resObj.currentBW = 0;
  resObj.maxBW = resObj.interfaces.length * 10;

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
      resObj.currentBW += 10;
      intf.portStatus = 'Up';
    } else {
      resObj.statusLink = '❌';
      intf.portStatus = 'LOS';
    }

    // // Test LOS interface
    // if (intf.portName === '10gigaethernet 1/0/16') {
    //   resObj.currentBW -= 10;
    //   resObj.statusLink = '❌';
    //   intf.portStatus = 'LOS';
    // }

    // Print status port
    console.log(
      `    - Status Interface ${intf.portName}: ${intf.portStatus} ${intf.portStatus === 'Up' ? '✅' : '❌'}`,
    );
  }

  // Print status link
  console.log(`    - Status Link: ${resObj.statusLink}`);
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
        let linkResult = '';
        let loggedin = false;
        let commandExec = false;
        let finished = false;
        let streamClosed = false;
        let currentCommand = '';
        let indexLink = 0;
        let indexPagination = 0;

        // Set a timeout to limit streaming time
        timeoutHandle = setTimeout(() => {
          console.log('    - Streaming Timeout Exceeded');
          resObj.statusLink = '🟨'; // Mark status as timeout
          stream.end(); // End the stream if timeout is reached
          console.log('    - SSH Stream Closed');
          conn.end(); // Close the SSH connection
        }, timeout);

        // STREAM CLOSE HANDLER
        stream.on('close', () => {
          clearTimeout(timeoutHandle); // Clear the timeout if stream closes before time limit
          resultParser(resObj); // Parse the result when the stream closes
          resolve();
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();

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
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // Handle Main Command
          if (dataStr.includes(`${datek.hostname_ne}#`) && !commandExec && indexLink < resObj.interfaces.length) {
            currentCommand = `show interface ${resObj.interfaces[indexLink].portName}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
            commandExec = true;
          }

          // Handle Paginations
          if (dataStr.includes('--More--') && !finished) {
            result += '\n';

            if (indexPagination === 0) {
              resObj.interfaces[indexLink].resultString = linkResult;
              console.log(`    - Save Result String for ${resObj.interfaces[indexLink].portName}`);
            } else {
              linkResult = '';
            }

            indexPagination++;
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // Move To Next Interface
          if (
            dataStr.includes(`Output bandwidth utilization :`) &&
            dataStr.includes(`${datek.hostname_ne}#`) &&
            commandExec
          ) {
            console.log('    - Move to next interface');
            linkResult = '';
            indexPagination = 0;
            indexLink++;

            if (indexLink < resObj.interfaces.length) {
              currentCommand = `show interface ${resObj.interfaces[indexLink].portName}`;
              stream.write(`${currentCommand}\n`);
              console.log(`    - Executing Command: ${currentCommand}`);
            }

            if (indexLink === resObj.interfaces.length) {
              finished = true;
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
      console.log(err);
      clearTimeout(timeoutHandle); // Clear the timeout on error
      console.log('    - SSH Connection Error (SSH Failed)');
      resolve();
    });

    // ON CONNECT
    conn.connect(nmsConfig);
  });
}

export default L2SW;
