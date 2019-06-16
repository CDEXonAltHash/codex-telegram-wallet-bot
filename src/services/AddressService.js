'use strict';
const webWallet = require('../libs/web-wallet');
const {isEmpty} = require('lodash');
const {
    CodexWallet,
    CodexVIP,
    saveAccountToWallet,
    saveVip
} = require('./StorageService');

const generateAccount = () => {
    const wallet = webWallet.restoreFromMnemonic(webWallet.generateMnemonic(), Date.now());
    return {
        wallet: wallet,
        address: wallet.getAddress(),
        privKey: wallet.getPrivKey()
    };
};

const saveAccount =  (telegramId, wallet) => {
    CodexWallet.set(`${telegramId}`, wallet);
};

const saveVipMember = (publicAddress) => {
    const airDropTime = Math.floor(Date.now() / 1000);
    CodexVIP.set(`${publicAddress}`, airDropTime);
    saveVip({
        publicAddress: `${publicAddress}`,
        airDropTime: `${airDropTime}`,
    });
};

const getCustomWallet = (telegramId) => {
    const customWallet = CodexWallet.get(`${telegramId}`);
    return (isEmpty(customWallet))? '' : customWallet;
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

const restoreFromWIF =  (telegramId, privKey) => {
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
        }
        saveAccount(telegramId, wallet);
    }
    catch (e) {
        return false;
    }
    return true;
};

const changeFromWIF = (telegramId, privKey) => {
    const existAccount = CodexWallet.get(`${telegramId}`);
    if(existAccount === undefined){
        return false;
    }
    try {
        const wallet = webWallet.restoreFromWif(privKey);
        if (getVip(wallet.getAddress()) !== '') {
            wallet.setVIPMember();
        }
        CodexWallet.set(`${telegramId}`, wallet);
    }
    catch (e) {
        return false;
    }
    return true;
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
    saveVipMember
};