import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

// IMPORT UTILS
import sshErrorMsg from './utils/generate-ssh-error-msg.js';

// IMPORT HANDLERS
import monitoringKPUHandler from './handlers/monitoring-kpu-handler.js';
import sendBotMessage from './handlers/send-bot-msg-handler.js';

// CREATE BOT INSTANCE
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

// INITIALIZE BOT MESSAGE
let botMsg = ``;

async function run() {
  try {
    // GET STATUS SITE
    botMsg = await monitoringKPUHandler(botMsg);
  } catch (err) {
    botMsg += sshErrorMsg(botMsg);
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
