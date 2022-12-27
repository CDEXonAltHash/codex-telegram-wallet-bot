const abi = require('ethjs-abi');
const htmlcoin = require('htmlcoinjs-lib');
const { TOKEN } = require('../../db/models');

const addCustomToken = async(address, name, symbol, decimals, totalSupply = 0)=>{
  let result = 'Token is existed!';
  const isToken = await TOKEN.findOne({symbol});
  if(!isToken) {
    await TOKEN.create({
      address,
      name,
      symbol,
      decimals,
      total_supply: totalSupply
    })
    result = 'Successful';
  }
  return result;
};

const checkSymbol = async(symbol)=> {
  const isToken = await TOKEN.findOne({symbol});
  return isToken ? true : false;
};  

const getTokenBySymbol = async(symbol) => {
  const token = await TOKEN.findOne({symbol});
  return token;
}

module.exports = {
  addCustomToken,
  checkSymbol,
  getTokenBySymbol,
  encodeSendData(token, address, amount) {
    return 'a9059cbb' + abi.encodeParams(['address', 'uint256'], ['0x' + htmlcoin.address.fromBase58Check(address)['hash'].toString('hex'), amount * Math.pow(10, token.decimals)]).substr(2)
  }
}
