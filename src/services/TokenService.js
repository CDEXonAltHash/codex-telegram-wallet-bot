'use strict';
const hrc20 = require('../libs/hrc20');
const { getCustomWallet, getVip } = require('./AddressService');

const tokenInfo = {
    symbol: 'HTML',
    addTokenDecimals: 8,
    gasPrice: '40',
    gasLimit: '2500000',
    fee: '0.01',
};
const sendToken = async (telegramId, amount, toAddress, symbol) => {
    const wallet = getCustomWallet(telegramId);
    let rawTx;
    try {
        if (symbol === tokenInfo.symbol) {
            rawTx = await wallet.generateTx(toAddress, amount, tokenInfo.fee)
        } else if (hrc20.checkSymbol(symbol)) {
            const token = hrc20.getTokenBySymbol(symbol)
            const encodedData = hrc20.encodeSendData(token, toAddress, amount)
            rawTx = await wallet.generateSendToContractTx(token.address, encodedData, tokenInfo.gasLimit, tokenInfo.gasPrice, tokenInfo.fee)
        }
        const trxId = await wallet.sendRawTx(rawTx);
        return {
            error: '',
            trxId: trxId,
        }
    } catch (err) {
        return {
            error: `${err}`,
        }
    }
};

const getBalance = async (telegramId) => { 
    const wallet = getCustomWallet(telegramId);
    if (wallet !=='')
    {
        await wallet.setInfo(); 
        await wallet.setHrc20();
    }
    return (wallet !== '') ? wallet.info : '';
};

const getTransaction = async(telegramId) => {
    const wallet = getCustomWallet(telegramId);
    if (wallet !== '') {
        await wallet.setTxList()
    }
    return (wallet !== '') ? wallet.txList.txs : '';
}

const checkVip = (telegramId) => {
    const vip = getVip(telegramId);
    if(vip !==''){
        return true;
    }
    return false;
};

const checkCDEX = (telegramId) => {
    const wallet = getCustomWallet(telegramId);
    const hrc20Coin = wallet.info.hrc20;
    const tokenAmount = 50000;
    for (const token of hrc20Coin) {
        if (token.contract.symbol === 'CDEX' && tokenAmount <= (token.amount / Math.pow(10, token.contract.decimals))) {
            return true;
        }
    }
    return false;
};


module.exports =  {
    sendToken,
    getBalance,
    checkCDEX,
    checkVip,
    getTransaction
};