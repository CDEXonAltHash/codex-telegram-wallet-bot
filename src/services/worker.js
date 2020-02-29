const {
    queue
} = require('./initBot');

const {
    sendToken
} = require('./TokenService');

const handleJobQueue = async ( data, done ) => {
    try {
        await sendToken(`${data.from}`, data.volume, `${data.to}`, `${data.symbol}`)
    } catch(err) {
        done(new Error(`${err.message}`));
    }
    done();
};


queue.process('rain', 25, async (job, done) => {
    await handleJobQueue(job.data, done);
    done();
});

