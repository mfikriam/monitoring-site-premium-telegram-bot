import { Client as SSHClient } from 'ssh2';

function parser(resultStr) {
  const keyword = 'is active';
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
        let finished = false;
        let firstCommandExec = false;
        let secondCommandExec = false;
        let thirdCommandExec = false;
        let currentCommand = '';
        let port = '';

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
          if (thirdCommandExec) finalResult += dataStr;

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
          if (dataStr.includes('Login Failed')) {
            authFailed = true;
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // HANDLE FIRST COMMAND
          if (dataStr.includes(`${site.hostname}#`) && loggedin && !firstCommandExec) {
            firstCommandExec = true;
            currentCommand = `config`;
            console.log(`    - Executing First Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE SECOND COMMAND
          if (dataStr.includes(`${site.hostname}(config)#`) && loggedin && firstCommandExec && !secondCommandExec) {
            secondCommandExec = true;
            port = site.interface.split('/');
            currentCommand = `interface pon 1/${port[0]}/${port[1]}`;
            console.log(`    - Executing Second Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE THIRD COMMAND
          if (
            dataStr.includes(`${site.hostname}(config-if-pon-`) &&
            loggedin &&
            firstCommandExec &&
            secondCommandExec &&
            !thirdCommandExec
          ) {
            thirdCommandExec = true;
            port = site.interface.split('/');
            currentCommand = `show onu active-state ${port[2]}`;
            console.log(`    - Executing Third Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // HANDLE FINISHING
          if (thirdCommandExec && dataStr.includes('.')) {
            finished = true;
          }

          // HANDLE CLOSING SSH CONNECTION
          if (dataStr.includes(`${site.hostname}(config-if-pon-`) && finished) {
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
