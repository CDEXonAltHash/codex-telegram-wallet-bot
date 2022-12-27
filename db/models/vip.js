const mongoose = require('mongoose')

const { Schema } = mongoose

const vipSchema = new Schema({
    address: { type: String, required: true,unique: true },
    airDropTime: { type: Number },
    otp: { type: Number, index: true },
    isVerify: { type: Boolean, default: false }
},
{
    timestamps: true
}
)
module.exports = mongoose.model('Vip', vipSchema)
