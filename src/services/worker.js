const {
    queue
} = require('./initBot');

const {isEmpty} = require('lodash')
const {
    sendToken
} = require('./TokenService');

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
    await handleJobQueue(job.data, done);
    done();
});

