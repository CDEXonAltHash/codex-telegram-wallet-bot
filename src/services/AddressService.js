'use strict';
const webWallet = require('../libs/web-wallet');
const {isEmpty} = require('lodash');
const {
    CodexWallet
} = require('./StorageService');
const { VIP } = require('../../db/models')

const VIP_PRICE = 60000

const generateAccount = () => {
    const wallet = webWallet.restoreFromMnemonic(webWallet.generateMnemonic(), Date.now());
    return {
        wallet: wallet,
        address: wallet.getAddress(),
        privKey: wallet.getPrivKey()
    };
};

const saveAccount =  (telegramId, username,  wallet) => {
    CodexWallet.set(`${telegramId}`, { name: username, wallet: wallet});
};



const getCustomWallet = (telegramId) => {
    const customWallet = CodexWallet.get(`${telegramId}`);
    return (isEmpty(customWallet))? '' : customWallet['wallet'];
};


const getAddress = (telegramId) => {
    const wallet = getCustomWallet(telegramId);

    return (wallet !== '') ? wallet.getAddress() : '';
};

const getPrivKey = (telegramId) => {
    const wallet = getCustomWallet(telegramId);
    return (wallet !== '') ? wallet.getPrivKey() : '';
};

const restoreFromWIF =  (telegramId, username, privKey) => {
    const address = getAddress(telegramId);
    if(address !== '')
    {
        return false;
    }
    try {
        const wallet = webWallet.restoreFromWif(privKey);
        wallet.setHrc20();
        wallet.setInfo();
        saveAccount(telegramId, username, wallet);
    }
    catch (e) {
        return false;
    }
    return true;
};

const changeFromWIF = (telegramId, username, privKey) => {
    const existAccount = CodexWallet.get(`${telegramId}`);
    if(existAccount === undefined){
        return false;
    }
    try {
        const wallet = webWallet.restoreFromWif(privKey);
        if (getVip(wallet.getAddress()) !== '') {
            wallet.setVIPMember();
        }
        CodexWallet.set(`${telegramId}`, { name: username, wallet: wallet });
    }
    catch (e) {
        return false;
    }
    return true;
};

const getVIPPrice = async () => {
    const vips = await VIP.find({})
    const totalVips = vips.length
    let price = VIP_PRICE
    if(totalVips < 100) {
        return price
    }
    let mul = totalVips/100
    if(!mul.isInteger) {
        mul = Math.trunc(mul)
    } 
    price = (mul-1)*500 + VIP_PRICE

    return price

};

module.exports = {
    generateAccount,
    saveAccount,
    getAddress,
    getPrivKey,
    getCustomWallet,
    restoreFromWIF,
    changeFromWIF,
    getVIPPrice
};