'use strict';
const keyFile = require('../libs/keyfile');
const webWallet = require('../libs/web-wallet');
const fs = require('fs');
const { CODEX_CREDENTIAL } = require('../config/config');
const userStoragePath = './codexWallet';
const vipStoragePath = './codexVip';

const CodexWallet = new Map();
const CodexVIP = new Map();

const accountArray = fs.readFileSync(`${userStoragePath}`).toString().split('\n');
const vipArray = fs.readFileSync(`${vipStoragePath}`).toString().split('\n');

const saveAccountToWallet = (account) => {
    const encryptedAccount = keyFile.encode(JSON.stringify(account), CODEX_CREDENTIAL);
    fs.appendFileSync(userStoragePath, encryptedAccount + '\n');
};

const loadBotAccountFromFile =  () => {
    try{
        for (const line of accountArray) {
            if(line !='')
            {
                const decryptedAccount = keyFile.decode(line, CODEX_CREDENTIAL);
                const account = JSON.parse(decryptedAccount);
                const wallet = webWallet.restoreFromWif(`${account.privKey}`);
                wallet.setInfo().then(() => { });
                wallet.setHrc20().then(() => { });
                CodexWallet.set(`${account.telegramId}`,{name: account.name, wallet: wallet});
            }
        }
    }
    catch(e) {   
        console.log(e);
    }

};
const saveVip = (vip) => {
        fs.appendFileSync(vipStoragePath, JSON.stringify(vip) + '\n');
}

const loadVip = () => {
    try {
        for (const line of vipArray) {
            if (line != '') {
                const vip = JSON.parse(line);
                CodexVIP.set(`${vip.publicAddress}`, vip.airDropTime);
            }
        }
    }
    catch (e) {
        console.log(e)
    }
}

module.exports = {
    CodexWallet,
    CodexVIP,
    saveAccountToWallet,
    loadBotAccountFromFile,
    saveVip,
    loadVip
};