import { Client as SSHClient } from 'ssh2';
import Telnet from 'telnet-client';

// SSH Function
async function sshCommand({ host, port = 22, username, password, command }) {
  return new Promise((resolve, reject) => {
    const conn = new SSHClient();
    conn
      .on('ready', () => {
        conn.exec(command, (err, stream) => {
          if (err) reject(err);
          let data = '';
          stream.on('data', (chunk) => (data += chunk));
          stream.on('close', () => {
            conn.end();
            resolve(data);
          });
        });
      })
      .on('error', (err) => reject(err))
      .connect({ host, port, username, password });
  });
}

// Telnet Function
async function telnetCommand({ host, port = 23, username, password, command }) {
  const telnet = new Telnet();
  const params = {
    host,
    port,
    negotiationMandatory: false,
    timeout: 1500,
    shellPrompt: /[$%#>]$/i,
    loginPrompt: /login[: ]*$/i,
    passwordPrompt: /Password[: ]*$/i,
  };

  try {
    await telnet.connect(params);

    await telnet.exec(username);
    await telnet.exec(password);

    const response = await telnet.exec(command);
    await telnet.end();

    return response;
  } catch (err) {
    throw new Error(err.message);
  }

  // const telnet = new Telnet();
  // try {
  //   await telnet.connect({ host, port });
  //   await telnet.send(command);
  //   const response = await telnet.get();
  //   await telnet.end();
  //   return response;
  // } catch (err) {
  //   throw new Error(err.message);
  // }
}
