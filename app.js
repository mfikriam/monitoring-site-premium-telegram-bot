import TelegramBot from 'node-telegram-bot-api';
import 'dotenv/config';

import config from './utils/config.js';
import initialMsg from './utils/generate-initial-msg.js';
import sshErrorMsg from './utils/generate-ssh-error-msg.js';
import generateSummaryMsg from './utils/generate-summary-msg.js';

import monitoringSitesHandler from './handlers/monitoring-sites-handler.js';
import sendBotMessage from './handlers/send-bot-msg-handler.js';

const bot = new TelegramBot(config.bot.token, { polling: true });
let botMsg;
const countStatusLink = {
  up2Link: 0,
  up1Link: 0,
  down2Link: 0,
  others: 0,
};

async function run() {
  try {
    // GENERATE INITIAL MESSAGE
    botMsg = initialMsg();
    // GET LINKS STATUS
    botMsg = await monitoringSitesHandler(botMsg, countStatusLink);
  } catch (err) {
    botMsg = sshErrorMsg(botMsg);
    console.log('Error Executing SSH Command');
    console.log(err);
  } finally {
    // GENERATE SUMMARY
    botMsg = generateSummaryMsg(botMsg, countStatusLink);
    // SEND BOT MESSAGE
    const chatIds = config.bot.chatIds;
    await sendBotMessage(bot, chatIds, botMsg);
    // KILL ALL NODEJS PROCESS
    console.log('\nExiting NodeJS Process');
    process.exit(0);
  }
}

run();
