"use strict";
require('babel-polyfill');
const TelegramBot = require('node-telegram-bot-api');
const {
    generateAccount,
    saveAccount,
    getAddress,
    getPrivKey,
    restoreFromWIF,
    changeFromWIF,
    getCustomWallet
} = require('./src/services/address'); 
const { 
    sendToken,
    getBalance,
    tradingToken,
    checkCDEX
} = require('./src/services/tokens');

const {
    parseCommandTrading,
    isValidOffer,
    isValidAirDrop
} = require('./src/utils/parser');

const {
    TELEGRAM_TOKEN,
    AIRDROP_ID,
    AIRDROP_ADDRESS
} = require('./src/config/config');

const hrc20 = require('./src/libs/hrc20');
const { loadAccountFromFile } = require('./src/services/storage');

const token = TELEGRAM_TOKEN; 
const bot = new TelegramBot(token, { polling: true });

const keyboard_helpers = ["🔑Public address", "💰Get balance", "🗝Get private key", "🍏Help", "🎁Airdrop"];

/**
 * Load address of bot to airdrop function
 */
loadAccountFromFile();

/**
 * Start bot
 */

bot.onText(/\/start/, async(msg) => {
    /**
     * Check exist adress or not
     */
    const address = getAddress(msg.from.id);
    if(address !== '') {
        await bot.sendMessage(msg.from.id, "Hey friend, use the keyboard to navigate the menu", {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4]]
                ]
            }
        });
    }
    else {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "Yes", callback_data: "1" }],
                    [{ text: "No", callback_data: "2" }],
                ],
            }
        };
        await bot.sendMessage(msg.from.id, "Do you want to create a new address on AltHash blockchain?", opts);
    }

});

/**
 * Change new address on wallet from WIF
 */
bot.onText(/\/change (.+)/, async (msg, match) => {
    const result =  changeFromWIF(msg.from.id, match[1]);
    if (result === true) {
        await bot.sendMessage(msg.from.id, 'The change adddress is sucessful');
    }
    else {
        await bot.sendMessage(msg.from.id, 'The private key is invalid or you not have addess on wale');
    }
});

/**
 * Restore an address on wallet from WIF
 */
bot.onText(/\/restore (.+)/, async (msg, match) => {
    const result = restoreFromWIF(msg.from.id, match[1]);
    if (result === true) {
        await bot.sendMessage(msg.from.id, "Welcome to Codex Wallet, use the keyboard to navigate the menu ", {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4]]
                ]
            }
        });
    }
    else {
        await bot.sendMessage(msg.from.id, 'The private key is invalid or your address exist');
    }
});

/**
 * Statistics CDEX token
 */

bot.onText(/\/stats/,  async (msg) => {
    const supply =  hrc20.getTokenBySymbol('CDEX');
    await bot.sendMessage(msg.from.id, 'Total Supply of CDEX: ' + `${supply.total_supply}`);
});

/**
 * Bot send token
 */
const botSendToken = async (msgId, ownerTelegramId, toAddress, amount, token) => {
    const result = await sendToken(ownerTelegramId, amount, toAddress, token);
    if (result.error === '') {
        await bot.sendMessage(msgId, '✅Send tokens are successful with transaction Id: ' + `${result.trxId}`);
    }
    else {
        await bot.sendMessage(msgId, '❌Cannot execute the transaction: Please check again *(token symbol, received address, HTML coin, etc)*',{parse_mode:"Markdown"});
    }
}

/**
 * Send token
 */
bot.onText(/\/send (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    await botSendToken(msg.from.id, msg.from.id, params[0], params[1], params[2]);
});

/**
 * Tip some token for some one 
 */
bot.onText(/\/tip (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    /**
     * Check account exist or not
     */
    let address = getAddress(msg.reply_to_message.from.id);
    if(address === '') {
        const account = generateAccount();
        address = account.address;
        saveAccount(msg.reply_to_message.from.id, account.wallet);
    }
    /**
     * After that send some tokens
     */
    await botSendToken(msg.from.id, msg.from.id, address, params[0], params[1]);

});

/**
 * Command for get balance
 */
bot.onText(/\/balance/, async (msg) => {
    const info = await getBalance(msg.from.id);
    if (info === '') {
        await bot.sendMessage(msg.chat.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")" + "-> Please go to HRC2O Codex Wallet create address on AltHash blockchain first", { parse_mode: "Markdown" });
    }
    else {
        const balance = info.balance;
        const unconfirmedBalance = info.unconfirmedBalance;
        let token;
        let getAllHrc20 = '';
        const hrc20 = info.hrc20;
        for (token of hrc20) {
            getAllHrc20 += `${token.contract.name}` + ': ' + `${token.amount / Math.pow(10, token.contract.decimals)}` + ' ' + `${token.contract.symbol}` + '\n';
        }
        getAllHrc20 += "HTML: " + `${balance}` + "\nHTML unconfirmed: " + `${unconfirmedBalance}`
        await bot.sendMessage(msg.chat.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + "), your current balance is: \n" +  getAllHrc20, {parse_mode: "Markdown"});
    }
});

/**
 * Trading function
 */
let commandTrade = '';
bot.onText(/\/trade (.+)/,  async (msg, match) => {
    if (isValidOffer(msg.reply_to_message.date)) {
        const adsAccount = getCustomWallet(msg.reply_to_message.from.id);
        const traderAccount = getCustomWallet(msg.from.id);

        if (adsAccount === '') {
            await bot.sendMessage(msg.chat.id, "⚠️ " + "[" + msg.reply_to_message.from.username + "](tg://user?id=" + msg.reply_to_message.from.id + ")" + "-> Please go to HRC2O Codex Wallet create address on AltHash blockchain first", {parse_mode: "Markdown"});
        }
        else if (traderAccount === '') {
            await bot.sendMessage(msg.chat.id, "⚠️ " + "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")" + "-> Please go to HRC2O Codex Wallet create address on AltHash blockchain first", {parse_mode: "Markdown"});
        }
        else {
            const tradingArray = parseCommandTrading(msg.reply_to_message.text);
            commandTrade = tradingArray[match[1] - 1];
            commandTrade.adsId = msg.reply_to_message.from.id;
            commandTrade.traderId = msg.from.id;
            commandTrade.adsUsername = msg.reply_to_message.from.username;
            commandTrade.traderUsername = msg.from.username;
            const opts = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Accept", callback_data: "6" }, { text: "Cancel", callback_data: "7" }],
                    ]
                },
                parse_mode: "Markdown"
            };
            await bot.sendMessage(msg.chat.id, "⏰ Please confirm trade request ⏰ \n" +
                "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")"+ ' sending: ' + commandTrade.exchangeAmount + ' ' + commandTrade.exchangeToken + '\n' +
                "[" + msg.reply_to_message.from.username + "](tg://user?id=" + msg.reply_to_message.from.id + ")" + ' sending: ' + commandTrade.ownAmount 
                + ' ' + commandTrade.ownToken + '\n', opts);
        }
    }
    else {
        await bot.sendMessage(msg.chat.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")"+ " ⚠️Can't trade an offer that is older than 12 hours", {parse_mode:"Markdown"});
    }
});

/**
 *  Get public address
 */
bot.on('message', async (msg) => {
    if (msg.text.indexOf(keyboard_helpers[0]) === 0) {
        const address = getAddress(msg.from.id);
        if (address !== '') {
           await bot.sendMessage(msg.from.id, "Your public address: " + `${address}`);
        }
        else {
            await bot.sendMessage(msg.from.id, 
                "If you have no account, please click *Help* button to create a new account", { parse_mode: "Markdown" });
        }
    }
});
/**
 * Get balance
 */
bot.on('message', async (msg) => {
    if (msg.text.indexOf(keyboard_helpers[1]) === 0) {
        const info = await getBalance(msg.from.id);
        if(info === '')
        {
            await bot.sendMessage(msg.chat.id, "If you have no account, please click *Help* button to create a new account", {parse_mode: "Markdown"});
        }
        else{
            const balance = info.balance;
            const unconfirmedBalance = info.unconfirmedBalance;
            let token;
            let getAllHrc20= '';
            const hrc20 = info.hrc20;
            for (token of hrc20) {
                getAllHrc20 +=`${token.contract.name}` + ': ' + `${token.amount / Math.pow(10, token.contract.decimals)}` + ' ' + `${token.contract.symbol}` +'\n';
            }
            getAllHrc20 += "HTML: " + `${balance}` + "\nHTML unconfirmed: " + `${unconfirmedBalance}`
            await bot.sendMessage(msg.chat.id, getAllHrc20);
        }
    }
});

/**
 * Get Private key
 */
bot.on('message', async(msg) => {
    if (msg.text.indexOf(keyboard_helpers[2]) === 0) {
        const privKey = getPrivKey(msg.from.id);
        if (privKey !== '') {
            await bot.sendMessage(msg.from.id, "Your private key: " + `${privKey}`);
        }
        else{
            await bot.sendMessage(msg.from.id, 
                                         "If you have no account, please click *Help* button to create a new account", {parse_mode: "Markdown"});
        }
    }
});

/**
 * Show help
 */
bot.on('message', async (msg) => {
    if (msg.text.indexOf(keyboard_helpers[3]) === 0) {
        const opts = {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "❔Get started", callback_data: "5" }, { text: "🔐Create new address", callback_data: "3" }],
                    [{ text: "🏵VIP member 🏵", callback_data: "4" }, { text: "⏪Back", callback_data: "10" }],
                ]
            },
            parse_mode: "Markdown"
        };
        
        await bot.sendMessage(msg.from.id, "Please chose action", opts);
    }
});

/**
 * Airdrop
 */
bot.on('message', async (msg) => {
    if (msg.text.indexOf(keyboard_helpers[4]) === 0) {
        const vipWallet = getCustomWallet(msg.from.id);
        if(!vipWallet.isVip){
            return await bot.sendMessage(msg.from.id, "Sorry, the function only for VIP member");
        }
        if (isValidAirDrop(msg.date, vipWallet.getAirDropTime())) {
            vipWallet.setAirDropTime();
            const result = await sendToken(AIRDROP_ID, 10, vipWallet.getAddress(), "CDEX");
            if (result.error === '') {
                await bot.sendMessage(msg.from.id, '🎉🎉🎉Recieve Airdrop Once Daily');
                vipWallet.setAirDropTime();
            }
            else {
                await bot.sendMessage(msg.from.id,'⁉️'+ `${result.error}`);
            }
        }
        else {
            await bot.sendMessage(msg.from.id, "⚠️Airdrop only once time per day");
        }
    }
});


/**
 * Handle polling question
 */
bot.on("callback_query", async  (msg) => {
    const choice = msg.data;
    if ((choice === '6'|| choice === '7') && (msg.from.id !== commandTrade.traderId)) {
        return await bot.answerCallbackQuery(msg.id,'This message does not apply to you');
    }
    await bot.deleteMessage(msg.message.chat.id, msg.message.message_id);
    let message = '';
    if (choice === "1" || choice === "3") {
        const address = getAddress(msg.from.id);
        if (address !== '') {
            message = "Your address is existed";
        }
        else {
            const account = generateAccount();
            await saveAccount(msg.from.id, account.wallet);
            message = "Welcome to Codex Wallet, use the keyboard to navigate the menu";
        }
        await bot.sendMessage(msg.message.chat.id, message, {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4]]
                ]
            }
        });
    }
    else if(choice === "2") {
        await bot.sendMessage(msg.from.id, "Please click to *Help* button when you want to more information", {
            "reply_markup": {
                "keyboard": [[keyboard_helpers[3]]]
            },
            "parse_mode": "Markdown"
        });
    }
    else if (choice === "4") {
        const codex = checkCDEX(msg.from.id);
        if(codex) {
            const opts = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Yes", callback_data: "8" }, { text: "No", callback_data: "9" }]]
                },
                parse_mode: "Markdown"
            };

            await bot.sendMessage(msg.from.id, "That it costs 50k CDEX for VIP. Do you want to become a CDEX member?", opts);
        }
        else {
            await bot.sendMessage(msg.from.id, '⚠️You must have CDEX token greater than 50k');
        }
    }
    else if (choice === "5") {
        await bot.sendMessage(msg.message.chat.id,
            "<b>Introduction: </b> \n" +
            "    Codex wallet bot will help you can execute some basic actions in wallet.\n\n<b>Getting started:</b>\n" +
            "    • If you have an address  -> Please use /restore &lt;private key &gt command to restore your address on wallet\n"+ 
            "    • If you want to change your address -> Please use /change &lt;private key&gt command to change your address\n" +
            "    • If you haven't address, Codex wallet automatically generates a address for you, to which you can send CDEX or other tokens.\n" +
            "        1. Create new adddress by pressing 🍏<i>Help</i> button then seclect 🔐<i>Create new address</i>.\n" +
            "        2. Check the balance of your account by pressing the 💰<i>Get balance</i> button.\n" +
            "        3. Get your address to give for someone who want to send token for you by pressing the 🔑<i> Public address</i> button\n"+
            "        4. To withdraw your funds, press the 🗝<i>Get private key</i> button to see your private key.\n" +
            "        <b>Note:</b> The private key can be used to login to AltHash wallet (https://althash.org/) or HTML coin wallet and to send tokens" +
            " or CDEX to any account you wish. <b>Don't show it for anyone</b>\n\n<b>How to send to an address:</b>\nDirectly sending to an address can be done" +
            " with the /send command, for example:\n    1. Sending CDEX:\n    /send <i>&lt;address&gt</i> <i>&lt;amount&gt</i>\n" +
            "            /send Hd1yhCGhmaGwgcSPHHpFNwgYAuuyZwAHyY 10\n    2. Sending a token\n" +
            "    /send <i>&lt;address&gt</i> <i>&lt;amount&gt</i> <i>&lt;token&gt</i>\n" +
            "            /send Hd1yhCGhmaGwgcSPHHpFNwgYAuuyZwAHyY 10 CDEX\n" +
            "    • If you want to tip some token for who you reply to. Please use command: /tip &lt;amount&gt &lt;token&gt",
            { parse_mode: "HTML" });    
    }
    else if (choice === "6") {
        const adsAccount = await getBalance(commandTrade.adsId);
        const traderAccount = await getBalance(commandTrade.traderId);
        const checkTrade = await tradingToken(traderAccount, adsAccount, commandTrade);
        let deleteMsg = '';
        if (checkTrade.validTrader === 400 && checkTrade.validAds === 300) {
            let result = undefined;
            if (checkTrade.type === 'autosell') {
                //ads send
                deleteMsg = await bot.sendMessage(msg.message.chat.id, "1️⃣Transfering " + checkTrade.adsAmount + ' ' + checkTrade.adsToken + ' from  ' + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsAmount + ")", {parse_mode: "Markdown"});
                result = await sendToken(commandTrade.adsId, checkTrade.adsAmount, getAddress(commandTrade.traderId), checkTrade.adsToken);
                //trader send
                if (result.error === '') {
                    await bot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                    deleteMsg = await bot.sendMessage(msg.message.chat.id, "2️⃣Transfering " + checkTrade.traderAmount + ' ' + checkTrade.traderToken + ' from  ' + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")", {parse_mode: "Markdown"});
                    result = await sendToken(commandTrade.traderId, checkTrade.traderAmount, getAddress(commandTrade.adsId), checkTrade.traderToken);
                }
            }
            else if (checkTrade.type === 'autobuy') {
                //trader send
                deleteMsg = await bot.sendMessage(msg.message.chat.id, "1️⃣Transfering " + checkTrade.traderAmount + ' ' + checkTrade.traderToken + ' from  ' + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")", {parse_mode: "Markdown"});
                result = await sendToken(commandTrade.traderId, checkTrade.traderAmount, getAddress(commandTrade.adsId), checkTrade.traderToken);
                //ads send
                if (result === '') {
                    await bot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                    deleteMsg = await bot.sendMessage(msg.message.chat.id, "2️⃣Transfering " + checkTrade.adsAmount + ' ' + checkTrade.adsToken + ' from  ' + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")", {parse_mode: "Markdown"});
                    result = await sendToken(commandTrade.adsId, checkTrade.adsAmount, getAddress(commandTrade.traderId), checkTrade.adsToken);
                }
            }
            if (result.error !== '') {
                await bot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                await bot.sendMessage(msg.message.chat.id, "❌Transaction on trade: \n" + " between "
                    + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")" + ' and ' + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ' has an error: \n'
                    + result.error, {parse_mode: "Markdown"});
            }
            if (result.error === '') {
                await bot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                await bot.sendMessage(msg.message.chat.id, "✅Trade of  " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + " completed! \n"
                    + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")" + " (" + checkTrade.adsAmount + ' ' + checkTrade.adsToken + ') <-> '
                    + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + " (" + checkTrade.traderAmount + ' ' + checkTrade.traderToken + ')',
                    {parse_mode: "Markdown"});

            }

        }
        else if (checkTrade.validAds === 301) {
            await bot.sendMessage(msg.message.chat.id, "❌" + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId +")" + ': Insufficient HTML tokens!', {parse_mode: "Markdown"});
        }
        else if (checkTrade.validAds === 302) {
            await bot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")"+ ': Insufficient ' + commandTrade.ownToken + ' tokens!', { parse_mode: "Markdown" });
        }
        else if (checkTrade.validTrader === 401) {
            await bot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ': Insufficient HTML tokens!', { parse_mode: "Markdown" });
        }
        else if (checkTrade.validTrader === 402) {
            await bot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ': Insufficient ' + commandTrade.exchangeToken + ' tokens!', { parse_mode: "Markdown" });
        }
    }
    else if(choice === "7") {
        await bot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ' canceled trade!', { parse_mode: "Markdown"});
    }

    else if(choice === "8") {
        const vipWallet = getCustomWallet(msg.from.id);
        const result = await sendToken(msg.from.id, 500000, AIRDROP_ADDRESS, "CDEX");
        if (result.error === '') {
            await bot.sendMessage(msg.message.chat.id, '🎉🎉🎉Congratulations! You become a VIP member!');
            vipWallet.setVIPMember();
        }
        else {
            await bot.sendMessage(msg.message.chat.id, 'Oops⁉️Something error');
        }
    }
});