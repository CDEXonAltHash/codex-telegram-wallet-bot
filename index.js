'use strict';
require('babel-polyfill');
const { isEmpty } = require('lodash')
const {
    generateAccount,
    saveAccount,
    getAddress,
    getPrivKey,
    restoreFromWIF,
    changeFromWIF,
    getVIPPrice,
    getVip,
    saveVipMember
} = require('./src/services/AddressService'); 

const { 
    sendToken,
    getBalance,
    checkCDEX,
} = require('./src/services/TokenService');

const {
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
    CodexWallet,
    CodexVIP,
    loadVip
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
    parserDate
} = require('./src/utils/DateParser');

const {
    checkTokenSymbol,
    validBalance,
    addTokens
} = require('./src/utils/ValidTokenSymbol');

const {
    validDecimals
} = require('./src/utils/parser');

const {
    codexBot,
} = require('./src/services/initBot')

// require('./src/services/worker')
// const {
//     VIP
// } = require('./db/models')

// require('./db')


const keyboard_helpers = ["📬Public address", "💰Get balance", "🔑Get private key", "🔍Help", "🎁VIP menu"];



/**
 * Load address of bot to airdrop function
 */
loadBotAccountFromFile();

loadVip();


/**
 * Start bot
 */

let isViewTransactions = true;
codexBot.onText(/\/start/, async(msg) => {
    try {
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
    } catch(err) {
            
    }

});

/**
 * Made new address
 */
codexBot.onText(/\/mywallet/, async (msg) => {
    try {
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
    } catch(err) {
            
    }

});
/**
 * Change new address on wallet from WIF
 */
 codexBot.onText(/\/change (.+)/, async (msg, match) => {
    try {
        const result =  changeFromWIF(msg.from.id, msg.from.first_name, match[1]);
        if (result === true) {
            await codexBot.sendMessage(msg.from.id, 'Change of address successful.');
        }
        else {
            await codexBot.sendMessage(msg.from.id, '❌The private key is invalid or you do not have account on wallet');
        }
    } catch(err) {

    }

});

/**
 * Restore an address on wallet from WIF
 */
 codexBot.onText(/\/restore (.+)/, async (msg, match) => {
    try {
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
    } catch(err) {

    }

});

/**
 * Statistics CDEX token
 */

codexBot.onText(/\/stats/,  async (msg) => {
    try {
        const supply =  hrc20.getTokenBySymbol('CDEX');
        await codexBot.sendMessage(msg.chat.id, 'Total Supply of CDEX:', supply.total_supply);
    }catch(err) {

    }

});
const compare = (a, b) => {
    const upperA = a.contract.name.toUpperCase();
    const upperB = b.contract.name.toUpperCase();

    return upperA > upperB ? 1 : -1
  }

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
    // const unconfirmedBalance = balance.unconfirmedBalance;
    // const htmlbalanceunconfrim = unconfirmedBalance.toString().split('.');
    // if((htmlbalanceunconfrim[0] * 1) < -32) {
    //     await codexBot.sendMessage(msgId, '❌Sorry, Kindly wait for another transaction to be finished');
    //     return isValid
    // }
    if (isNaN(amount) || (amount * 1 <= 0)) {
        await codexBot.sendMessage(msgId, '❌Sorry, the amount for token must be positive number');
    }
    else if (!validDecimals(amount*1)) {
        await codexBot.sendMessage(msgId, '❌Sorry, the amount of decimals is <= 8');
    }
    else if (!symbol) {
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
    const url = "http://www.cdexplorer.net/tx/" + `${result.trxId}`;
    if (result.error === '') {
        await codexBot.sendMessage(msgId, '✅ ' + `${msgContent}` + ' successful\n' + '<a href=\"' + `${url}` + '">Please check transaction here</a>', { parse_mode: "HTML" });
    }
    else {
        // console.log(JSON.stringify(result.error, ["message", "arguments", "type", "name"]));
        await codexBot.sendMessage(BOT_ERROR, `[@${userName}] Send token: ${result.error}`)
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
    try {
        const params = match[1].split(' ');
        const isValid = await botCheckValid(msg.from.id, msg.from.id, params[1], params[2]);
        if (isValid === 'OKAY') {
            await botSendToken(msg.from.id, 'Send tokens is ', msg.from.id, params[0], params[1], params[2], msg.from.username);
        }
        else if (isValid === 'NOT ENOUGH'){
            await codexBot.sendMessage(msg.from.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }
    
    } catch(err) {
       // console.log(err)
    }

});

/**
 * Tip some token for some one 
 */
codexBot.onText(/\/tip (.+)/, async (msg, match) => {
    try {
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
    } catch(err) {

    }

});

const botGetBlance =  (info) =>{
    const balance = info.balance;
    const unconfirmedBalance = info.unconfirmedBalance;
    let yCoordinate = 506;
    let hrc20 = info.hrc20;
    let svgFile = svgTemplate(800, 120 + hrc20.length*40);
    let codex 
    let hrc20Token = []
    hrc20.sort(compare)

    hrc20Token = hrc20.map(token => {

        if(token.contract.name !== 'Codex') {
            return {
                name: token.contract.name,
                balance: token.amount,
                decimals: token.contract.decimals,
                symbol: token.contract.symbol
            }
        } else{
            codex = {
                name: token.contract.name,
                balance: token.amount,
                decimals: token.contract.decimals,
                symbol: token.contract.symbol
            }
        }
    })

    hrc20Token.unshift(codex)
    hrc20Token = hrc20Token.filter(item => {
        return item != null
    })
    for(const token of hrc20Token) {
        
        if(token.symbol !== 'IVO') {
            const tokenValue = (token.balance / Math.pow(10, token.decimals)).toString().split('.');
            if(tokenValue[1] === undefined) tokenValue[1] = 0;
            if (tokenValue[0] === undefined) tokenValue[0] = 0;
            svgFile += buildSvgFile(yCoordinate, token.name, tokenValue[0], '.' + tokenValue[1] , token.symbol );
            yCoordinate += 40;
        }

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
            const address = getAddress(msg.from.id);
            const isVip = getVip(`${address}`)
            if (!isVip) {
                return await codexBot.sendMessage(msg.from.id, "Sorry, this function is only for VIP members");
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
            // console.log(keyboard_helpers[4])
            // await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Airdrop: ${err}`)

        }

    }
});

/**
 * Command for administrator
 */
const LIST_GROUP = ['@photizocommunity', '@LacnaTokenHRC20', '@HRC20_Token_Room', '@officialhtmlcoin', '@htmlbunkerofficial', '@Biffy_Token', '@CodexHTML', '@AutoSalesWearOfficialGroup','@ROYgroup']
codexBot.onText(/\/off/, async (msg) => {
    try {
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        // if (admin.status === 'administrator' || admin.status === 'creator') {
        if(admin.user.username === 'Brett_Hituhmull') {
            for (const user of LIST_GROUP) {
                await codexBot.sendMessage(user, "WE ARE GOING TO TURN OFF SERVER IN 10 MINS FOR UPDATE FUNCTION. <b>PLEASE SAVE YOUR PRIVATE KEY</b>", { parse_mode: "HTML" });
            }
        }
        else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
        }
    } catch (err) {

    }
});


codexBot.onText(/\/on/, async (msg) => {
    try {
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        // if (admin.status === 'administrator' || admin.status === 'creator') {
        if(admin.user.username === 'Brett_Hituhmull') {
            for (const user of LIST_GROUP) {
                await codexBot.sendMessage(user, "THE SERVER HAS BEEN RUN. <b>PLEASE GO TO YOUR WALLET AND USE /restore &lt;private key&gt TO CONTINUE USING OUR SERVICE</b>", { parse_mode: "HTML" });
            }
        }
        else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
        }
    } catch(err) {

    }

});

codexBot.onText(/\/addvip (.+)/, async (msg, match) => {
    try {
        const params = match[1].split(' ');
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        if(admin.user.username === 'Brett_Hituhmull') {
            if (params[0]) {
            
                saveVipMember(`${params[0]}`)
                await codexBot.sendMessage(msg.from.id, "<b>Susscessful!</b>", { parse_mode: "HTML" });
    
            }
        } else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });

        }

    } catch(err) {

    }

});


codexBot.onText(/\/checkvip (.+)/, async (msg, match) => {
    try {
        const params = match[1].split(' ');
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        if(admin.user.username === 'Brett_Hituhmull') {
            if (params[0]) {
            
               const vip = getVip(`${params[0]}`) 
               if(vip) {
                await codexBot.sendMessage(msg.from.id, "<b>This member is a vip. Kindly check in file/b>", { parse_mode: "HTML" });

               }else {
                await codexBot.sendMessage(msg.from.id, "<b>This member is not a vip. Kindly check in file/b>", { parse_mode: "HTML" });

               }
            }
        } else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });

        }

    } catch(err) {

    }

});

codexBot.onText(/\/addtoken (.+)/, async (msg, match) => {
    // const supply =  hrc20.getTokenBySymbol('CDEX');
    // addCustomToken(address, name, symbol, decimals) 
    // addTokens
    try {
        const params = match[1].split(' ');
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        if(admin.user.username === 'Brett_Hituhmull') {
            addTokens(params[2])
            addCustomToken(params[0], params[1], params[2], params[3])
            await codexBot.sendMessage(msg.from.id, "<b>Add token is done!/b>", { parse_mode: "HTML" });
            
        } else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });

        }

    } catch(err) {

    }
})

codexBot.onText(/\/users/, async (msg) => {
    try {
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        if (admin.status === 'administrator' || admin.status  === 'creator') {
            await codexBot.sendMessage(msg.from.id, "The number of user in our system is: " + CodexWallet.size);
        }
        else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
        }
    } catch (err) {

    }

});


codexBot.onText(/\/rain (.+)/, async (msg, match) => {
    try {
        const params = match[1].split(' ');

        //Check valid syntax
        if(isNaN(params[0])) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, need amount of token for rain i.e: / rain 100 CDEX to 24');
        } else if(!params[1]) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, You need to include the symbol you are sending i.e: / rain 100 CDEX to 24');
        }
        const validSymbol = checkTokenSymbol(params[1])
        if (!isNaN(params[1]) || params[1] !== validSymbol) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, You need to include the symbol you are sending i.e: / rain 100 CDEX to 24');
        } else if(!isNaN(params[2])) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Kindly check the format of command: / rain 100 CDEX to 24');
        }
        if (isNaN(params[3]) || (params[3] * 1) < 0 || (params[3]*1) > 25 ) {
            return await codexBot.sendMessage(msg.chat.id, "❌ Sorry, The number of people must be a positive number or smaller than 25 (/ rain 100 CDEX to 24)", { parse_mode: "HTML" });
        }
        const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
        if (isValid === 'OKAY') {
            let listUser = [];
            let result = undefined;
            result = await rainTokenPerDay(msg.from.id, params[0] * 1, params[3] * 1, params[1]);
            if (result.error !== '') {
                await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Rain: ${result.error}` )
                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot make it rain now. Please try in a minute");
            } 
            listUser = result.listUsers;
            let rainMsg = '';
            if (!listUser.length) {
                return await codexBot.sendMessage(msg.chat.id, "<b> WE DO NOT HAVE ANY LUCKY PEOPLE TODAY. BETTER LUCK NEXT TIME</b>\n\n" +
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
        await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Rain: ${err.stack}`)
    }

});


/**
 * Rain token for specific room
 */

codexBot.onText(/\/raintothisroom (.+)/, async (msg, match) => {
    try {
        const params = match[1].split(' ');

        //Check valid syntax
        if(isNaN(params[0])) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, need amount of token for rain i.e: / raintothisroom 100 CDEX to 24');
        } else if(!params[1]) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, You need to include the symbol you are sending i.e: / rain 100 CDEX to 24');
        }
        const validSymbol = checkTokenSymbol(params[1])
        if (!isNaN(params[1]) || params[1] !== validSymbol) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Sorry, You need to include the symbol you are sending i.e: / raintothisroom 100 CDEX to 24');
        } else if(!isNaN(params[2])) {
            return await codexBot.sendMessage(msg.chat.id, '❌ Kindly check the format of this command: / raintothisroom 100 CDEX to 24');
        }
        if (isNaN(params[3]) || (params[3] * 1) < 0 || (params[3]*1) > 25 ) {
            return await codexBot.sendMessage(msg.chat.id, "❌ Sorry, The number of people must be a positive number or smaller than 25 (/ raintothisroom 100 CDEX to 24)", { parse_mode: "HTML" });
        }
        const isValid = await botCheckValid(msg.chat.id, msg.from.id, params[0], params[1]);
        if (isValid === 'OKAY') {
            let listUser = [];
            let result = undefined;
            result = await rainTokenOnRoom(msg.chat.id, msg.from.id, params[0] * 1, params[3] * 1, params[1]);
            if (result.error !== '' && result.error!== undefined) {
                await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Rain in room ${msg.chat.username}: ${result.error}`)
                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot make it rain now. Please try in a minute");
            } 
            listUser = result.listUsers;
            let rainMsg = '';
            if (!listUser.length) {
                return await codexBot.sendMessage(msg.chat.id, "<b> WE DO NOT HAVE ANY LUCKY PEOPLE TODAY. BETTER LUCK NEXT TIME</b>\n\n" +
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
        await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Rain in room ${msg.chat.username}: ${err.stack}`)
    }

});

/**
 * Rewards perweek
 */

codexBot.onText(/\/rewards (.+)/, async (msg, match) => {
    try {
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
    } catch(err) {

    }

});

/**
 * HTMLcoin volume
 */
codexBot.onText(/\/volumeonbot/, async (msg) => {
    try {
        const admin = await codexBot.getChatMember(msg.chat.id, msg.from.id);

        if (admin.status === 'administrator' || admin.status === 'creator') {
            const imgHTML = await drawHtmlVolume();
            await codexBot.sendPhoto(msg.chat.id, imgHTML);
        }
        else {
            await codexBot.sendMessage(msg.from.id, "<b>Sorry the function is only for admin</b>", { parse_mode: "HTML" });
        }
    } catch (err) {

    }

});

/**
 * Rain token for VIPs
 */
codexBot.onText(/\/raintoallVIPs (.+)/, async (msg, match) => {

    try {
        const params = match[1].split(' ');
        let result = {};
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
                await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Rain to VIPs: ${result.error}`)

                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot make it rain to VIPs now. Please try in a minute");
            } else {
                return await codexBot.sendMessage(msg.chat.id, "WE HAVE JUST MADE IT RAIN TOKENS TO VIPs. KINDLY CHECK YOUR WALLET");
            }
        } else if (isValid === 'NOT ENOUGH') {
            await codexBot.sendMessage(msg.chat.id, "<b>Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }

    } catch(err) {
        await codexBot.sendMessage(msg.from.id, "❌ Opps!! Something went wrong let try again in a minute " + `${err}`, { parse_mode: "HTML" });
    }

});

/**
 * Send token for VIPs
 */
codexBot.onText(/\/sendtoallVIPs (.+)/, async (msg, match) => {

    try {
        const params = match[1].split(' ');
        let result = true;
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
                await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Send token to VIPs`)

                return await codexBot.sendMessage(msg.chat.id, "❌ Opps!! Cannot send tokens to VIPs now. Please try in a minute");
            } else {
                return await codexBot.sendMessage(msg.chat.id, "WE HAVE JUST SENT TOKENS TO VIP USERS. KINDLY CHECK YOUR WALLETS");
            }
        }else if (isValid === 'NOT ENOUGH') {
            await codexBot.sendMessage(msg.chat.id, "<b> Sorry, You do not have enough balance </b>", { parse_mode: "HTML" });
        }

    } catch(err) {
        await codexBot.sendMessage(msg.from.id, "❌ Opps!! Something went wrong let try again in a minute " + `${err}`, { parse_mode: "HTML" });

    }

});



/**
 * Handle polling question
 */
codexBot.on("callback_query", async  (msg) => {
    try {
        const choice = msg.data;

        await codexBot.deleteMessage(msg.message.chat.id, msg.message.message_id);
        if (choice === "4") {
            const vipWallet = getAddress(msg.from.id);
            if(vipWallet === ''){
                return await codexBot.sendMessage(msg.from.id, '⚠️Your address does not exist');
            }
            const isVip = getVip(`${vipWallet}`)


            if (!isEmpty(isVip)) {
                return await codexBot.sendMessage(msg.from.id, '⚠️You are already a VIP');
            }
            const codex =  checkCDEX(msg.from.id);
            // const vipPrice = getVIPPrice()
            if(!codex.hasError) {
                const opts = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: "YES", callback_data: "8" }, { text: "NO", callback_data: "9" }]]
                    },
                    parse_mode: "Markdown"
                };
                
                await codexBot.sendMessage(msg.from.id, "This function will deduct " +`${codex.token}`+" ‘CDEX’ from your wallet. This is a one time charge to be VIP for life! *These tokens are unretrievable*\nDo you want to continue?", opts);
            }
            else {
                await codexBot.sendMessage(msg.from.id, '⚠️You must have greater than ' + `${codex.token} CDEX`);
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
        } else if(choice === "8") {
            const address = getAddress(msg.from.id);
            const vipPrice =  getVIPPrice()

            const result = await sendToken(msg.from.id, vipPrice , AIRDROP_ADDRESS, "CDEX");
            if (result.error === '') {
                await codexBot.sendMessage(msg.message.chat.id, "🎉🎉Congratulations! You are now a Lifetime VIP member🎉🎉\n" +
                                                                "Kindly press <b>VIP menu</b> button to see more information", {parse_mode:"HTML"});
                
                saveVipMember(`${address}`)

                // const newVip = {
                //     public_key: `${address}`,
                //     last_time:  Math.floor(Date.now() / 1000)
                // }
                // await VIP.create(newVip)
            }
            else {
                await codexBot.sendMessage(msg.message.chat.id, 'Oops⁉️ Something is error');
                await codexBot.sendMessage(BOT_ERROR, `[@${msg.from.username}] Make VIP is error:${result.error}`);
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
            const address = getAddress(msg.from.id);

            const vip =  getVip(`${address}`)

            if (isValidAirDrop(msg.message.date, vip)) {
                const amountAirdrop = getLuckyAirdrop(msg.from.id);
                const result = await sendToken(AIRDROP_ID, amountAirdrop, address, "CDEX");
        
                if (result.error === '') {
                    await codexBot.sendMessage(msg.from.id, '🎉🎉🎉You just received <b>' + `${amountAirdrop}`+' CDEX </b>', {parse_mode: "HTML"});
                                   
                    const airDropTime = Math.floor(Date.now() / 1000);

                    CodexVIP.set(`${address}`, airDropTime);     
                    //HTMLcoin volume
                    addVolume(parserDate(), 1);
                }
                else {
                    await codexBot.sendMessage(msg.from.id,'⁉️'+ `${result.error}`);
                }
            }
            else {
                const miliseconds = TIME_AIRDROP - (new Date(msg.message.date).getTime() - new Date(vip).getTime());
                const timeLeft = convertTime(miliseconds*1000);
                await codexBot.sendMessage(msg.from.id, "⚠️Please wait: <b>" + `${timeLeft}` + "</b> to get airdrop again! ", {parse_mode: "HTML"});
            }
        }
    } catch(err) {
        if(err !== 'ReferenceError: a is not defined')
        {
            // await codexBot.sendMessage(BOT_ERROR, `System: ${err}`)
        }
    }
});
