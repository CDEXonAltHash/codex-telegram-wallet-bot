const {
    queue
} = require('./initBot');

const {
    sendToken
} = require('./TokenService');

const handleJobQueue =  ( data, done ) => {
    try {
        sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
        .then((data) => {})
    } catch(err) {
        done(new Error(`${err.message}`));
    }
    done();
};


queue.process('rain', 25, async (job, done) => {
    console.log('Hande Data')
     handleJobQueue(job.data, done);
    done();
});

