const {
    queue
} = require('./initBot');

const {isEmpty} = require('lodash')
const {
    sendToken,
    getBalance
} = require('./TokenService');

const handleJobQueue =  async ( data, done ) => {
    let htmlbalanceunconfrim = 0
    try {
        if(!isEmpty(data)) {
            while(htmlbalanceunconfrim <  0) {
                let balance = await getBalance(ownerId);
                let unconfirmedBalance = balance.unconfirmedBalance;
                htmlbalanceunconfrim = unconfirmedBalance.toString().split('.');
            }
            await sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
        }
    } catch(err) {

    }
    // .then((data) => {})
    // .catch(err => console.log(err))
    done();
};


queue.process('rain', async (job, done) => {
    await handleJobQueue(job.data, done);
    done();
});

