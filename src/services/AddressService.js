'use strict';
const webWallet = require('../libs/web-wallet');
const {isEmpty} = require('lodash');
const {
    CodexWallet,
    CodexVIP,
    saveAccountToWallet,
    saveVip,
    saveAllVip
} = require('./StorageService');

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

const saveVipMember = (publicAddress) => {
    const airDropTime = Math.floor(Date.now() / 1000);
    console.log(`Save VIP: ${airDropTime}, ${publicAddress}`)
    CodexVIP.set(`${publicAddress}`, airDropTime);
    saveAllVip();
    console.log(`Codex VIP: ${CodexVIP}`)

};

const getCustomWallet = (telegramId) => {
    const customWallet = CodexWallet.get(`${telegramId}`);
    return (isEmpty(customWallet))? '' : customWallet['wallet'];
};

const getVip = (publicAddress) => {
    const vip = CodexVIP.get(`${publicAddress}`);
    return (isEmpty(vip)) ? '' : vip;
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
        if (getVip(wallet.getAddress())!=='')
        {
            wallet.setVIPMember();
            wallet.setHrc20();
            wallet.setInfo();
        }
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

const getVIPPrice = () => {
    const totalVips = CodexVIP.size
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
    getVip,
    saveVipMember,
    getVIPPrice
};