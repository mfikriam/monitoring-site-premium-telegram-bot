import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

// IMPORT UTILS
import sshErrorMsg from './utils/generate-ssh-error-msg.js';

// IMPORT HANDLERS
import monitoringPremiumHandler from './handlers/monitoring-premium-handler.js';
import monitoringKPUHandler from './handlers/monitoring-kpu-handler.js';
import sendBotMessage from './handlers/send-bot-msg-handler.js';

// CREATE BOT INSTANCE
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// INITIALIZE BOT MESSAGE
let botMsg = '';

async function run() {
  try {
    // GET SCRIPT ARGUMENTS
    const argv = yargs(hideBin(process.argv)).argv;
    const args = { ...argv }; // Convert `argv` to a plain object
    console.log(`Site: ${args.site || 'default'}, Server: ${args.server || 'default'}\n`);

    // DEFINE DEFAULT CONFIG
    const defaultConfig = {
      gpon: {
        nms: {
          host: process.env.GPON_NMS_HOST,
          username: process.env.GPON_NMS_USERNAME,
          password: process.env.GPON_NMS_PASSWORD,
          port: Number(process.env.GPON_NMS_PORT),
        },
        ne: { username: process.env.GPON_NE_USERNAME, password: process.env.GPON_NE_PASSWORD },
      },
      metro: {
        nms: {
          host: process.env.METRO_NMS_HOST,
          username: process.env.METRO_NMS_USERNAME,
          password: process.env.METRO_NMS_PASSWORD,
          port: Number(process.env.METRO_NMS_PORT),
        },
        ne: { username: process.env.METRO_NE_USERNAME, password: process.env.METRO_NE_PASSWORD },
      },
    };

    // DEFINE SERVER LOCATION
    switch (args.server) {
      case 'sentul':
        defaultConfig.gpon.nms.host = process.env.GPON_NMS_HOST_SENTUL || '10.60.190.16';
        defaultConfig.metro.nms.host = process.env.METRO_NMS_HOST_SENTUL || '10.62.165.21';
        break;
      case 'jatinegara':
        defaultConfig.gpon.nms.host = process.env.GPON_NMS_HOST_JATINEGARA || '10.60.190.15';
        defaultConfig.metro.nms.host = process.env.METRO_NMS_HOST_JATINEGARA || '10.62.170.56';
        break;
    }

    // GET MONITORING RESULT
    switch (args.site) {
      case 'premium':
        botMsg = await monitoringPremiumHandler(botMsg, defaultConfig);
        break;
      case 'kpu':
        botMsg = await monitoringKPUHandler(botMsg, defaultConfig);
        break;
      case 'iwip':
        // botMsg = await monitoringIWIPHandler(botMsg, defaultConfig);
        break;
    }
  } catch (err) {
    botMsg = sshErrorMsg(botMsg);
    console.log('Error Executing SSH Command');
    console.log(err);
  } finally {
    // SEND BOT MESSAGE
    const chatIds = JSON.parse(process.env.CHAT_IDS);
    if (chatIds && botMsg) await sendBotMessage(bot, chatIds, botMsg);

    // KILL ALL NODEJS PROCESS
    console.log('\nExiting NodeJS Process');
    process.exit(0);
  }
}

run();
