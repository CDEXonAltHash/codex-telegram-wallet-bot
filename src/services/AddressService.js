'use strict';
const webWallet = require('../libs/web-wallet');
const {isEmpty} = require('lodash');
const {
    CodexWallet,
    CodexVIP,
    saveVip
} = require('./StorageService');
// const { VIP } = require('../../db/models')

const VIP_PRICE = 100000

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

const saveVipMember = (publicAddress) => {
        const airDropTime = Math.floor(Date.now() / 1000);
        CodexVIP.set(`${publicAddress}`, airDropTime);
        saveVip({
            publicAddress: `${publicAddress}`,
            airDropTime: airDropTime
        });
}

const getVip = (publicAddress) => {
        const vip = CodexVIP.get(`${publicAddress}`);
        return  vip;
}

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

        CodexWallet.set(`${telegramId}`, { name: username, wallet: wallet });
    }
    catch (e) {
        return false;
    }
    return true;
};

const getVIPPrice = (totalAmount) => {
    console.log(`VIP Price: ${tot}`)
    const totalVips = CodexVIP.size
    let price = VIP_PRICE
    if(totalVips < 100 ) {
        return (totalAmount >= VIP_PRICE) ? price * 0.5: price
    }
    let mul = totalVips/100
    if(!mul.isInteger) {
        mul = Math.trunc(mul)
    } 
    price = (mul-1)*500 + VIP_PRICE

    if(totalAmount >= VIP_PRICE) {
        price = price*0.5
    }
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
    getVIPPrice,
    saveVipMember,
    getVip
};