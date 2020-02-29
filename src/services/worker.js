const {
    queue
} = require('./initBot');

const sleep = require('sleep')
const {
    sendToken
} = require('./TokenService');

const handleJobQueue =  ( data, done ) => {
    console.log(`Send token to VIP: ${data.from}, ${data.to}`)
    sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
    .then((data) => {})
    .catch(err => console.log(err))
    sleep(5)
    done();
};


queue.process('rain',5, async (job, done) => {
    console.log('Handle queue:', job.data)
    handleJobQueue(job.data, done);
    done();
});

