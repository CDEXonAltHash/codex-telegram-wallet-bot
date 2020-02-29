const {
    queue
} = require('./initBot');

const sleep = require('sleep')
const {
    sendToken
} = require('./TokenService');

const handleJobQueue =  async ( data, done ) => {
    await sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)

    done();
};


queue.process('rain', async (job, done) => {
    await handleJobQueue(job.data, done);
    done();
});

