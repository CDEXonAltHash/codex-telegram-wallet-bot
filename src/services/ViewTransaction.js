'use strict';

const { getTransaction } = require('./TokenService');

const buildViewTrxFile = (trxId, time, direction, from, to, amount) => {

};
const viewTransaction = async (telegramId) => {
    const trxLog = await getTransaction(telegramId);
    console.log(trxLog);
    // for (const trx of trxLog) {
    //     console.log(trx);
    // }
};



module.exports = {
    viewTransaction
}