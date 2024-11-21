import { Client as SSHClient } from 'ssh2';

function parser(resultStr, site) {
  // GigabitEthernet2/1/1.3557 current state : UP
  const keyword = `${site.interface} current state : UP`;
  if (resultStr && resultStr.includes(keyword)) return '✅';
  return '❌';
}

async function OLT({ sshConfig, site, neConfig, timeout = 15000 }) {
  return new Promise((resolve, reject) => {
    // CREATE SSH CONN INSTANCE
    const conn = new SSHClient();

    // INITIALIZE TIMEOUT HANDLE
    let timeoutHandle;

    // ON READY
    conn.on('ready', () => {
      // PRINT CONNECTION TITLE
      const connTitle = `${sshConfig.username}@${sshConfig.host} ${sshConfig.password}`;
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
        let commandExec = false;
        let finished = false;
        let streamClosed = false;
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
          console.log(`    - Status Link: ${statusLink}`);
          resolve(statusLink);
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec) finalResult += dataStr;

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
          if (dataStr.includes(`<${site.hostname}>`) && !commandExec) {
            commandExec = true;
            currentCommand = `display interface ${site.interface}`;
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

          // HANDLE FINISHING
          if (dataStr.includes('Current system time:') && !finished) {
            finished = true;
          }

          // HANDLE CLOSING SSH CONNECTION
          if (finished && !streamClosed) {
            streamClosed = true;
            console.log('    - SSH Stream Closed');
            conn.end();
          }
        });

        // SSH TO NE VIA IP ADDRESS / HOSTNAME
        currentCommand = `ssh ${neConfig.username}@${site.ip}`;
        console.log(`    - Executing Command: ${currentCommand}`);
        stream.write(`${currentCommand}\n`);
      });
    });

    // ON ERROR
    conn.on('error', (err) => {
      clearTimeout(timeoutHandle); // Clear the timeout on error
      console.log('    - SSH Connection Error (SSH Failed)');
      resolve('🟨');
    });

    // ON CONNECT
    conn.connect(sshConfig);
  });
}

export default OLT;
