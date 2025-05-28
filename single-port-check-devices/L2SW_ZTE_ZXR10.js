import { Client as SSHClient } from 'ssh2';

// IMPORT UTILS
import getStatusDesc from '../utils/get-status-descriptions.js';

function parser(resultStr, site) {
  // gei-0/1/1/7 is up
  const keyword = `${site.interface_port_ne} is up`;
  if (resultStr && resultStr.includes(keyword)) return '✅';
  return '❌';
}

async function OLT({ nmsConfig, neConfig, site, timeout = 60000 }) {
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
          return resolve('🟨');
        }

        // INITIALIZED VARIABLES
        let statusLink = '🟨';
        let result = '';
        let finalResult = '';
        let loggedin = false;
        let authFailed = false;
        let finished = false;
        let firstCommandExec = false;
        let secondCommandExec = false;
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
          clearTimeout(timeoutHandle); // Clear the timeout if stream closes before time limit
          statusLink = authFailed ? '🟨' : parser(finalResult, site);
          const statusDesc = getStatusDesc(statusLink);
          console.log(`    - Status Link: ${statusDesc} ${statusLink}`);
          resolve(statusLink);
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();

          // STORE THE STREAM DATA
          result += dataStr;
          if (secondCommandExec) finalResult += dataStr;

          // Handle RNO NMS SSH To NE
          if (!loggedin && dataStr.includes('rno7app:~$')) {
            currentCommand = `telnet ${site.ip_ne}`;
            console.log(`    - Executing Command On RNO Server: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE NE AUTH: USERNAME
          if (dataStr.includes('Username:') && !loggedin) {
            console.log(`    - Entering NE Username: ${neConfig.username}`);
            stream.write(`${neConfig.username}\n`);
          }

          // HANDLE NE AUTH: PASSWORD
          if (dataStr.includes('Password:')) {
            loggedin = true;
            console.log(`    - Entering NE Password: ${neConfig.password}`);
            stream.write(`${neConfig.password}\n`);
          }

          // HANDLE NE AUTH FAILED
          if (dataStr.includes('% Information incomplete')) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE FIRST COMMAND
          if (dataStr.includes(`${site.hostname_ne}>`) && loggedin && !firstCommandExec) {
            firstCommandExec = true;
            currentCommand = `enable`;
            console.log(`    - Executing First Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE SECOND COMMAND
          if (dataStr.includes('#') && loggedin && firstCommandExec && !secondCommandExec) {
            secondCommandExec = true;
            currentCommand = `show interface ${site.interface_port_ne}`;
            console.log(`    - Executing Second Command: ${currentCommand}`);
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
          if (dataStr.includes(`${site.hostname_ne}#`) && finished) {
            console.log('    - SSH Stream Closed');
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
      resolve('🟨');
    });

    // ON CONNECT
    conn.connect(nmsConfig);
  });
}

export default OLT;
