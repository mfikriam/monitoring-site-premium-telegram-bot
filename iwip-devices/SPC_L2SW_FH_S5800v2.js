import { Client as SSHClient } from 'ssh2';

function resultParser(resObj) {
  // Initialize statusLink to UP
  resObj.statusLink = '✅';

  for (const intf of resObj.interfaces) {
    // Get result string
    const resultString = intf.resultString;

    // Check keyword
    const isUp =
      (resultString.includes('admin state : up') && resultString.includes('current state : up')) ||
      resultString.includes('Admin state is up,operation state is up');

    // Update interface status
    if (resultString && isUp) {
      intf.portStatus = 'Up';
    } else {
      resObj.statusLink = '❌';
      intf.portStatus = 'LOS';
    }

    // // Test LOS interface
    // if (intf.portName === 'xgigaethernet 1/0/41') {
    //   resObj.statusLink = '❌';
    //   intf.portStatus = 'LOS';
    // }

    // Print status port
    console.log(
      `    - Status Interface ${intf.portName}: ${intf.portStatus} ${intf.portStatus === 'Up' ? '✅' : '❌'}`,
    );
  }

  // Print status link
  console.log(`    - Status Link: ${resObj.statusLink}`);
}

function bandwidthParser(resObj) {
  // Extract Max BW & Current BW
  const portBWMatch = resObj.bwString.match(/Cur-BW:\(M\):\s*(\d+)/);
  const maxBWMatch = resObj.bwString.match(/Max-BW:\(M\):\s*(\d+)/);
  resObj.currentBW = portBWMatch ? parseInt(portBWMatch[1], 10) / 1000 : 0; // Gbps
  resObj.maxBW = maxBWMatch ? parseInt(maxBWMatch[1], 10) / 1000 : 0; // Gbps

  // Extract Port List
  const portListMatch = resObj.bwString.match(/Port-List:([a-z0-9]+)\s+([\d\/,]+)/i);
  let portList = [];
  if (portListMatch) {
    const typeMap = {
      xge: 'xgigaethernet',
      '100ge': '100gigaethernet',
      '40ge': '40gigaethernet',
    };
    const portType = typeMap[portListMatch[1].toLowerCase()] || portListMatch[1].toLowerCase();
    const portNumbers = portListMatch[2].split(',').map((p) => p.trim());
    portList = portNumbers.map((p) => `${portType} ${p}`);
  }
  resObj.interfaces = portList.map((intf) => ({ portName: intf, portStatus: '#', resultString: '#' }));
}

async function L2SW({ nmsConfig, neConfig, datek, resObj, timeout = 60000 }) {
  return new Promise((resolve, reject) => {
    // CREATE SSH CONN INSTANCE
    const conn = new SSHClient();

    // INITIALIZE TIMEOUT HANDLE
    let timeoutHandle;

    // ON READY
    conn.on('ready', () => {
      // PRINT CONNECTION TITLE
      const connTitle = `ssh ${nmsConfig.username}@${nmsConfig.host} ${nmsConfig.password}`;
      console.log(`    - SSH Connection Established: ${connTitle}`);

      // TYPE & STREAM ON TERMINAL AFTER SSH
      conn.shell((err, stream) => {
        // ERROR HANDLING
        if (err) {
          console.log('    - Error Starting Shell');
          return resolve();
        }

        // INITIALIZED VARIABLES
        let result = '';
        let linkResult = '';
        let loggedin = false;
        let firstCommand = false;
        let commandExec = false;
        let finished = false;
        let streamClosed = false;
        let currentCommand = '';
        let indexLink = 0;
        let indexPagination = 0;

        // Set a timeout to limit streaming time
        timeoutHandle = setTimeout(() => {
          console.log('    - Streaming Timeout Exceeded');
          resObj.statusLink = '🟨'; // Mark status as timeout
          stream.end(); // End the stream if timeout is reached
          console.log('    - SSH Stream Closed');
          conn.end(); // Close the SSH connection
        }, timeout);

        // STREAM CLOSE HANDLER
        stream.on('close', () => {
          clearTimeout(timeoutHandle); // Clear the timeout if stream closes before time limit
          resultParser(resObj); // Parse the result when the stream closes
          resolve();
        });

        // STREAM DATA HANDLER
        stream.on('data', (data) => {
          // CONVERT STREAM DATA TO STRING
          const dataStr = data.toString();
          // console.log(dataStr);

          // STORE THE STREAM DATA
          result += dataStr;
          if (commandExec || firstCommand) linkResult += dataStr;

          // Ensure RNO NMS SSH To NE is ready
          if (!loggedin && dataStr.includes('rno7app:~$')) {
            currentCommand = `telnet ${datek.ip_ne}`;
            console.log(`    - Executing Command On RNO Server: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

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
          if (dataStr.includes('%No such user or bad password.')) {
            console.log(`    - NE Auth Failed`);
            conn.end();
          }

          // First Command
          if (dataStr.includes(`${datek.hostname_ne}#`) && !firstCommand) {
            firstCommand = true;
            currentCommand = `show interface ${datek.group_interface} verbose`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
          }

          // Parsing Bandwith
          if (dataStr.includes(`Port-List:`) && dataStr.includes(`${datek.hostname_ne}#`) && firstCommand) {
            resObj.bwString = linkResult;
            linkResult = '';
            bandwidthParser(resObj);
            console.log(`    - Parsing Max & Current Bandwith`);
          }

          // Start Check Port Status
          if (
            resObj.bwString &&
            firstCommand &&
            resObj.interfaces.length !== 0 &&
            dataStr.includes(`${datek.hostname_ne}#`) &&
            !commandExec &&
            indexLink < resObj.interfaces.length
          ) {
            currentCommand = `show interface ${resObj.interfaces[indexLink].portName}`;
            console.log(`    - Executing Command: ${currentCommand}`);
            stream.write(`${currentCommand}\n`);
            commandExec = true;
          }

          // Handle Paginations
          if (dataStr.includes('--More--') && commandExec) {
            result += '\n';

            if (indexPagination === 0) {
              resObj.interfaces[indexLink].resultString = linkResult;
              console.log(`    - Save Result String for ${resObj.interfaces[indexLink].portName}`);
            } else {
              linkResult = '';
            }

            indexPagination++;
            console.log('    - Pagination Detected: Sending Space');
            stream.write(' ');
          }

          // Move To Next Interface
          if (dataStr.includes(`Other statistic:`) && dataStr.includes(`${datek.hostname_ne}#`) && commandExec) {
            console.log('    - Move to next interface');
            linkResult = '';
            indexPagination = 0;
            indexLink++;

            if (indexLink < resObj.interfaces.length) {
              currentCommand = `show interface ${resObj.interfaces[indexLink].portName}`;
              stream.write(`${currentCommand}\n`);
              console.log(`    - Executing Command: ${currentCommand}`);
            }
          }

          // HANDLE FINISHING
          if (
            resObj.bwString &&
            firstCommand &&
            dataStr.includes(`${datek.hostname_ne}#`) &&
            !finished &&
            indexLink === resObj.interfaces.length
          ) {
            finished = true;
          }

          // HANDLE CLOSING SSH CONNECTION
          if (resObj.bwString && finished && !streamClosed) {
            streamClosed = true;
            console.log('    - Closing SSH Connection');
            conn.end();
          }
        });

        // TELNET TO NE VIA IP ADDRESS
        console.log(`    - Executing Command: telnet ${datek.ip_ne}`);
        stream.write(`telnet ${datek.ip_ne}\n`);
      });
    });

    // ON ERROR
    conn.on('error', (err) => {
      clearTimeout(timeoutHandle); // Clear the timeout on error
      console.log('    - SSH Connection Error (SSH Failed)');
      console.log(err);
      resolve();
    });

    // ON CONNECT
    conn.connect(nmsConfig);
  });
}

export default L2SW;
