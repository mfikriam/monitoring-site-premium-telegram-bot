import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

// IMPORT UTILS
import config from './utils/config.js';
import currentDateTime from './utils/get-current-datetime.js';
import sshErrorMsg from './utils/generate-ssh-error-msg.js';

// IMPORT HANDLERS
import monitoringKPUHandler from './handlers/monitoring-kpu-handler.js';
import sendBotMessage from './handlers/send-bot-msg-handler.js';

// CREATE BOT INSTANCE
const bot = new TelegramBot(config.bot.token, { polling: true });

// INITIALIZE BOT MESSAGE
let botMsg = ``;

async function run() {
  try {
    // GENERATE INITIAL MESSAGE
    botMsg += `<b>REPORT MONITORING SITE KPU MSO TIF-4</b>\n`;
    botMsg += `${currentDateTime()}\n`;
    botMsg += `\n`;

    // GET STATUS SITE
    botMsg = await monitoringKPUHandler(botMsg);
  } catch (err) {
    botMsg += sshErrorMsg(botMsg);
    console.log('Error Executing SSH Command');
    console.log(err);
  } finally {
    // SEND BOT MESSAGE
    const chatIds = config.bot.chatIds;
    await sendBotMessage(bot, chatIds, botMsg);

    // KILL ALL NODEJS PROCESS
    console.log('\nExiting NodeJS Process');
    process.exit(0);
  }
}

run();
