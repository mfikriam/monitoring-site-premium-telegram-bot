import { Client as SSHClient } from 'ssh2';

// IMPORT UTILS
import getStatusDesc from '../utils/get-status-descriptions.js';

function parserS5800v3(link) {
  // DEFINE RESULT STRING
  const resultString = link.resultString;

  // UPDATE STATUS LINK
  if (resultString && resultString.includes('admin state : up') && resultString.includes('current state : up'))
    link.statusLink = '✅';
  else link.statusLink = '❌';

  // PRINT STATUS LINK
  const statusDesc = getStatusDesc(link.statusLink);
  console.log(`    - Status Link ${link.interface_port_ne}: ${statusDesc} ${link.statusLink}`);

  // UPDATE CURRENT BW & MAX BW
  if (link.interface_port_ne.includes('eth-trunk')) {
    const portBWMatch = link.resultString.match(/Cur-BW\(M\):\s*(\d+)/);
    const maxBWMatch = link.resultString.match(/Max-BW\(M\):\s*(\d+)/);
    link.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) / 1000 : 0; // Convert To Gbps
    link.maxBW = maxBWMatch ? parseInt(maxBWMatch[1], 10) / 1000 : 0; // Convert To Gbps
  } else {
    const portBWMatch = link.resultString.match(/Speed\s*:\s*(\d+)M\(bps\),/);
    link.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) / 1000 : 0; // Convert To Gbps
  }
}

function parserS5800v2(link) {
  // DEFINE RESULT STRING
  const resultString = link.resultString;

  // UPDATE STATUS LINK
  const keyword = `Admin state is up,operation state is up`;
  if (resultString && resultString.includes(keyword)) link.statusLink = '✅';
  else link.statusLink = '❌';

  // PRINT STATUS LINK
  const statusDesc = getStatusDesc(link.statusLink);
  console.log(`    - Status Link ${link.interface_port_ne}: ${statusDesc} ${link.statusLink}`);

  // UPDATE CURRENT BW & MAX BW
  if (link.interface_port_ne.includes('eth-trunk')) {
    const portBWMatch = link.resultString.match(/Alias:[^4]*4x(\d+)G/);
    link.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) : 0;
  } else {
    const portBWMatch = link.resultString.match(/Speed is (\d+)M\(bps\)/);
    link.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) / 1000 : 0; // Convert To Gbps
  }
}

function linksParser(linksObj) {
  for (const link of linksObj) {
    switch (link.ne) {
      case 'L2SW FH S5800v2':
        parserS5800v2(link);
        break;
      case 'L2SW FH S5800v3':
        parserS5800v3(link);
        break;
      default:
        break;
    }
  }
}

async function L2SW({ nmsConfig, neConfig, site, linksObj, timeout = 60000 }) {
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
        let startSavedResult = false;

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
          if (startSavedResult) linkResult += dataStr;

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

          // HANDLE LINK COMMAND
          if (dataStr.includes(`${site.hostname_ne}#`) && !commandExec && indexLink < linksObj.length) {
            commandExec = true;
            startSavedResult = true;
            currentCommand = `show interface ${linksObj[indexLink].interface_port_ne}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE SAVING RESULT: L2SW FH S5800v2
          if (linkResult.includes('Oversize:') && startSavedResult) {
            startSavedResult = false;
            stream.write('\n');
          }

          // HANDLE SAVING RESULT: L2SW FH S5800v3
          if (linkResult.includes('Total Error     :') && startSavedResult) {
            startSavedResult = false;
            stream.write('\n');
          }

          // HANDLE LINK PAGINATION
          if (dataStr.includes('--More--') && !finished) {
            result += '\n';
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // HANDLE REPEATING COMMAND
          if (
            dataStr.includes(`${site.hostname_ne}#`) &&
            commandExec &&
            !finished &&
            indexLink < linksObj.length &&
            !startSavedResult
          ) {
            linksObj[indexLink].resultString = linkResult;
            linkResult = '';
            commandExec = false;
            indexLink++;
          }

          // HANDLE FINISHING
          if (dataStr.includes(`${site.hostname_ne}#`) && !finished && indexLink === linksObj.length) {
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
        console.log(`    - Executing Command: telnet ${site.ip_ne}`);
        stream.write(`telnet ${site.ip_ne}\n`);
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
