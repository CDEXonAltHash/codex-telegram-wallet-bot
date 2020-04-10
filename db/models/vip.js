const mongoose = require('mongoose')

const { Schema } = mongoose

const vipSchema = new Schema({
    public_key: { type: String, required: true },
    last_time: { type: Number }
},
{
    timestamps: true
}
)
module.exports = mongoose.model('Vip', vipSchema)
