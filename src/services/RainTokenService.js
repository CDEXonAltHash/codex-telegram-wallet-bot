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

const {
    AIRDROP_ID,
} = require('../config/Config');
const RainToken = new Map();

const Roll = require('roll');
const roll = new Roll();

const addAmount = (telegramId, tokens) => {
    //Check user exist or not on RainToken
    const amount = RainToken.get(`${telegramId}`);
    if (amount === undefined){
        RainToken.set(`${telegramId}`, tokens);
    }
    else {
        RainToken.set(`${telegramId}`, tokens + amount);
    }
};

const resetAll = () => {
    for (const userId of RainToken.keys()) {
        RainToken.set(userId, 0);
    }
};

const rainTokenService = async (minValue, maxValue) => {
    const payouts = [];
    const totalUsers = CodexWallet.size();
    const users = new Array(totalUsers);
    users.fill(1); // The use will be get minimum value is 1

    for(let i = minValue; i <= maxValue; i++){
        payouts.add(i);
    }
    let oneDie = 0;
    let index = 0;
    //Rolling dice
    while(!isEmpty(payouts)){
        oneDie = roll.roll('d' + `${totalUsers}`);
        if(users[oneDie] > 1) 
        {
            users[oneDie] = payouts.pop();
        }
    }

    //Store & Send token to user
    let toAddress = '';
    for (const userId of CodexWallet.keys()) {
        addAmount(userId, users[index]);
        toAddress = getAddress(userId);
        await sendToken(AIRDROP_ID, users[index], toAddress, 'CDEX');
        index++;
    }
};

const rewardsPerWeek = () => {
    const arrayRainToken = [...RainToken.entries()];

    arrayRainToken.sort( (a, b) => {
        return b[1] - a[1];
    });

    // Get top ten
    
    // Return top 3 winner
    resetAll();
};