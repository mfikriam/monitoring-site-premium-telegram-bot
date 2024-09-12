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
          let counter = 0;

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
            if (dataStr.includes('Login:') && !loggedin) {
              console.log(`    - Entering Telnet Username: ${telnetConfig.username}`);
              stream.write(`${telnetConfig.username}\n`);
            }

            // HANDLE TELNET PASSWORD
            if (dataStr.includes('Password:') && !loggedin) {
              loggedin = true;
              console.log(`    - Entering Telnet Password: ${telnetConfig.password}`);
              stream.write(`${telnetConfig.password}\n`);
            }

            // HANDLE WRONG TELNET USERNAME/PASSWORD
            if (dataStr.includes('Login Failed')) {
              authFailed = true;
              console.log(`    - Wrong Telnet Username or Password`);
              conn.end();
            }

            // HANDLE FIRST COMMAND
            // GPON00-D7-RPN-4MRA# cd onu
            if (dataStr.includes(`${telnetConfig.host}#`) && loggedin && !firstCommandExec) {
              firstCommandExec = true;
              console.log(`    - Executing First Command: ${firstCommand}`);
              stream.write(`${firstCommand}\n`);
            }

            // HANDLE SECOND COMMAND
            // GPON00-D7-RPN-4MRA\onu# show onu_state slot 1 pon 13 onu 1
            if (dataStr.includes('#') && loggedin && firstCommandExec && !secondCommandExec) {
              secondCommandExec = true;
              console.log(`    - Executing Second Command: ${secondCommand}`);
              stream.write(`${secondCommand}\n`);
            }

            // HANDLE FINISHED
            // GPON00-D7-RPN-4MRA\onu#
            // if (dataStr.includes(`${telnetConfig.host}\\onu#`) && secondCommandExec && !finished) {
            //   finished = true;
            // }
            // GPON02-D7-WTG-4(config)#
            // if (dataStr.includes(`${telnetConfig.host}(config)#`) && secondCommandExec && !finished) {
            //   finished = true;
            // }
            if (secondCommandExec && !finished) {
              counter++;
            }
            if (counter > 2) {
              finished = true;
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
