import { Client as SSHClient } from 'ssh2';
import parser from '../parsers/L2SW_ZTE_ZXR10_VIA_METRO_Parser.js';

async function ont({ sshConfig, telnetConfig }) {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();

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

          // STREAM CLOSE HANDLER
          stream.on('close', () => {
            // console.log(result);
            // console.log(finalResult);

            statusLink = authFailed ? 'Auth Failed 🟨' : parser(finalResult);
            console.log(`    - Status Link: ${statusLink}`);
            resolve(statusLink);
          });

          // STREAM DATA HANDLER
          stream.on('data', (data) => {
            // CONVERT STREAM DATA TO STRING
            const dataStr = data.toString();
            // console.log(dataStr);

            // STORE THE STREAM DATA
            result += dataStr;
            if (commandExec) finalResult += dataStr;

            // HANDLE TELNET PASSWORD
            if (dataStr.includes('Enter password:') && !loggedin) {
              loggedin = true;
              console.log(`    - Entering Telnet Password: ${telnetConfig.password}`);
              stream.write(`${telnetConfig.password}\n`);
            }

            // HANDLE WRONG TELNET USERNAME/PASSWORD
            if (dataStr.includes('Received disconnect from')) {
              authFailed = true;
              console.log(`    - Wrong Telnet Username or Password`);
              conn.end();
            }

            // HANDLE COMMAND
            // <ME-D7-SIN>
            if (dataStr.includes(`<${telnetConfig.host}>`) && !commandExec) {
              commandExec = true;
              console.log(`    - Executing Command: ${telnetConfig.command}`);
              stream.write(`${telnetConfig.command}\n`);
            }

            // HANDLE PAGINATION
            if (dataStr.includes('---- More ----')) {
              finished = true;
              result += '\n';
              console.log('    - Pagination Detected: Sending Space');
              stream.write(' '); // Send space to continue past pagination
            }

            // HANDLE CLOSING SSH CONNECTION
            if (finished) {
              console.log('    - SSH Stream Closed');
              conn.end();
            }
          });

          // TELNET TO HOST NE
          // ssh mso7-haris@ME-D7-SIN
          const commandTelnet = `ssh ${telnetConfig.username}@${telnetConfig.host}`;
          console.log(`    - Executing Command: ${commandTelnet}`);
          stream.write(`${commandTelnet}\n`);
        });
      })
      // ERROR HANDLING
      .on('error', (err) => {
        console.log('    - SSH Connection Error');
        return resolve('SSH Failed 🟨');
      })
      // CONNECT TO SSH STREAM
      .connect(sshConfig);
  });
}

export default ont;
