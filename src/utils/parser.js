const TRX_FEE = 1.01;
const TIME_EXPIRED_OFFER = 43200; //12 hours
const TIME_AIRDROP = 86400;
/**
 * @param input will be a string has format: 
 * "#autosell number1 token1 for number2 token2 #autosell number3 token1 for number4 token3 "
 */
const parseCommandTrading = (input) => {
    const command_trading = [];
    const array_command = input.split('#');
    for(item of array_command) {
        if(item) {
            const trading = item.split(' ');
            command_trading.push({
                type: trading[0],
                ownAmount: getVal(trading[1]),
                ownToken: trading[2],
                exchangeAmount: getVal(trading[4]),
                exchangeToken: trading[5]
            })
        }
    }
    return command_trading;
}
const getVal = (val) => {
    try{
        multiplier = val.substr(-1).toLowerCase();
        if (multiplier == "k")
            return parseFloat(val) * 1000;
        else if (multiplier == "m")
            return parseFloat(val) * 1000000;
        else
            return val;
    }
    catch {

    }
}
const validToken = (htmlCoin, hrc20Coin, tokenSymbol, tokenAmount) => {
    if (tokenSymbol === 'HTML'){
        if (tokenAmount + TRX_FEE <= htmlCoin.split(' ')[0]) {
            return 200;
        }
        else {
            return 201;
        }
    }
    else {
        for(token of hrc20Coin) {
            if (token.contract.symbol === tokenSymbol && tokenAmount <= (token.amount / Math.pow(10, token.contract.decimals))) {
                if (htmlCoin.split(' ')[0] >= TRX_FEE)
                {
                    return 200;
                }
                else {
                    return 201;
                }
            }
        }
        return 202;
    }
}


const isValidOffer = (timeOffer) => {
    const current = Math.floor(Date.now() / 1000);
    if (current - timeOffer >= TIME_EXPIRED_OFFER ) {
        return false;
    }
    return true;
}

const isValidAirDrop = (timeAirDrop, lastTimeAirdop) => {
    if (timeAirDrop - lastTimeAirdop > TIME_AIRDROP) {
        return true;
    }
    return false;
}
const convertTime = (duration) => {
    let milliseconds = Math.floor((duration % 1000) / 100)
    let seconds = Math.floor((duration / 1000) % 60)
    let minutes = Math.floor((duration / (1000 * 60)) % 60)
    let hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
    // // let days = Math.floor(t / (1000 * 60 * 60 * 24));
    // let hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    // let minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    // let seconds = Math.floor((duration % (1000 * 60)) / 1000);
    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

const validDecimals = (number) =>{
    let decimals = 0
    if(Math.floor(number) === number){
      decimals = 0
    }
    decimals =  number.toString().split(".")[1].length || 0
  
    return (decimals < 9) ? true: false
  }

module.exports = {
    TIME_AIRDROP,
    parseCommandTrading,
    validToken,
    isValidOffer,
    getVal,
    isValidAirDrop,
    convertTime,
    validDecimals
}