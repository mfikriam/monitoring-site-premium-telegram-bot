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
            if (commandExec) finalResult += dataStr;

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
            if (dataStr.includes('%No such user or bad password.')) {
              authFailed = true;
              console.log(`    - Wrong Telnet Username or Password`);
              conn.end();
            }

            // HANDLE FINISHED
            if (commandExec) {
              finished = true;
            }

            // HANDLE COMMAND
            if (loggedin && !commandExec) {
              commandExec = true;
              console.log(`    - Executing Command: ${telnetConfig.command}`);
              stream.write(`${telnetConfig.command}\n`);
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
