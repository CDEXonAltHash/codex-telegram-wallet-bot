'use strict';
require('babel-polyfill');
const {
    generateAccount,
    saveAccount,
    getAddress,
    getPrivKey,
    restoreFromWIF,
    changeFromWIF,
    getCustomWallet,
    saveVipMember,
    getVip,
    getVIPPrice
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
    AIRDROP_ID,
    AIRDROP_ADDRESS,
    BOT_ERROR,
} = require('./src/config/Config');

const hrc20 = require('./src/libs/hrc20');

const { 
    loadBotAccountFromFile,
    loadVip,
    CodexWallet,
    saveAllVip,
    CodexVIP
} = require('./src/services/StorageService');

const {
    svgTemplate,
    buildSvgFile,
    convertSvg2Png,
} = require('./src/utils/VisualizeData');

const {
    airdropLog,
    getLuckyAirdrop
} = require('./src/services/VIPMenu');

const {
    rainTokenPerDay,
    rewardsPerWeek,
    rainTokenForVip,
    sendTokenToVip,
    rainTokenOnRoom
} = require('./src/services/RainTokenService');

const {
    addVolume,
    drawHtmlVolume
} = require('./src/services/HtmlVolumeService');

const {
    parserDate,
    sleep
} = require('./src/utils/DateParser');

const {
    checkTokenSymbol,
    validBalance
} = require('./src/utils/ValidTokenSymbol');

const {
    validDecimals
} = require('./src/utils/parser');

const {
    codexBot,
} = require('./src/services/initBot')
require('./src/services/worker')

const keyboard_helpers = ["📬Public address", "💰Get balance", "🔑Get private key", "🔍Help", "🎁VIP menu"];


/**
 * Load address of bot to airdrop function
 */
loadVip();
loadBotAccountFromFile();



/**
 * Start bot
 */

let isViewTransactions = true;
codexBot.onText(/\/start/, async(msg) => {
    isViewTransactions = true;
    const address = getAddress(msg.from.id);
    if (address === '') {
        const welcomeMessage =
            'Welcome to HRC20 Codex Bot, use command below to access wallet\n' +
            '1.	Access to wallet(have an address) -> /restore <private key>\n' +
            '2.	No wallet -> /mywallet (We made one for you)';
        await codexBot.sendMessage(msg.chat.id, welcomeMessage);
    }
    else {
        await codexBot.sendMessage(msg.from.id, "Welcome back to Codex codexBot", {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4]],
                ]
            }
        });
    }

});

/**
 * Made new address
 */
codexBot.onText(/\/mywallet/, async (msg) => {
    const address = getAddress(msg.from.id);
    if (address !== '') {
        return await codexBot.sendMessage(msg.chat.id, "You already have an active wallet with me, to change it to another one please use the  / change  command");
    }
    const account = generateAccount();
    if (account.privKey !== undefined)
    {
        saveAccount(msg.from.id, msg.from.first_name, account.wallet);
        await codexBot.sendMessage(msg.from.id, 'Create new wallet is successful\n' +
        '<b>Your public address is:</b> ' + `${account.address}` +
        '\n<b>Your private key is :</b> ' + `${account.privKey}` +
        '\n<i>(Please save private key to a safe place)</i>',
        {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4]],
                ]
            },
            parse_mode:"HTML"
        });
    }
});
/**
 * Change new address on wallet from WIF
 */
 codexBot.onText(/\/change (.+)/, async (msg, match) => {
    const result =  changeFromWIF(msg.from.id, msg.from.first_name, match[1]);
    if (result === true) {
        await codexBot.sendMessage(msg.from.id, 'The change adddress is sucessful');
    }
    else {
        await codexBot.sendMessage(msg.from.id, '❌The private key is invalid or you do not have account on wallet');
    }
});

/**
 * Restore an address on wallet from WIF
 */
 codexBot.onText(/\/restore (.+)/, async (msg, match) => {
    const result = restoreFromWIF(msg.from.id, msg.from.first_name, match[1]);
    if (result === true) {
        await codexBot.sendMessage(msg.from.id, "Restore address is successful", {
            "reply_markup": {
                "keyboard": [
                    [keyboard_helpers[0], keyboard_helpers[1]],
                    [keyboard_helpers[2], keyboard_helpers[3]],
                    [keyboard_helpers[4]],
                ]
            }
        });
    }
    else {
        await codexBot.sendMessage(msg.from.id, '❌The private key is invalid or your address already existed');
    }
});

/**
 * Statistics CDEX token
 */

codexBot.onText(/\/stats/,  async (msg) => {
    const supply =  hrc20.getTokenBySymbol('CDEX');
    await codexBot.sendMessage(msg.chat.id, 'Total Supply of CDEX:', supply.total_supply);
});

/**
 * Bot send token
 */
const botCheckValid = async (msgId, userId, amount, symbol) => {
    let isValid = 'ERROR';
    const balance = await getBalance(userId);
    if (balance === '') {
        await codexBot.sendMessage(msgId, '❌Please setup your wallet first');
        return isValid;
    }
    if (isNaN(amount) || (amount * 1 <= 0)) {
        await codexBot.sendMessage(msgId, '❌Sorry, the amount for token must be positive number');
    }
    else if (!validDecimals(amount*1)) {
        await codexBot.sendMessage(msgId, '❌Sorry, the amount of decimals is <= 8');
    }
    else if (symbol === undefined) {
        await codexBot.sendMessage(msgId, '❌Please type token symbol');
    }
    else {
        const validSymbol = checkTokenSymbol(symbol);
        if(validSymbol === symbol) {
            isValid = validBalance(balance, symbol, amount * 1) ? 'OKAY' : 'NOT ENOUGH';
        }
        else if (validSymbol) {
            await codexBot.sendMessage(msgId,'❌Sorry, Did you mean: ' + validSymbol);
        }
        else {
            await codexBot.sendMessage(msgId, '❌Sorry, We do not support this token');
        }
    }
    return isValid;
}

const botSendToken = async (msgId, msgContent,  ownerTelegramId, toAddress, amount, token, userName) => {

    const result = await sendToken(ownerTelegramId, amount, toAddress, token);
    const url = "https://explorer.htmlcoin.com/tx/" + `${result.trxId}`;
    if (result.error === '') {
        await codexBot.sendMessage(msgId, '✅ ' + `${msgContent}` + ' successful\n' + '<a href=\"' + `${url}` + '">Please check transaction here</a>', { parse_mode: "HTML" });
    }
    else {
        // console.log(JSON.stringify(result.error, ["message", "arguments", "type", "name"]));
        await codexBot.sendMessage(BOT_ERROR, `[${userName}]Send token: ${result.error}`)
        return await codexBot.sendMessage(msgId, '❌' + 'Opps! The system is busy, please try in a minute',{parse_mode:"Markdown"});
    }
    //HTMLcoin volume
    if(token === 'HTML') {
        addVolume(parserDate(), amount*1);
    }
    else {
        addVolume(parserDate(), 1);
    }
}

/**
 * Send token
 */
codexBot.onText(/\/send (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    const isValid = await botCheckValid(msg.from.id, msg.from.id, params[1], params[2]);
    if (isValid === 'OKAY') {
        await botSendToken(msg.from.id, 'Send tokens is ', msg.from.id, params[0], params[1], params[2], msg.from.username);
    }
    else if (isValid === 'NOT ENOUGH'){
        await codexBot.sendMessage(msg.from.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
    }
});

/**
 * Tip some token for some one 
 */
codexBot.onText(/\/tip (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    /**
     * Check account exist or not
     */
    let address = getAddress(msg.reply_to_message.from.id);
    if(address === '') {
        return await codexBot.sendMessage(msg.chat.id, "❌Tip cannot be completed recipient has not set up wallet", { parse_mode: "Markdown" });
    }
    /**
     * After that send some tokens
     */
    const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
    if (isValid === 'OKAY') {
        await botSendToken(msg.chat.id, 'Tip tokens is ', msg.from.id, address, params[0], params[1], msg.from.username);
    }
    else if (isValid === 'NOT ENOUGH') {
        await codexBot.sendMessage(msg.chat.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
    }
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
codexBot.onText(/\/balance/, async (msg) => {
    try {
        const info = await getBalance(msg.from.id);
        if (info === '') {
            return await codexBot.sendMessage(msg.from.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")" + "-> Please go to @CodexWalletBot for more information", { parse_mode: "Markdown" });
        }
        const svgFile = botGetBlance(info);
        const imgBalance = await convertSvg2Png(svgFile);

        await codexBot.sendMessage(msg.from.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + "), your current balance is:", { parse_mode: "Markdown" });
        await codexBot.sendPhoto(msg.from.id, imgBalance);
    }  catch (err) {       
        if(err !== 'ReferenceError: a is not defined')
        { 
            // await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]Balance: ${err}`);
        }
    }

});

/**
 * Trading function
 */
let commandTrade = '';
codexBot.onText(/\/trade (.+)/,  async (msg, match) => {
    if (isValidOffer(msg.reply_to_message.date)) {
        const adsAccount = getCustomWallet(msg.reply_to_message.from.id);
        const traderAccount = getCustomWallet(msg.from.id);

        if (adsAccount === '') {
            await codexBot.sendMessage(msg.chat.id, "⚠️ " + "[" + msg.reply_to_message.from.username + "](tg://user?id=" + msg.reply_to_message.from.id + ")" + "-> Please go to @CodexWalletBot create/restore address on AltHash blockchain first", {parse_mode: "Markdown"});
        }
        else if (traderAccount === '') {
            await codexBot.sendMessage(msg.chat.id, "⚠️ " + "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")" + "-> Please go to @CodexWalletBot create/restore address on AltHash blockchain first", {parse_mode: "Markdown"});
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
            await codexBot.sendMessage(msg.chat.id, "⏰ Please confirm trade request ⏰ \n" +
                "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")"+ ' sending: ' + commandTrade.exchangeAmount + ' ' + commandTrade.exchangeToken + '\n' +
                "[" + msg.reply_to_message.from.username + "](tg://user?id=" + msg.reply_to_message.from.id + ")" + ' sending: ' + commandTrade.ownAmount 
                + ' ' + commandTrade.ownToken + '\n', opts);
        }
    }
    else {
        await codexBot.sendMessage(msg.chat.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + ")"+ " ⚠️Can't trade an offer that is older than 12 hours", {parse_mode:"Markdown"});
    }
});

/**
 *  Get public address
 */
codexBot.on('message', async (msg) => {
    try {
        if (msg.text.indexOf(keyboard_helpers[0]) === 0) {
            const address = getAddress(msg.from.id);
            if (address !== '') {
                await codexBot.sendMessage(msg.from.id, "Your public address is: " + `${address}`);
            }
            else {
                await codexBot.sendMessage(msg.from.id,
                    "Your address does not exist, please click *Help* button for more information", { parse_mode: "Markdown" });
            }
        }
    } catch (err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            // await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]System: ${err}`)
        }
    }
});

/**
 * Get balance
 */
codexBot.on('message', async (msg) => {
    try {
        if (msg.text.indexOf(keyboard_helpers[1]) === 0) {
            const info = await getBalance(msg.from.id);
            if (info === '') {
                return await codexBot.sendMessage(msg.chat.id, "Your address does not exist, please click *Help* button for more information", { parse_mode: "Markdown" });
            }
            const svgFile = botGetBlance(info);
            const imgBalance = await convertSvg2Png(svgFile);
            await codexBot.sendMessage(msg.from.id, "[" + msg.from.username + "](tg://user?id=" + msg.from.id + "), your current balance is:", { parse_mode: "Markdown" });

            await codexBot.sendPhoto(msg.from.id, imgBalance);
        }
    } catch(err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            // await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]Balance: ${err}`)
        }
    }
});

/**
 * Get Private key
 */
codexBot.on('message', async(msg) => {
    try {
        if (msg.text.indexOf(keyboard_helpers[2]) === 0) {
            const privKey = getPrivKey(msg.from.id);
            if (privKey !== '') {
                await codexBot.sendMessage(msg.from.id, "Your private key is: " + `${privKey}`);
            }
            else {
                await codexBot.sendMessage(msg.from.id,
                    "Your address does not exist, please click *Help* for more information", { parse_mode: "Markdown" });
            }
        }
    } catch(err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            // await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]System: ${err}`)
        }
    }

});

/**
 * Show help
 */
codexBot.on('message', async (msg) => {
    try {
        if (msg.text.indexOf(keyboard_helpers[3]) === 0) {
            const opts = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "❔How to use this wallet", callback_data: "5" }, { text: "🏵Become a VIP member 🏵", callback_data: "4" }],
                    ]
                },
                parse_mode: "Markdown"
            };
            await codexBot.sendMessage(msg.from.id, "What do you need help with?", opts);
        }
    }  catch(err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            // await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]System: ${err}`)
        }
    }

});

/**
 * Airdrops
 */
codexBot.on('message', async (msg) => {
    try {
        if (msg.text.indexOf(keyboard_helpers[4]) === 0) {
            const vipWallet = getCustomWallet(msg.from.id);
            if (!vipWallet.isVIP) {
                return await codexBot.sendMessage(msg.from.id, "Sorry, This function only for VIP member");
            }
            let inlineKeyboard = [];
            if (isViewTransactions) {
                inlineKeyboard = [[{ text: "📊Airdrop Log", callback_data: "9" }, { text: "👀View transactions", callback_data: "10" }],
                [{ text: "🎁Get Aidrop", callback_data: "11" }]]
            }
            else {
                inlineKeyboard = [[{ text: "📊Airdrop Log", callback_data: "9" }],
                [{ text: "🎁Get Aidrop", callback_data: "11" }]]
            }
            const opts = {
                reply_markup: {
                    inline_keyboard: inlineKeyboard
                },
                parse_mode: "HTML"
            };

            await codexBot.sendMessage(msg.from.id, "<b>Please choose action</b>", opts);
        }
    } catch (err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            // await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]System: ${err}`)

        }

    }
});

/**
 * Command for administrator
 */
const LIST_GROUP = ['@photizocommunity', '@LacnaTokenHRC20', '@HRC20_Token_Room', '@officialhtmlcoin', '@htmlbunkerofficial', '@Biffy_Token', '@CodexHTML', '@AutoSalesWearOfficialGroup','@ROYgroup']
codexBot.onText(/\/off/, async (msg) => {
    const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

    if (admin.status === 'administrator' || admin.status === 'creator') {
        for (const user of LIST_GROUP) {
            await codexBot.sendMessage(user, "WE ARE GOING TO TURN OFF SERVER IN 10 MINS FOR UPDATE FUNCTION. <b>PLEASE SAVE YOUR PRIVATE KEY</b>", { parse_mode: "HTML" });
        }
    }
    else {
        await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
    }
});

codexBot.onText(/\/on/, async (msg) => {
    const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

    if (admin.status === 'administrator' || admin.status === 'creator') {
        for (const user of LIST_GROUP) {
            await codexBot.sendMessage(user, "THE SERVER HAS BEEN RUN. <b>PLEASE GO TO YOUR WALLET AND USE /restore &lt;private key&gt TO CONTINUE USING OUR SERVICE</b>", { parse_mode: "HTML" });
        }
    }
    else {
        await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
    }
});

codexBot.onText(/\/users/, async (msg) => {
    const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

    if (admin.status === 'administrator' || admin.status  === 'creator') {
        await codexBot.sendMessage(msg.from.id, "The number of user in our system is: " + CodexWallet.size);
    }
    else {
        await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
    }
});


codexBot.onText(/\/rain (.+)/, async (msg, match) => {
    try {
        const params = match[1].split(' ');

        //Check valid syntax
        if (params[1] === 'to') {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, You need to include the symbol you are sending');
        }
        if (isNaN(params[3]) || (params[3] * 1) < 0 || (params[3]*1) > 25 ) {
            return await codexBot.sendMessage(msg.chat.id, "❌ Sorry, The number of people must be a positive number and smaller than 25", { parse_mode: "HTML" });
        }
        const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
        if (isValid === 'OKAY') {
            let listUser = [];
            let result = undefined;
            result = await rainTokenPerDay(msg.from.id, params[0] * 1, params[3] * 1, params[1]);
            if (result.error !== '') {
                await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}]Cannot make it rain: ${result.error}`)
                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot make it rain now. Please try in a minute");
            } 
            listUser = result.listUsers;
            let rainMsg = '';
            if (!listUser.length) {
                return await codexBot.sendMessage(msg.chat.id, "<b> WE DO NOT HAVE ANY LUCKY PEOPLE TODAY. SEE IN NEXT TIME</b>\n\n" +
                    rainMsg, { parse_mode: "HTML" });
            }
            for (const user of listUser) {
                let name = user.name
                name = name.replace(/[&\/\\#,+()$~%.;!'":*?<>{}\[\]]/g, '');
                rainMsg += user.volume + ' ' + params[1] + ' to ' + '[' + name + '](tg://user?id=' + user.userId + ')\n';
            }
            await codexBot.sendMessage(msg.chat.id, "☀️☀️ *TOKEN RAIN IS DONE. CONGRATULATIONS TO ALL THE LUCKY PEOPLE* ☀️☀️\n\n" +
                rainMsg, { parse_mode: "Markdown" });
    
            //HTMLcoin volume
            params[1] === 'HTML' ? addVolume(parserDate(), params[0] * 1) : addVolume(parserDate(), 1);
        }
        else if (isValid === 'NOT ENOUGH') {
            await codexBot.sendMessage(msg.chat.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }
        // await sleep(60000);
    } catch(err) {
        await codexBot.sendMessage(BOT_ERROR, `${msg.from.username}Rain: ${err}`)
    }

});


/**
 * Rain token for specific room
 */

codexBot.onText(/\/raintothisroom (.+)/, async (msg, match) => {
    try {
        const params = match[1].split(' ');

        //Check valid syntax
        if (params[1] === 'to') {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, You need to include the symbol you are sending');
        }
        if (isNaN(params[3]) || (params[3] * 1) < 0 || (params[3]*1) > 25 ) {
            return await codexBot.sendMessage(msg.chat.id, "❌ Sorry, The number of people must be a positive number and smaller than 25", { parse_mode: "HTML" });
        }
        const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
        if (isValid === 'OKAY') {
            let listUser = [];
            let result = undefined;
            result = await rainTokenOnRoom(msg.chat.id, msg.from.id, params[0] * 1, params[3] * 1, params[1]);
            if (result.error !== '' && result.error!== undefined) {
                await codexBot.sendMessage(BOT_ERROR, `${msg.from.username}Cannot make it rain: ${result.error}`)
                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot make it rain now. Please try in a minute");
            } 
            listUser = result.listUsers;
            let rainMsg = '';
            if (!listUser.length) {
                return await codexBot.sendMessage(msg.chat.id, "<b> WE DO NOT HAVE ANY LUCKY PEOPLE TODAY. SEE IN NEXT TIME</b>\n\n" +
                    rainMsg, { parse_mode: "HTML" });
            }
            for (const user of listUser) {
                let name = user.name
                name = name.replace(/[&\/\\#,+()$~%.;!'":*?<>{}\[\]]/g, '');
                rainMsg += user.volume + ' ' + params[1] + ' to ' + '[' + name + '](tg://user?id=' + user.userId + ')\n';
            }
            await codexBot.sendMessage(msg.chat.id, "☀️☀️ *TOKEN RAIN IS DONE. CONGRATULATIONS TO ALL THE LUCKY PEOPLE* ☀️☀️\n\n" +
                rainMsg, { parse_mode: "Markdown" });
    
            //HTMLcoin volume
            params[1] === 'HTML' ? addVolume(parserDate(), params[0] * 1) : addVolume(parserDate(), 1);
        }
        else if (isValid === 'NOT ENOUGH') {
            await codexBot.sendMessage(msg.chat.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }
        // await sleep(60000);
    } catch(err) {
        await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}] Rain in room: ${err}`)
    }

});

/**
 * Rewards perweek
 */

codexBot.onText(/\/rewards (.+)/, async (msg, match) => {
    const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

    if (admin.status === 'administrator' || admin.status === 'creator') {
        const params = match[1].split(' ');
        const result = await rewardsPerWeek();
        const imageRewards = result.imageRewards;
        await codexBot.sendMessage(msg.chat.id, "🏆🏆🏆🏆🏆<b> We notice the top users weekly </b> (" + params[0] + " to " + params[1] + " )🏆🏆🏆🏆🏆", { parse_mode: "HTML" });
        await codexBot.sendPhoto(msg.chat.id, imageRewards);

        await codexBot.sendMessage(msg.chat.id, "🎊🎊 And now, We congratulate top 3, please check your wallet 🎊🎊 \n\n" +
            "🥇[First Prize](tg://user?id=" + result.firstPrize + ")      : 500 CDEX \n" +
            "🥈[Second Prize](tg://user?id=" + result.secondPrize + ") : 300 CDEX \n" +
            "🥉[Third Prize](tg://user?id=" + result.thirdPrize + ")     : 100 CDEX", { parse_mode: "Markdown" });

        //HTMLcoin volume
        addVolume(parserDate(), 3);
    }
    else {
        await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
    }
});

/**
 * HTMLcoin volume
 */
codexBot.onText(/\/volumeonbot/, async (msg) => {
    const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

    if (admin.status === 'administrator' || admin.status === 'creator') {
        const imgHTML = await drawHtmlVolume();
        await codexBot.sendPhoto(msg.chat.id, imgHTML);
    }
    else {
        await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
    }
});

/**
 * Rain token for VIPs
 */
codexBot.onText(/\/raintoallVIPs (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    let result = {};
    try {
        const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
        if (isValid === 'OKAY') {
            const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

            if (admin.status === 'administrator' || admin.status === 'creator') {
                result = await rainTokenForVip(msg.from.id, params[0] * 1, params[1]);
            }
            else {
               return await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
            }
    
            if(result.hasError) {
                await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}] Rain to VIPs: ${result.error}`)

                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot make it rain to VIPs now. Please try in a minute");
            } else {
                return await codexBot.sendMessage(msg.chat.id, "WE HAVE JUST MADE IT RAIN TOKENS TO VIPs. KINDLY CHECK YOUR WALLET");
            }
        } else if (isValid === 'NOT ENOUGH') {
            await codexBot.sendMessage(msg.chat.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }

    } catch(err) {
        await codexBot.sendMessage(msg.from.id, "❌ Opps!! Something went wrong let try again in a minute", { parse_mode: "HTML" });
    }

});

/**
 * Send token for VIPs
 */
codexBot.onText(/\/sendtoallVIPs (.+)/, async (msg, match) => {
    const params = match[1].split(' ');
    let result = true;
    try {
        const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
        if (isValid === 'OKAY') {

            const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

            if (admin.status === 'administrator' || admin.status === 'creator') {
                result = await sendTokenToVip(msg.from.id, params[0] * 1, params[1]);
            }
            else {
                return await codexBot.sendMessage(msg.chat.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
            }

            if(result) {
                await codexBot.sendMessage(BOT_ERROR, `[${msg.from.username}] Send token to VIPs`)

                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot send tokens to VIPs now. Please try in a minute");
            } else {
                return await codexBot.sendMessage(msg.chat.id, "WE HAVE JUST SENT TOKENS TO VIP USERS. KINDLY CHECK YOUR WALLETS");
            }
        }else if (isValid === 'NOT ENOUGH') {
            await codexBot.sendMessage(msg.chat.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }

    } catch(err) {
        await codexBot.sendMessage(msg.from.id, "❌ Opps!! Something went wrong let try again in a minute", { parse_mode: "HTML" });

    }

});
/**
 * Handle polling question
 */
codexBot.on("callback_query", async  (msg) => {
    try {
        const choice = msg.data;
        if ((choice === '6'|| choice === '7') && (msg.from.id !== commandTrade.traderId)) {
            return await codexBot.answerCallbackQuery(msg.id,'This message does not apply to you');
        }
        await codexBot.deleteMessage(msg.message.chat.id, msg.message.message_id);
        if (choice === "4") {
            const vipWallet = getAddress(msg.from.id);
            if(vipWallet === ''){
                return await codexBot.sendMessage(msg.from.id, '⚠️Your address does not exist');
            }
            if (getVip(vipWallet)) {
                return await codexBot.sendMessage(msg.from.id, '⚠️You are a VIP member');
            }
            const codex = checkCDEX(msg.from.id);
            const vipPrice = getVIPPrice()
            if(codex) {
                const opts = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "YES", callback_data: "8" }, { text: "NO", callback_data: "9" }]]
                    },
                    parse_mode: "Markdown"
                };
                
                await codexBot.sendMessage(msg.from.id, "This function will deduct " +`${vipPrice}`+" ‘CDEX’ from your wallet. This is a one time charge to be VIP for life! *These funds are unretrievable*\nDo you want to continue?", opts);
            }
            else {
                await codexBot.sendMessage(msg.from.id, '⚠️You must have CDEX token greater than ' + `${vipPrice}`);
            }
        }
        else if (choice === "5") {
            await codexBot.sendMessage(msg.message.chat.id,
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
                    deleteMsg = await codexBot.sendMessage(msg.message.chat.id, "1️⃣Transfering " + checkTrade.adsAmount + ' ' + checkTrade.adsToken + ' from  ' + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsAmount + ")", {parse_mode: "Markdown"});
                    result = await sendToken(commandTrade.adsId, checkTrade.adsAmount, getAddress(commandTrade.traderId), checkTrade.adsToken);
                    //trader send
                    if (result.error === '') {
                        await codexBot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                        deleteMsg = await codexBot.sendMessage(msg.message.chat.id, "2️⃣Transfering " + checkTrade.traderAmount + ' ' + checkTrade.traderToken + ' from  ' + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")", {parse_mode: "Markdown"});
                        result = await sendToken(commandTrade.traderId, checkTrade.traderAmount, getAddress(commandTrade.adsId), checkTrade.traderToken);
                    }
                }
                else if (checkTrade.type === 'autobuy') {
                    //trader send
                    deleteMsg = await codexBot.sendMessage(msg.message.chat.id, "1️⃣Transfering " + checkTrade.traderAmount + ' ' + checkTrade.traderToken + ' from  ' + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")", {parse_mode: "Markdown"});
                    result = await sendToken(commandTrade.traderId, checkTrade.traderAmount, getAddress(commandTrade.adsId), checkTrade.traderToken);
                    //ads send
                    if (result === '') {
                        await codexBot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                        deleteMsg = await codexBot.sendMessage(msg.message.chat.id, "2️⃣Transfering " + checkTrade.adsAmount + ' ' + checkTrade.adsToken + ' from  ' + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")", {parse_mode: "Markdown"});
                        result = await sendToken(commandTrade.adsId, checkTrade.adsAmount, getAddress(commandTrade.traderId), checkTrade.adsToken);
                    }
                }
                if (result.error !== '') {
                    await codexBot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                    await codexBot.sendMessage(msg.message.chat.id, "❌Transaction on trade: \n" + " between "
                        + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")" + ' and ' + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ' has an error: \n'
                        + result.error, {parse_mode: "Markdown"});
                }
                if (result.error === '') {
                    await codexBot.deleteMessage(msg.message.chat.id, deleteMsg.message_id);
                    await codexBot.sendMessage(msg.message.chat.id, "✅Trade of  " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + " completed! \n"
                        + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")" + " (" + checkTrade.adsAmount + ' ' + checkTrade.adsToken + ') <-> '
                        + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + " (" + checkTrade.traderAmount + ' ' + checkTrade.traderToken + ')',
                        {parse_mode: "Markdown"});
    
                }
    
            }
            else if (checkTrade.validAds === 301) {
                await codexBot.sendMessage(msg.message.chat.id, "❌" + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId +")" + ': Insufficient HTML tokens!', {parse_mode: "Markdown"});
            }
            else if (checkTrade.validAds === 302) {
                await codexBot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.adsUsername + "](tg://user?id=" + commandTrade.adsId + ")"+ ': Insufficient ' + commandTrade.ownToken + ' tokens!', { parse_mode: "Markdown" });
            }
            else if (checkTrade.validTrader === 401) {
                await codexBot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ': Insufficient HTML tokens!', { parse_mode: "Markdown" });
            }
            else if (checkTrade.validTrader === 402) {
                await codexBot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ': Insufficient ' + commandTrade.exchangeToken + ' tokens!', { parse_mode: "Markdown" });
            }
        }
        else if(choice === "7") {
            await codexBot.sendMessage(msg.message.chat.id, "❌ " + "[" + commandTrade.traderUsername + "](tg://user?id=" + commandTrade.traderId + ")" + ' canceled trade!', { parse_mode: "Markdown"});
        }
    
        else if(choice === "8") {
            const vipWallet = getCustomWallet(msg.from.id);
            const vipPrice = getVIPPrice()

            const result = await sendToken(msg.from.id, vipPrice , AIRDROP_ADDRESS, "CDEX");
            if (result.error === '') {
                await codexBot.sendMessage(msg.message.chat.id, "🎉🎉Congratulations! You are now a Lifetime VIP member🎉🎉\n" +
                                                                "Kindly press <b>VIP menu</b> button to see more information", {parse_mode:"HTML"});
                vipWallet.setVIPMember();
                saveVipMember(vipWallet.getAddress());
            }
            else {
                await codexBot.sendMessage(msg.message.chat.id, 'Oops⁉️ Something is error');
                await codexBot.sendMessage(BOT_ERROR, `Make VIP is error:${result.error}`);
            }
        }
        else if (choice === "9") {
            const imgeLog = await airdropLog(msg.from.id);
            if (imgeLog === false) {
                await codexBot.sendMessage(msg.from.id, 'You do not have any airdrop log to show');
            }
            else {
                await codexBot.sendMessage(msg.from.id, '<b>Your airdop log</b>', {parse_mode:"HTML"});
                await codexBot.sendPhoto(msg.from.id, imgeLog);
            }
        }
        else if (choice === "10") {
            await codexBot.sendMessage(msg.message.chat.id, 'View transactions will be coming soon ... ');
            isViewTransactions = false;
        }
        else if (choice === "11") {
            const vipWallet = getCustomWallet(msg.from.id);
            if (isValidAirDrop(msg.message.date, vipWallet.getAirDropTime())) {
                const amountAirdrop = getLuckyAirdrop(msg.from.id);
                const result = await sendToken(AIRDROP_ID, amountAirdrop, vipWallet.getAddress(), "CDEX");
                if (result.error === '') {
                    await codexBot.sendMessage(msg.from.id, '🎉🎉🎉You just received <b>' + `${amountAirdrop}`+' CDEX </b>', {parse_mode: "HTML"});
                    vipWallet.setAirDropTime();
                    
                    CodexVIP.set(`${vipWallet.getAddress()}`, airDropTime);

                    saveAllVip();
                    //HTMLcoin volume
                    addVolume(parserDate(), 1);
                }
                else {
                    await codexBot.sendMessage(msg.from.id,'⁉️'+ `${result.error}`);
                }
            }
            else {
                const miliseconds = TIME_AIRDROP - (new Date(msg.message.date).getTime() - new Date(vipWallet.getAirDropTime()).getTime());
                const timeLeft = convertTime(miliseconds*1000);
                await codexBot.sendMessage(msg.from.id, "⚠️Please wait: <b>" + `${timeLeft}` + "</b> to get airdrop again! ", {parse_mode: "HTML"});
            }
        }
    } catch(err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            await codexBot.sendMessage(BOT_ERROR, `System: ${err}`)
        }
    }
});
