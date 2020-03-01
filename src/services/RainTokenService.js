'use strict';
const { isEmpty } = require('lodash');

const {
    CodexWallet,
    CodexVIP
} = require('./StorageService');

const {
    sendToken,
    getBalance
} = require('./TokenService');

const {
    getAddress
} = require('./AddressService');

const {
    codexBot,
    queue
} = require('./initBot');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const RainToken = new Map();

const { chartCanvas } = require('../utils/VisualizeData');

const Roll = require('roll');
const roll = new Roll();

const addAmount = (telegramId, username, tokens) => {
    //Check user exist or not on RainToken
    const amount = RainToken.get(`${telegramId}`);
    if (amount === undefined) {
        RainToken.set(`${telegramId}`, { name: username, volume: tokens });
    }
    else {
        RainToken.set(`${telegramId}`, { name: username, volume: tokens + amount });
    }
};

const resetAll = () => {
    for (const userId of RainToken.keys()) {
        RainToken.set(userId, 0);
    }
};

const distributeTokens = (tokens, people) => {
    if(people === 0) {
        return [];
    }
    let arr = new Array(people).fill(0)
    while (tokens > 0) {
        for (let i = 0; i < people; i++) {
            let a = Math.ceil(Math.random() * (tokens / people));
            tokens -= a;
            arr[i] += a;
        }
    }
    arr[people - 1] += ((tokens.toFixed(8)) * 1)
    return arr;
} 

const rainTokenPerDay = async (ownerId, volumeTokens, people, symbol) => {
    const listUsers = [];
    const totalUsers = CodexWallet.size;
    if(people > totalUsers - 2) {
        people = totalUsers - 2;
    }
    const payouts = distributeTokens(volumeTokens, people);
    const realPayouts = payouts.filter(token => token > 0);

    const usersReceive = [...CodexWallet.entries()];

    //Rolling dice
    let ind = 0;
    while (!isEmpty(realPayouts)) {
        let oneDie = roll.roll('d' + `${totalUsers}`);
        let isExist = listUsers.filter(user => user.userId === usersReceive[oneDie.result - 1][0]);
        if (((isEmpty(isExist) && usersReceive[oneDie.result - 1][1]['name'] !== 'CodexWalletBot'))
            && usersReceive[oneDie.result - 1][0] != ownerId) {
            listUsers.push({ userId: usersReceive[oneDie.result - 1][0], name: usersReceive[oneDie.result - 1][1]['name'], volume: realPayouts.pop() })
            ind++;
        }
        if (ind >= (totalUsers - 2)) {
            break;
        }
    }
    //Store & Send token to user
    let res = '';
    for (const user of listUsers) {
        addAmount(user.userId, user.name, user.volume);
        res = await sendToken(`${ownerId}`, user.volume, getAddress(`${user.userId}`), `${symbol}`);
        if (res.error!== ''){
            break;
        }
    }
    
    return {
        error: `${res.error}`,
        listUsers: listUsers
    };
};

const rainTokenOnRoom = async (chatId, ownerId, volumeTokens, people, symbol) => {
    const listUsers = [];
    const totalUsers = CodexWallet.size;
    if(people > totalUsers - 2) {
        people = totalUsers - 2;
    }
    const payouts = distributeTokens(volumeTokens, people);
    const realPayouts = payouts.filter(token => token > 0);

    const usersReceive = [...CodexWallet.entries()];

    //Rolling dice
    let ind = 0;
    while (!isEmpty(realPayouts)) {
        let oneDie = roll.roll('d' + `${totalUsers}`);
        let codexUser = usersReceive[oneDie.result - 1][0];
        let isExist = listUsers.filter(user => user.userId === codexUser);
        const member  = await codexBot.getChatMember(chatId, codexUser)

        if (isEmpty(isExist) && codexUser != ownerId) {
            if(member.status === 'creator' || member.status ===  'administrator' ||member.status === 'member' && member.user.is_bot === false) {
                listUsers.push({ userId: codexUser, name: usersReceive[oneDie.result - 1][1]['name'], volume: realPayouts.pop() })
            }
            ind++;
        }
        if (ind >= (totalUsers - 2)) {
            break;
        }
    }
    //Store & Send token to user
    let res = '';
    for (const user of listUsers) {
        addAmount(user.userId, user.name, user.volume);
        res = await sendToken(`${ownerId}`, user.volume, getAddress(`${user.userId}`), `${symbol}`);
        if (res.error!== ''){
            break;
        }
    }
    
    return {
        error: `${res.error}`,
        listUsers: listUsers
    };
};
const rewardsPerWeek = async () => {
    const totalUsers = RainToken.size;
    const arrayRainToken = [...RainToken.entries()];

    arrayRainToken.sort((a, b) => {
        return b[1] - a[1];
    });
    const width = 1500;
    const height = 1000;
    // Get top ten
    const userId = [];
    const volume = [];
    for (const user of arrayRainToken) {
        userId.push(user[1]['name']);
        volume.push(user[1]['volume']);
    }
    const imageRainToken = await chartCanvas(width, height, 'Top received tokens', userId, volume, 'bar');
    //send Token
    const topUser = totalUsers >= 3 ? 3 : totalUsers;
    const prize = [500, 300, 100];
    for (let i = 0; i < topUser; i++) {
        let toAddress = getAddress(arrayRainToken[i][0]);
        await sendToken(AIRDROP_ID, prize[i], toAddress, 'CDEX');
    }
    resetAll();
    return {
        imageRewards: imageRainToken,
        firstPrize: arrayRainToken[0][0],
        secondPrize: arrayRainToken[1][0],
        thirdPrize: arrayRainToken[2][0]
    }
};

const rainTokenForVip = async(ownerId, volumeTokens, symbol) => {
    let res = {hasError: false, error: ''};
    let totalVIPs = CodexVIP.size - 1;
    if(totalVIPs === 0) {
        res.hasError = true;
        res.error = 'We do not any VIPs member for make it rain'
        return res;
    }
    const payouts = distributeTokens(volumeTokens, people);
    const realPayouts = payouts.filter(token => token > 0);

    const usersReceive = [...CodexVIP.entries()];
    let address = getAddress(`${ownerId}`)
    let listVIP = [];

    //Rolling dice
    for(const vip of usersReceive) {
        let oneDie = roll.roll('d' + `${totalUsers}`);
        let codexUser = usersReceive[oneDie.result - 1][0];
        let isExist = listUsers.filter(user => user.userId === codexUser);

        if ((isEmpty(isExist) && codexUser !== address)) {
            listVIP.push({ userId: codexUser, volume: realPayouts.pop() })
        }
    }
    totalVIPs = 0
    //Store & Send token to user
    for (const user of listVIP) {
        if(totalVIPs > 15) {
            await sleep(180000)
            totalVIPs = 0
        }
        await sendToken(`${ownerId}`, user.volume, `${user.userId}`, `${symbol}`);

        // queue.create("rain", {
        //     from: `${ownerId}`,
        //     volume: user.volume,
        //     to: `${user.userId}`,
        //     symbol: `${symbol}`
        // })
        // .removeOnComplete(true)
        // .save()

        totalVIPs++

    }

    return res;
};

const sendTokenToVip = async(ownerId, volumeTokens, symbol) => {
    const listVIP = [];
    let totalVIPs = 0;

    const usersReceive = [...CodexVIP.entries()];
    let address = getAddress(`${ownerId}`)

    //Rolling dice
    for(const vip of usersReceive) {
        let isExist = listVIP.filter(user => user.userId === vip[0]);
        if ((isEmpty(isExist) && vip[0] != address)) {
            listVIP.push({ userId: vip[0], volume: volumeTokens })
        }
    }


    //Store & Send token to user
    // let res = '';

    for (const user of listVIP) {
        
        if(totalVIPs > 24) {
            await sleep(180000)
            totalVIPs = 0
        }
        addAmount(user.userId, user.name, user.volume);
        await sendToken(`${ownerId}`, user.volume, `${user.userId}`, `${symbol}`);

        // queue.create("rain", {
        //     from: `${ownerId}`,
        //     volume: user.volume,
        //     to: `${user.userId}`,
        //     symbol: `${symbol}`
        // })
        // .removeOnComplete(true)
        // .save()

        totalVIPs++
    }
    return false;
};

module.exports = {
    rainTokenPerDay,
    rewardsPerWeek,
    rainTokenForVip,
    sendTokenToVip,
    rainTokenOnRoom
}
