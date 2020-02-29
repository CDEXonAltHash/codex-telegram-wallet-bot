const {
    queue
} = require('./initBot');

const sleep = require('sleep')
const {
    sendToken
} = require('./TokenService');

let trxNumber = 0
const handleJobQueue =  async ( data, done ) => {
    await sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
    // .then((data) => {})
    // .catch(err => console.log(err))
    done();
};


queue.process('rain', async (job, done) => {
    trxNumber++ 
    if(trxNumber >= 25) {
        setInterval(() => {
        
        }, 60000);
        trxNumber = 0
    }

    await handleJobQueue(job.data, done);
    done();
});

