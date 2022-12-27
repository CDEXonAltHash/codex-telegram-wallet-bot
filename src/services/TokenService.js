'use strict';
const hrc20 = require('../libs/hrc20');
const { getCustomWallet, getVip, getVIPPrice } = require('./AddressService');

const tokenInfo = {
    symbol: 'HTML',
    addTokenDecimals: 8,
    gasPrice: '40',
    gasLimit: '5000000',
    fee: '0.05',
};
const sendToken = async (telegramId, amount, toAddress, symbol) => {

    try {
        const wallet = getCustomWallet(telegramId);
        if(wallet === '') {
            return {
                error: 'Kindly setup your wallet first'
            }
        }
        let rawTx;
        if (symbol === tokenInfo.symbol) {
            rawTx = await wallet.generateTx(toAddress, amount, tokenInfo.fee)
        } else if (await hrc20.checkSymbol(symbol)) {
            const token = await hrc20.getTokenBySymbol(symbol)
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
            error: `${JSON.stringify(err.response.data)}`,
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

const checkVip = async (telegramId) => {
    const vip = await getVip(telegramId);
    if(vip !==''){
        return true;
    }
    return false;
};

const checkCDEX =  async (telegramId) => {
    let error = { hasError : false, token: 0}
    const wallet = getCustomWallet(telegramId);
    const hrc20Coin = wallet.info.hrc20;

    let html = wallet.info.balance
    for (const token of hrc20Coin) {
  
        if(token.contract.symbol === 'CDEX') {
            const totalAmount = (token.amount / Math.pow(10, token.contract.decimals))
            html = await getVIPPrice(totalAmount);
            break
        }
    }
    error.token = html
    return error;
};


module.exports =  {
    sendToken,
    getBalance,
    checkCDEX,
    checkVip,
    getTransaction
};
