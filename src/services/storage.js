const keyFile = require('../libs/keyfile');
const webWallet = require('../libs/web-wallet');
const fs = require('fs');
const lineReader = require('line-reader');
const { CODEX_CREDENTIAL } = require('../config/config');

const userStoragePath = './codexWallet';

const CodexWallet = new Map();
const accountArray = fs.readFileSync(`${userStoragePath}`).toString().split('\n');
const saveAccountToWallet = (account) => {
    const encryptedAccount = keyFile.encode(JSON.stringify(account), CODEX_CREDENTIAL);
    fs.appendFileSync(userStoragePath, encryptedAccount + '\n');
};

const loadAccountFromFile =  () => {
    try{
        for (const line of accountArray) {
            if(line !='')
            {
                const decryptedAccount = keyFile.decode(line, CODEX_CREDENTIAL);
                const account = JSON.parse(decryptedAccount);
                const wallet = webWallet.restoreFromWif(`${account.privKey}`);
                wallet.setInfo().then(() => { });
                wallet.setHrc20().then(() => { });
                CodexWallet.set(`${account.telegramId}`, wallet);
            }
        }    }
    catch(e) {   
    }

};

module.exports = {
    CodexWallet,
    saveAccountToWallet,
    loadAccountFromFile,
}