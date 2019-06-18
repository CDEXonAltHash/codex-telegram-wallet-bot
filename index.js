'use strict';
require('babel-polyfill');
const TelegramBot = require('node-telegram-bot-api');
const {
    generateAccount,
    saveAccount,
    getAddress,
    getPrivKey,
    restoreFromWIF,
    changeFromWIF,
    getCustomWallet,
    saveVipMember,
    getVip
} = require('./src/services/AddressService'); 

const { 
    sendToken,
    getBalance,
    tradingToken,
    checkCDEX,
} = require('./src/services/TokenService');

const {
    parseCommandTrading,
    isValidOffer,
    isValidAirDrop,
    convertTime,
    TIME_AIRDROP
} = require('./src/utils/StringParser');

const {
    TELEGRAM_TOKEN,
    AIRDROP_ID,
    AIRDROP_ADDRESS
} = require('./src/config/Config');

const hrc20 = require('./src/libs/hrc20');

const { 
    loadAccountFromFile,
    loadVip,
    CodexWallet
} = require('./src/services/StorageService');

const {
    svgTemplate,
    buildSvgFile,
    convertSvg2Png,
} = require('./src/utils/SvgImageFile');

const {
    viewTransaction,
} = require('./src/services/ViewTransaction');

const token = TELEGRAM_TOKEN; 
const bot = new TelegramBot(token, { polling: true });
const AMOUNT_AIRDROP = 75;
const keyboard_helpers = ["📬Public address", "💰Get balance", "🔑Get private key", "🔍Help", "🎁Airdrops", "👀View transaction"];

/**
 * Load address of bot to airdrop function
 */
loadVip();
loadAccountFromFile();

/**
 * Start bot
 */

bot.onText(/\/start/, async(msg) => {
    const welcomeMessage =
    'Welcome to HRC20 Codex Bot, use command below to access wallet\n'+
    '1.	Access to wallet(have an address) -> /restore <private key>\n'+
    '2.	No wallet -> /mywallet (We made one for you)';
    await bot.sendMessage(msg.chat.id, welcomeMessage);
});

/**
 * Made new address
 */
bot.onText(/\/mywallet/, async (msg) => {
    const account = generateAccount();
    if (account.privKey !== undefined)
    {
        await bot.sendMessage(msg.from.id, 'Create new wallet is successful\n' +
        '<b>Your public address is:</b> ' + `${account.address}` +
        '\n<b>Your private key is :</b> ' + `${account.privKey}` +
        '\n<i>(Please save private key to a safe place)</i>',
        {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4], keyboard_helpers[5]],
                ]
            },
            parse_mode:"HTML"
        });
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
        await bot.sendMessage(msg.from.id, 'The private key is invalid or you do not have account on wallet');
    }
});

/**
 * Restore an address on wallet from WIF
 */
bot.onText(/\/restore (.+)/, async (msg, match) => {
    const result = restoreFromWIF(msg.from.id, match[1]);
    const transaction = await viewTransaction(msg.from.id);

    if (result === true) {
        await bot.sendMessage(msg.from.id, "Restore address is successful", {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4], keyboard_helpers[5]],
                ]
            }
        });
    }
    else {
        await bot.sendMessage(msg.from.id, '❌The private key is invalid or your address already existed');
    }
});

/**
 * Statistics CDEX token
 */

bot.onText(/\/stats/,  async (msg) => {
    const supply =  hrc20.getTokenBySymbol('CDEX');
    await bot.sendMessage(msg.chat.id, 'Total Supply of CDEX:', supply.total_supply);
});

/**
 * Bot send token
 */
const botSendToken = async (msgId, msgContent,  ownerTelegramId, toAddress, amount, token) => {
    const result = await sendToken(ownerTelegramId, amount, toAddress, token);
    const url = "https://explorer.htmlcoin.com/tx/" + `${result.trxId}`;
    if (result.error === '') {
        await bot.sendMessage(msgId, '✅ ' + `${msgContent}` + ' successful\n' + '<a href=\"' + `${url}` + '">Please check transaction here</a>', { parse_mode: "HTML" });
    }
    else {
        await bot.sendMessage(msgId, '❌' + `${result.error}`,{parse_mode:"Markdown"});
    }
}

/**
 * Send token
 */
bot.onText(/\/send (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    await botSendToken(msg.from.id,'Send tokens is ', msg.from.id, params[0], params[1], params[2]);
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
        return await bot.sendMessage(msg.chat.id, "❌Tip cannot be completed recipient has not set up wallet", { parse_mode: "Markdown" });
    }
    /**
     * After that send some tokens
     */
    await botSendToken(msg.chat.id,'Tip tokens is ', msg.from.id, address, params[0], params[1]);

});

const botGetBlance =  (info) =>{
    const balance = info.balance;
    const unconfirmedBalance = info.unconfirmedBalance;
    let yCoordinate = 506;
    const hrc20 = info.hrc20;
    let svgFile = svgTemplate(800, 120 + hrc20.length*40);

    for(const token of hrc20) {
        const tokenValue = (token.amount / Math.pow(10, token.contract.decimals)).toString().split('.');
        if(tokenValue[1] === undefined) tokenValue[1] = 0;
        if (tokenValue[0] === undefined) tokenValue[0] = 0;
        svgFile += buildSvgFile(yCoordinate, token.contract.name, tokenValue[0], '.' + tokenValue[1] , token.contract.symbol );
        yCoordinate += 40;
    }
    const htmlbalance = balance.toString().split('.');
    if (htmlbalance[1] === undefined) htmlbalance[1] = 0;
    if (htmlbalance[0] === undefined) htmlbalance[0] = 0;
    const htmlbalanceunconfrim = unconfirmedBalance.toString().split('.');
    if (htmlbalanceunconfrim[1] === undefined) htmlbalanceunconfrim[1] = 0;
    if (htmlbalanceunconfrim[0] === undefined) htmlbalanceunconfrim[0] = 0;
    svgFile += buildSvgFile(yCoordinate, 'HTML', htmlbalance[0], '.' + htmlbalance[1], 'HTML');
    yCoordinate += 40;
    svgFile += buildSvgFile(yCoordinate, 'HTML unconfirmed', htmlbalanceunconfrim[0], '.' +htmlbalanceunconfrim[1], 'HTML');
    svgFile += '</g></svg>';
    return svgFile;
}
/**
 * Command for get balance
 */
bot.onText(/\/balance/, async (msg) => {
    const info = await getBalance(msg.from.id);
    if (info === '') {
        return await bot.sendMessage(msg.from.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")" + "-> Please go to @CodexWalletBot for more information", { parse_mode: "Markdown" });
    }
    const svgFile =  botGetBlance(info);
    const imgBalance =  await convertSvg2Png(svgFile);

    await bot.sendMessage(msg.from.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + "), your current balance is:", { parse_mode: "Markdown" });
    await bot.sendPhoto(msg.from.id, imgBalance);
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
            await bot.sendMessage(msg.chat.id, "⚠️ " + "[" + msg.reply_to_message.from.username + "](tg://user?id=" + msg.reply_to_message.from.id + ")" + "-> Please go to @CodexWalletBot create/restore address on AltHash blockchain first", {parse_mode: "Markdown"});
        }
        else if (traderAccount === '') {
            await bot.sendMessage(msg.chat.id, "⚠️ " + "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")" + "-> Please go to @CodexWalletBot create/restore address on AltHash blockchain first", {parse_mode: "Markdown"});
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
           await bot.sendMessage(msg.from.id, "Your public address is: " + `${address}`);
        }
        else {
            await bot.sendMessage(msg.from.id, 
                "Your address does not exist, please click *Help* button for more information", { parse_mode: "Markdown" });
        }
    }
});
/**
 * Get balance
 */
bot.on('message', async (msg) => {
    if (msg.text.indexOf(keyboard_helpers[1]) === 0) {
        const info = await getBalance(msg.from.id);
        if (info === '') {
            return await bot.sendMessage(msg.chat.id, "Your address does not exist, please click *Help* button for more information", { parse_mode: "Markdown" });
        }
        const svgFile = botGetBlance(info);
        const imgBalance = await convertSvg2Png(svgFile);
        await bot.sendMessage(msg.from.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + "), your current balance is:", { parse_mode: "Markdown" });

        await bot.sendPhoto(msg.from.id, imgBalance);
    }
});

/**
 * Get Private key
 */
bot.on('message', async(msg) => {
    if (msg.text.indexOf(keyboard_helpers[2]) === 0) {
        const privKey = getPrivKey(msg.from.id);
        if (privKey !== '') {
            await bot.sendMessage(msg.from.id, "Your private key is: " + `${privKey}`);
        }
        else{
            await bot.sendMessage(msg.from.id, 
                                         "Your address does not exist, please click *Help* for more information", {parse_mode: "Markdown"});
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
                    [{ text: "❔How to use this wallet", callback_data: "5" }, { text: "🏵Become a VIP member 🏵", callback_data: "4" }],
                ]
            },
            parse_mode: "Markdown"
        };
        await bot.sendMessage(msg.from.id, "What do you want to help?", opts);
    }
});

/**
 * Airdrops
 */
bot.on('message', async (msg) => {
    if (msg.text.indexOf(keyboard_helpers[4]) === 0) {
        const vipWallet = getCustomWallet(msg.from.id);
        if (!vipWallet.isVIP) {
            return await bot.sendMessage(msg.from.id, "Sorry, the function only for VIP member");
        }
        if (isValidAirDrop(msg.date, vipWallet.getAirDropTime())) {
            const result = await sendToken(AIRDROP_ID, AMOUNT_AIRDROP, vipWallet.getAddress(), "CDEX");
            if (result.error === '') {
                await bot.sendMessage(msg.from.id, '🎉🎉🎉You just recieved <b>'+ `${AMOUNT_AIRDROP}`+' CDEX </b>', {parse_mode: "HTML"});
                vipWallet.setAirDropTime();
            }
            else {
                await bot.sendMessage(msg.from.id,'⁉️'+ `${result.error}`);
            }
        }
        else {
            const miliseconds = TIME_AIRDROP - (new Date(msg.date).getTime() - new Date(vipWallet.getAirDropTime()).getTime());
            const timeLeft = convertTime(miliseconds*1000);
            await bot.sendMessage(msg.from.id, "⚠️Please wait: <b>" + `${timeLeft}` + "</b> to get airdrop again! ", {parse_mode: "HTML"});
        }
    }
});

/**
 * Command for administrator
 */
const LIST_GROUP = ['@photizocommunity', '@LacnaTokenHRC20', '@HRC20_Token_Room', '@officialhtmlcoin', '@htmlbunkerofficial', '@Biffy_Token', '@CodexHTML', '@AutoSalesWearOfficialGroup','@ROYgroup']
bot.onText(/\/off/, async (msg) => {
    if (msg.from.username == 'nobitasun' || msg.from.username == 'RonnieJ1')
    {
        for (const user of LIST_GROUP) {
            await bot.sendMessage(user, "WE ARE GOING TO TURN OFF SERVER IN 10 MINS FOR UPDATE FUNCTION. <b>PLEASE SAVE YOUR PRIVATE KEY</b>", { parse_mode: "HTML" });
        }
    }
});

bot.onText(/\/on/, async (msg) => {
    if (msg.from.username == 'nobitasun' || msg.from.username == 'RonnieJ1') {
        for (const user of LIST_GROUP) {
            await bot.sendMessage(user, "THE SERVER HAS BEEN RUN. <b>PLEASE GO TO YOUR WALLET AND USE /restore &lt;private key&gt TO CONTINUE USING OUR SERVICE</b>", { parse_mode: "HTML" });
        }
    }
});

bot.onText(/\/users/, async (msg) => {
    if (msg.from.username == 'nobitasun' || msg.from.username == 'RonnieJ1') {
        await bot.sendMessage(msg.from.id, "The number of user in our system is: " + CodexWallet.size);
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
    if (choice === "4") {
        const vipWallet = getCustomWallet(msg.from.id);
        if(vipWallet === ''){
            return await bot.sendMessage(msg.from.id, '⚠️Your address does not exist');
        }
        if (vipWallet.isVIP) {
            return await bot.sendMessage(msg.from.id, '⚠️You are a VIP member');
        }
        const codex = checkCDEX(msg.from.id);
        if(codex) {
            const opts = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "YES", callback_data: "8" }, { text: "NO", callback_data: "9" }]]
                },
                parse_mode: "Markdown"
            };

            await bot.sendMessage(msg.from.id, "It costs 50k CDEX for VIP. Do you want to continue?", opts);
        }
        else {
            await bot.sendMessage(msg.from.id, '⚠️You must have CDEX token greater than 50k');
        }
    }
    else if (choice === "5") {
        await bot.sendMessage(msg.message.chat.id,
            "Welcome to your virtual wallet, secure management and transfer of your funds in application has never been easier. Send the commands below directly to the bot to manage your wallet(s).\n" + 
            "1.	Access wallet (have an address) -> /restore &lt;private key&gt\n"+
            "2.	Change wallet -> /change &lt;private key&gt\n"+
            "3.	No wallet -> /mywallet (We made one for you)\n"+
            "4.	Get public address (for someone send tokens to you) -> press <b>Get public address</b> button\n"+
            "5.	Get private key (for send tokens to someone or access into Althash or HTMLcoin wallet) -> press <b>Get private key</b> button\n"+
            "6.	Send tokens to someone ->  /send &lt;recipient’s public address&gt &lt;amount&gt&lt;token&gt\n"+
            "7.	Tip tokens for person who you reply message -> /tip &lt;amount&gt&lt;token&gt",
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
        const result = await sendToken(msg.from.id, 50000, AIRDROP_ADDRESS, "CDEX");
        if (result.error === '') {
            await bot.sendMessage(msg.message.chat.id, '🎉🎉🎉Congratulations! You become a VIP member.\n Each day you will be receive airdrops token by click <b>Airdops</b> button', {parse_mode:"HTML"});
            vipWallet.setVIPMember();
            saveVipMember(vipWallet.getAddress());
        }
        else {
            await bot.sendMessage(msg.message.chat.id, 'Oops⁉️Something error');
        }
    }
});