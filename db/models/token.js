const mongoose = require('mongoose')

const { Schema } = mongoose

const tokenSchema = new Schema({
    name: { type: String, required: true, trim: true },
    symbol: { type: String, required: true, unique: true, trim: true },
    address: { type: String, required: true, unique: true, trim: true},
    decimals: { type: Number, default: 0},
    total_supply: { type: Number, default: 0},
},
{
    timestamps: true
}
)
module.exports = mongoose.model('Token', tokenSchema)
