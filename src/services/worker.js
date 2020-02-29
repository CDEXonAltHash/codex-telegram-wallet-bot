const {
    queue
} = require('./initBot');

const sleep = require('sleep')
const {
    sendToken
} = require('./TokenService');

const handleJobQueue =  ( data, done ) => {
    sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
    .then((data) => {})
    .catch(err => console.log(err))
   
    sleep.sleep(5)
    done();
};


queue.process('rain', async (job, done) => {
    handleJobQueue(job.data, done);
    done();
});

