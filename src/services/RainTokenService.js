'use strict';
const { isEmpty } = require('lodash');

const {
    CodexWallet,
} = require('./StorageService');

const {
    sendToken
} = require('./TokenService');

const {
    getAddress
 }= require('./AddressService');


const RainToken = new Map();

const { chartCanvas } = require('../utils/VisualizeData');

const Roll = require('roll');
const roll = new Roll();

const addAmount = (telegramId, username, tokens) => {
    //Check user exist or not on RainToken
    const amount = RainToken.get(`${telegramId}`);
    if (amount === undefined){
        RainToken.set(`${telegramId}`, {name: username, volume: tokens});
    }
    else {
        RainToken.set(`${telegramId}`, { name: username, volume: tokens + amount});
    }
};

const resetAll = () => {
    for (const userId of RainToken.keys()) {
        RainToken.set(userId, 0);
    }
};
/**
 * Ref: https://www.geeksforgeeks.org/distribute-n-candies-among-k-people/
 */
const distributeTokens = (tokens, people) => {
    // Count number of complete turns 
    let count = 0;
    // Stores the number of candies 
    let arr = new Array(people).fill(0);

    let low = 0, high = tokens;
    // Do a binary search to find the number whose 
    // sum is less than N. 
    while (low <= high) {
        // Get mide 
        let mid = (low + high) >> 1;
        let sum = (mid * (mid + 1)) >> 1;
        // If sum is below N 
        if (sum <= tokens) {

            // Find number of complete turns 
            count = parseInt(mid / people);
            // Right halve 
            low = mid + 1;
        }
        else {

            // Left halve 
            high = mid - 1;
        }
    }
    // Last term of last complete series 
    let last = (count * people);

    // Subtract the sum till 
    tokens -= parseInt((last * (last + 1)) / 2);

    let i = 0;
    // First term of incomplete series 
    let term = (count * people) + 1;

    while (tokens) {
        if (term <= tokens) {
            arr[i++] = term;
            tokens -= term;
            term++;
        }
        else {
            arr[i] += tokens;
            tokens = 0;
        }
    }
    // Count the total candies 
    for (i = 0; i < people; i++) {
        arr[i] += (count * (i + 1)) + parseInt(people * (count * (count - 1)) / 2);
    }
    return arr;
} 

const rainTokenPerDay = async (ownerId, volumeTokens, people, symbol) => {
    const userIds = [];
    const listUsers = [];
    const totalUsers = CodexWallet.size;

    const payouts = distributeTokens(volumeTokens, people);
    const realPayouts = payouts.filter(token => token > 0);

    const usersReceive = [...CodexWallet.entries()];
    //Rolling dice
    let ind = 0;
    while (!isEmpty(realPayouts)){
        let oneDie = roll.roll('d' + `${totalUsers}`);
        let isExist = userIds.filter(userId => userId === usersReceive[oneDie.result-1][0]);
        if (isEmpty(isExist) && usersReceive[oneDie.result - 1][1]['name'] !== 'CodexWalletBot') {
            listUsers.push({ name: usersReceive[oneDie.result - 1][1]['name'], volume: realPayouts.pop()})
            userIds.push(usersReceive[oneDie.result-1][0]);
            ind++;
        }
        if( ind >= (totalUsers - 1)){
            break;
        }
    }
    //Store & Send token to user
    for (const userId in userIds) {
        addAmount(userIds[userId], listUsers[userId]['name'], listUsers[userId]['volume']);
        await sendToken(`${ownerId}`, listUsers[userId]['volume'], getAddress(`${userIds[userId]}`), `${symbol}`);
    }
    return listUsers;
};

const rewardsPerWeek = async () => {
    // RainToken.set('634115554', { name: 'test', volume: 3});
    // RainToken.set('634105555',  { name: 'test2', volume: 6});
    // RainToken.set('634105558', 10);
    // RainToken.set('634105559', 100);
    // RainToken.set('634105569', 99);
    // RainToken.set('634105566', 120);
    // RainToken.set('634105567', 110);
    // RainToken.set('634105577', 325);
    // RainToken.set('634105467', 35);
    // RainToken.set('634105554', 345);
    const totalUsers = RainToken.size;
    const arrayRainToken = [...RainToken.entries()];

    arrayRainToken.sort( (a, b) => {
        return b[1] - a[1];
    });
    const width = 1500;
    const height = 1000;
    // Get top ten
    const userId = [];
    const volume = [];
    for(const user of arrayRainToken) {
        userId.push(user[1]['name']);
        volume.push(user[1]['volume']);
    }
    const imageRainToken = await chartCanvas(width, height, 'Top received tokens', userId, volume, 'bar');
    //send Token
    const topUser = totalUsers >= 3 ? 3: totalUsers;
    const prize = [500, 300 , 100];
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

module.exports = {
    rainTokenPerDay,
    rewardsPerWeek,
}