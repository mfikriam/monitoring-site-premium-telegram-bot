import { Client as SSHClient } from 'ssh2';

// IMPORT UTILS
import getStatusDesc from '../utils/get-status-descriptions.js';

function linksParser(linksObj) {
  for (const link of linksObj) {
    // DEFINE RESULT STRING
    const resultString = link.resultString;

    // UPDATE STATUS LINK
    // GigabitEthernet2/1/1.3557 current state : UP
    const keyword = `${link.interface_port_ne} current state : UP`;
    if (resultString && resultString.includes(keyword)) link.statusLink = '✅';
    else link.statusLink = '❌';

    // PRINT STATUS LINK
    const statusDesc = getStatusDesc(link.statusLink);
    console.log(`    - Status Link ${link.interface_port_ne}: ${statusDesc} ${link.statusLink}`);

    // UPDATE CURRENT BW & MAX BW
    const portBWMatch = link.resultString.match(/Port BW:\s*(\d+)G/);
    const maxBWMatch = link.resultString.match(/max BW:\s*(\d+)G/);
    link.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) : 0;
    link.maxBW = maxBWMatch ? parseInt(maxBWMatch[1], 10) : 0;
  }
}

async function METRO({ nmsConfig, neConfig, site, linksObj, timeout = 60000 }) {
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
          linksParser(linksObj);
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
          if (dataStr.includes(`<${site.hostname_ne}>`) && !commandExec && indexLink < linksObj.length) {
            commandExec = true;
            currentCommand = `display interface ${linksObj[indexLink].interface_port_ne}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE LINK PAGINATION
          if (dataStr.includes('---- More ----') && !finished) {
            result += '\n';
            linksObj[indexLink].resultString = linkResult;
            linkResult = '';
            commandExec = false;
            indexLink++;
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // HANDLE FINISHING
          if (dataStr.includes(`<${site.hostname_ne}>`) && !finished && indexLink === linksObj.length) {
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
        currentCommand = `ssh ${neConfig.username}@${site.ip_ne}`;
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
