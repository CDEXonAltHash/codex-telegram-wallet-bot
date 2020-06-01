const axios = require('axios')
const config = require('../config');

let domain = ''
switch (config.getNetwork()) {
  case 'testnet':
    domain = 'https://testnet.htmlcoin.com'
    break
  case 'mainnet':
    domain = 'http://146.71.78.84:7001'
    break
}
const apiPrefix = domain //+ '/api'

const _get = async url => {
  return (await axios.get(apiPrefix + url)).data
}

const _post = async (url, data) => {
  return (await axios.post(apiPrefix + url, data)).data
}

module.exports = {
  async getInfo(address) {
    return await _get(`/address/${address}`)
  },

  async getHrc20(address) {
    return await _get(`/address/${address}/balance`)
  },
  // /address/:address/hrc20-balance-history/:token
  async getTokenInfo(contractAddress) {
   return await _get(`/contract/${contractAddress}`)
 },
  
  async getTxList(address) {
    return await _get(`/address/${address}/txs`)//await _get(`/txs/?address=${address}`)
  },

  // async getUtxoList(address) {
  //   return (await _get(`/address/${address}/utxo`)).map(item => {
  //     return {
  //       address: item.address,
  //       txid: item.txid,
  //       confirmations: item.confirmations,
  //       isStake: item.isStake,
  //       amount: item.amount,
  //       value: item.satoshis,
  //       hash: item.txid,
  //       pos: item.vout
  //     }
  //   })
  // },
  async getUtxoList(address) {
    return (await _get(`/address/${address}/utxo`)).map(item => {
      return {
        address: item.address,
        txid: item.transactionId,
        confirmations: item.confirmations,
        isStake: item.isStake,
        amount: item.value,
        value: item.value,
        hash: item.transactionId,
        pos: item.outputIndex
      }
    })
  },

  async sendRawTx(rawTx) {
    return (await (_post('/tx/send',{ rawtx: rawTx })))
  },

  // async sendRawTx(rawTx) {
  //   return (await (_post('/tx/send', { rawtx: rawTx }))).id
  // },

  async fetchRawTx(txid) {
    return (await _get(`/raw-tx/${txid}`))
  },

  getTxExplorerUrl(tx) {
    return `${domain}/tx/${tx}`
  },

  getAddrExplorerUrl(addr) {
    return `${domain}/address/${addr}`
  },

  async callContract(address, encodedData) {
    return (await _get(`/contracts/${address}/call/?data=${encodedData}`))['executionResult']['output']
  },

}
