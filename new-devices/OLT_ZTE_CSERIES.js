import { Client as SSHClient } from 'ssh2';

function parser(resultStr) {
  const keyword = 'Phase state:';
  const regex = new RegExp(`${keyword}\\s*(\\w+)`);
  const searchResult = resultStr.match(regex);
  if (searchResult) {
    const key = searchResult[1]; // The next word after keyword
    if (key === 'working') return '✅';
  }
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
          statusLink = authFailed ? '🟨' : parser(finalResult);
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
          // OLT ZTE C300: authentication failed
          // OLT ZTE C600: Authentication for TACACS+ failed
          if (dataStr.includes('authentication failed') || dataStr.includes('Authentication for TACACS+ failed')) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE MAIN COMMAND
          if (dataStr.includes(`${site.hostname}#`) && !commandExec) {
            commandExec = true;
            let mainCommand = ``;
            switch (site.device) {
              case 'OLT ZTE C600':
                mainCommand = `show gpon onu detail-info gpon_onu-${site.interface}`;
                break;
              case 'OLT ZTE C300v2':
                mainCommand = `show gpon onu detail-info gpon-onu_${site.interface}`;
                break;
              default:
                // OLT ZTE C300
                mainCommand = `show gpon onu detail gpon-onu_${site.interface}`;
                break;
            }
            console.log(`    - Executing Command: ${mainCommand}`);
            stream.write(`${mainCommand}\n`);
          }

          // HANDLE PAGINATION
          if (dataStr.includes('--More--')) {
            finished = true;
            result += '\n';
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // HANDLE CLOSING SSH CONNECTION
          if (dataStr.includes(`${site.hostname}#`) && finished) {
            console.log('    - SSH Stream Closed');
            conn.end();
          }
        });

        // TELNET TO NE VIA IP ADDRESS / HOSTNAME
        console.log(`    - Executing Command: telnet ${site.ip}`);
        stream.write(`telnet ${site.ip}\n`);
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
