import { Client as SSHClient } from 'ssh2';
import config from '../utils/config.js';

async function ont({ nms, host, username, password, command }) {
  const sshConfig = nms === 'GPON' ? config.nms.gpon : config.nms.metro;

  return new Promise((resolve, reject) => {
    const conn = new SSHClient();

    conn
      .on('ready', () => {
        console.log(
          `    - SSH connection established: ${sshConfig.username}@${sshConfig.host} ${sshConfig.port} ${sshConfig.password}`,
        );

        conn.shell((err, stream) => {
          if (err) {
            console.log('    - Error starting shell');
            return reject(err);
          }

          let result = '';
          let finalResult = '';
          let finished = false;
          let loggedin = false;
          let authFailed = false;

          stream.on('close', () => {
            console.log('    - SSH stream closed');
            conn.end();

            // console.log(result);
            // console.log(finalResult);

            if (authFailed) {
              resolve('auth failed');
            } else {
              resolve(finalResult);
            }
          });

          stream.on('data', (data) => {
            const dataStr = data.toString();
            // console.log(dataStr);

            result += dataStr;
            if (loggedin && !finished) finalResult += dataStr;

            // Handle telnet username
            if (dataStr.includes('Username:') && !loggedin) {
              console.log(`    - Entering telnet username: ${username}`);
              stream.write(`${username}\n`);
            }

            // Handle telnet password
            if (dataStr.includes('Password:') && !loggedin) {
              loggedin = true;
              console.log(`    - Entering telnet password: ${password}`);
              stream.write(`${password}\n`);
            }

            // Handle wrong telnet username/password (ONT ZTE C600)
            if (dataStr.includes('Authentication for TACACS+ failed')) {
              authFailed = true;
              console.log(`    - Wrong telnet username or password`);
              stream.write('\x03'); // Send the CTRL+C signal
            }

            // Handle wrong telnet username/password (ONT ZTE C300)
            if (dataStr.includes('authentication failed')) {
              // TYPE USERNAME & PASSWORD 3 TIMES TO EXIT
              authFailed = true;
              loggedin = false;
              console.log(`    - Wrong telnet username or password`);
              console.log(`    - Process to input username & password 3x to exit`);
              stream.write('exit\n');
            }

            // Handle first command
            if (dataStr.includes(`${host}#`) && !finished) {
              console.log(`    - Executing command: ${command}`);
              stream.write(`${command}\n`);
            }

            // Handle pagination
            if (dataStr.includes('--More--')) {
              finished = true;
              result += '\n';
              console.log('    - Pagination detected, sending space');
              stream.write(' '); // Send space to continue past pagination
            }

            // Handle closing telnet session
            if (dataStr.includes(`${host}#`) && finished) {
              stream.write('exit\n');
            }

            // Handle confirmation prompt for saving changes
            if (dataStr.includes('confirm to logout without saving? [yes/no]')) {
              console.log('    - Confirmation prompt detected, sending yes');
              stream.write('yes\n'); // Send 'yes' response to the confirmation
            }

            // Handle telnet session closure
            if (dataStr.includes('Connection closed by foreign host.')) {
              console.log('    - Telnet session closed by remote host');
              stream.write('exit\n');
              stream.end(); // End the stream after Telnet session closes
            }
          });

          // Telnet to host NE
          console.log(`    - Executing command: telnet ${host}`);
          stream.write(`telnet ${host}\n`);
        });
      })
      .on('error', (err) => {
        console.log('    - SSH connection error');
        reject(err);
      })
      .connect(sshConfig);
  });
}

export default ont;
