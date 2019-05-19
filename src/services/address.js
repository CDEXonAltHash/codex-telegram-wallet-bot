const webWallet = require('../libs/web-wallet');
const {
    CodexWallet,
    saveAccountToWallet,
} = require('./storage');

const generateAccount = () => {
    const wallet = webWallet.restoreFromMnemonic(webWallet.generateMnemonic(), Date.now());
    return {
        wallet: wallet,
        address: wallet.getAddress(),
        privKey: wallet.getPrivKey()
    };
};

const saveAccount = async (telegramId, wallet) => {
    CodexWallet.set(`${telegramId}`, wallet);
    saveAccountToWallet({
        telegramId: `${ telegramId }`,
        privKey: wallet.getPrivKey()
    });
};

const getCustomWallet = (telegramId) => {
    const customWallet = CodexWallet.get(`${telegramId}`);
    return (customWallet === undefined)? '' : customWallet;
}

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
    changeFromWIF
}