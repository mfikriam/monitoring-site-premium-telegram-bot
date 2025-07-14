import { Client as SSHClient } from 'ssh2';

function linksParser(resultString, resObj) {
  // console.log(resultString);
  resObj.statusLink = '✅';

  for (const intf of resObj.interfaces) {
    const regex = new RegExp(`\\s+${intf.portName}\\s+\\S+\\s+(\\S+)`, 'i');
    const match = resultString.match(regex);

    if (match && match[1] === 'Full') intf.portStatus = '✅';
    else intf.portStatus = '❌';

    // Print Status Interface
    const portDesc = intf.portStatus === '✅' ? 'Working' : 'LOS';
    console.log(`    - Status Interface ${intf.portName}: ${portDesc} ${intf.portStatus} (${intf.portRoute})`);
  }
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
        let finished = false;
        let currentCommand = '';

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
          linksParser(finalResult, resObj);
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
            console.log(`    - Executing Command On RNO Server: ${currentCommand} (${datek.hostname_ne})`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE FINGERPRINT PROMPT
          if (dataStr.includes('(yes/no/[fingerprint])?') && !loggedin) {
            console.log(`    - Fingerprint Prompt Detected: Sending yes`);
            stream.write('yes\n');
          }

          // HANDLE NE AUTH: PASSWORD
          if (dataStr.includes('password:') && !loggedin) {
            loggedin = true;
            console.log(`    - Entering NE Password: ${neConfig.password}`);
            stream.write(`${neConfig.password}\n`);
          }

          // HANDLE NE AUTH FAILED
          if (dataStr.includes('Permission denied, please try again.')) {
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE MAIN COMMAND
          if (dataStr.includes(`<${datek.hostname_ne}>`) && !commandExec) {
            commandExec = true;
            currentCommand = `display ospf peer brief`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE FINISHING (QUIT NMS)
          if (commandExec && dataStr.includes('>') && !finished) {
            finished = true;
            console.log(`    - Quit the NMS Server`);
            stream.write(`quit\n`);
          }

          // HANDLE CLOSING SSH CONNECTION
          if (finished && dataStr.includes('closed.')) {
            console.log('    - SSH Stream Closed');
            conn.end();
          }
        });

        // SSH TO NE VIA IP ADDRESS
        currentCommand = `ssh ${neConfig.username}@${datek.ip_ne}`;
        console.log(`    - Executing Command: ${currentCommand} (${datek.hostname_ne})`);
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
