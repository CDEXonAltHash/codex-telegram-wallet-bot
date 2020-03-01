const {
    queue
} = require('./initBot');

const {isEmpty} = require('lodash')
const {
    sendToken,
    getBalance
} = require('./TokenService');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const handleJobQueue =  async ( data, done ) => {
    try {
        if(!isEmpty(data)) {

            await sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
        }
    } catch(err) {

    }
    // .then((data) => {})
    // .catch(err => console.log(err))
    done();
};


queue.process('rain', async (job, done) => {
    let balance = await getBalance(`${job.data.from}`);
    let unconfirmedBalance = balance.unconfirmedBalance;
    let htmlbalanceunconfrim = unconfirmedBalance.toString().split('.');
    if((htmlbalanceunconfrim[0])*1 <= -32 ) {
       await sleep(300000)
    }
    await handleJobQueue(job.data, done);
    done();
});

