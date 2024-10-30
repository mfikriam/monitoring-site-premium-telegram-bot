import { Client as SSHClient } from 'ssh2';
import parser from '../parsers/KEYWORD_PARSER.js';

async function ont({ sshConfig, telnetConfig, timeout = 15000 }) {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();
    let timeoutHandle;

    conn
      .on('ready', () => {
        const sshTitle = `${sshConfig.username}@${sshConfig.host} ${sshConfig.password}`;
        console.log(`    - SSH Connection Established: ${sshTitle}`);

        conn.shell((err, stream) => {
          if (err) {
            console.log('    - Error Starting Shell');
            return resolve('SSH Failed 🟨');
          }

          let statusLink = '###';
          let result = '';
          let finalResult = '';
          let loggedin = false;
          let authFailed = false;
          let commandExec = false;
          let finished = false;

          // Set a timeout to limit streaming time
          timeoutHandle = setTimeout(() => {
            console.log('    - Streaming Timeout Exceeded');
            stream.end(); // End the stream if timeout is reached
            console.log('    - SSH Stream Closed');
            conn.end(); // Close the SSH connection
            // return resolve('LOS ❌');
          }, timeout);

          // STREAM CLOSE HANDLER
          stream.on('close', () => {
            // Clear the timeout if stream closes before time limit
            clearTimeout(timeoutHandle);

            statusLink = authFailed ? 'Auth Failed 🟨' : parser(finalResult, telnetConfig.keyword);
            console.log(`    - Status Link: ${statusLink}`);
            resolve(statusLink);
          });

          // STREAM DATA HANDLER
          stream.on('data', (data) => {
            const dataStr = data.toString();
            result += dataStr;
            if (commandExec) finalResult += dataStr;

            // Handle Telnet login and commands
            if (dataStr.includes('Username:') && !loggedin) {
              console.log(`    - Entering Telnet Username: ${telnetConfig.username}`);
              stream.write(`${telnetConfig.username}\n`);
            }

            if (dataStr.includes('Password:')) {
              loggedin = true;
              console.log(`    - Entering Telnet Password: ${telnetConfig.password}`);
              stream.write(`${telnetConfig.password}\n`);
            }

            if (dataStr.includes('%No such user or bad password.')) {
              authFailed = true;
              console.log('    - Wrong Telnet Username or Password');
              conn.end();
            }

            if (commandExec) {
              finished = true;
            }

            if (loggedin && !commandExec) {
              commandExec = true;
              console.log(`    - Executing Command: ${telnetConfig.command}`);
              stream.write(`${telnetConfig.command}\n`);
            }

            if (finished) {
              console.log('    - SSH Stream Closed');
              conn.end();
            }
          });

          // TELNET TO HOST NE
          const commandTelnet = `telnet ${telnetConfig.host}`;
          console.log(`    - Executing Command: ${commandTelnet}`);
          stream.write(`${commandTelnet}\n`);
        });
      })
      .on('error', (err) => {
        clearTimeout(timeoutHandle); // Clear the timeout on error
        console.log('    - SSH Connection Error');
        return resolve('SSH Failed 🟨');
      })
      .connect(sshConfig);
  });
}

export default ont;
