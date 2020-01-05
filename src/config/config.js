const { config } = require('dotenv')

config()

module.exports = {
    AIRDROP_ID: process.env.AIRDROP_ID,
    AIRDROP_ADDRESS: process.env.AIRDROP_ADDRESS,
    TELEGRAM_TOKEN: process.env.TELEGRAM_TOKEN,
    CODEX_CREDENTIAL: process.env.CODEX_CREDENTIAL,
    BOT_ERROR: process.env.BOT_ERROR
}