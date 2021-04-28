'use strict';
const {
    parserDate
} = require('../utils/DateParser');

const { chartCanvas } = require('../utils/VisualizeData');
const { getTransaction } = require('./TokenService');
const Roll = require('roll');

const roll = new Roll();
const AirdopLog = new Map();


const buildViewTrxFile = (trxId, time, direction, from, to, amount) => {

};
const viewTransaction = async (telegramId) => {
    const trxLog = await getTransaction(telegramId);
    console.log(trxLog);
    // for (const trx of trxLog) {
    //     console.log(trx);
    // }
};

const addAirdropLog = (telegramId, amount) => {
    const day = parserDate();
    const airDrop = AirdopLog.get(`${telegramId}`);

    if (airDrop)
    {
        airDrop.push({ days: day, amounts: amount });
        if (airDrop.length >= 7) {
            airDrop.shift();
            airDrop.push({ days: day, amounts: amount });
        }
    }
    else
    {
        AirdopLog.set(`${telegramId}`, [{ days: day, amounts: amount }]);
    }
}
const getLuckyAirdrop = (telegramId) => {
    const oneDie = roll.roll('5d20');
    addAirdropLog(telegramId, oneDie.result);
    return oneDie.result;
}

const airdropLog = async (telegramId) => {
    const airDropUser = AirdopLog.get(`${telegramId}`);
    const width = 1500;
    const height = 1000;

    const date = [];
    const volume = [];
    if (airDropUser !== undefined) {
        for (const airDrop of airDropUser) {
            date.push(airDrop['days']);
            volume.push(airDrop['amounts']);
        }
        return await chartCanvas(width, height, 'Airdrop Log', date, volume, 'line');
    }
    return false;
}

module.exports = {
    airdropLog,
    getLuckyAirdrop
}