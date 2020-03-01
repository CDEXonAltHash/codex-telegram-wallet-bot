const {
    queue
} = require('./initBot');

const {isEmpty} = require('lodash')
const {
    sendToken,
    getBalance
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

let task = 0

queue.process('rain', async (job, done) => {

    await handleJobQueue(job.data, done);
    console.log(task++)
    done();
});

