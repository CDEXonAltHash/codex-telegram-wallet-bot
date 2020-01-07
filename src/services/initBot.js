const TelegramBot = require('node-telegram-bot-api');

const {
    TELEGRAM_TOKEN
} = require('../config/Config');


const codexBot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
 
module.exports = {
    codexBot
}