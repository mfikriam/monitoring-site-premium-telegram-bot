import { Client as SSHClient } from 'ssh2';
import parser from '../parsers/KEYWORD_PARSER.js';

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

          const [firstCommand, secondCommand] = telnetConfig.command;
          let statusLink = '###';
          let result = '';
          let finalResult = '';
          let loggedin = false;
          let authFailed = false;
          let firstCommandExec = false;
          let secondCommandExec = false;
          let finished = false;

          // STREAM CLOSE HANDLER
          stream.on('close', () => {
            // console.log(result);
            // console.log(finalResult);

            statusLink = authFailed ? 'Auth Failed 🟨' : parser(finalResult, telnetConfig.keyword);
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
            if (secondCommandExec) finalResult += dataStr;

            // HANDLE TELNET USERNAME
            if (dataStr.includes('Username:') && !loggedin) {
              console.log(`    - Entering Telnet Username: ${telnetConfig.username}`);
              stream.write(`${telnetConfig.username}\n`);
            }

            // HANDLE TELNET PASSWORD
            if (dataStr.includes('Password:')) {
              loggedin = true;
              console.log(`    - Entering Telnet Password: ${telnetConfig.password}`);
              stream.write(`${telnetConfig.password}\n`);
            }

            // HANDLE WRONG TELNET USERNAME/PASSWORD
            if (dataStr.includes('% Information incomplete')) {
              authFailed = true;
              console.log(`    - Wrong Telnet Username or Password`);
              conn.end();
            }

            // HANDLE FIRST COMMAND
            // SW-D7-TSEL-ADL007>enable
            if (dataStr.includes('>') && loggedin && !firstCommandExec) {
              firstCommandExec = true;
              console.log(`    - Executing First Command: ${firstCommand}`);
              stream.write(`${firstCommand}\n`);
            }

            // HANDLE SECOND COMMAND
            // SW-D7-TSEL-ADL007#show interface gei-0/1/1/7
            if (dataStr.includes('#') && loggedin && firstCommandExec && !secondCommandExec) {
              secondCommandExec = true;
              console.log(`    - Executing Second Command: ${secondCommand}`);
              stream.write(`${secondCommand}\n`);
            }

            // HANDLE PAGINATION
            if (dataStr.includes('--More--')) {
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
          const commandTelnet = `telnet ${telnetConfig.host}`;
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
