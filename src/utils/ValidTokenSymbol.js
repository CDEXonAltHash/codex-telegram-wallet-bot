const tokenSymbols = ['HTML', 'BUNK', 'CDEX', 'MAG', 'ASW', 'BIFD', 'BIFF', 'YMA', 'LAC','SFUN','COOP','BURQ','BIFP', 'VCTR', 'BIFG', 'TRS', 'BFCC', 'PHO', 'JUL', 'HOLY', 'BCDX', 'Roy', 'KKC', 'RAIN', 'LOVE', 'BBCT', 'SMILE','ABLE', 'EDUC', 'BBCT', 'WLK', 'PEPE', 'FAT']


const checkTokenSymbol = (symbol) => {
    for( const item of tokenSymbols) {
        if (item === symbol) {
            return symbol;
        }
    }
    const lowerSymbol = symbol.toLowerCase();
    let result = '';
    for (const item of tokenSymbols) {
        let lowerItem = item.toLowerCase();
        if(0 <= lowerItem.indexOf(lowerSymbol)) {
            result += item + ', ';
        }
        
    }
    return result;
}

const addTokens = (symbol) => {
    tokenSymbols.push(`${symbol}`)
}


const validBalance = (info, symbol, amount) => {
    const html = info.balance;

    const hrc20 = info.hrc20;
    let isValid = true;
    // if (isFloat(amount * Math.pow(10, 8))) {
    //     isValid = false;
    // }
    //TODO remove hard code
    if (html < 1.001) {
        isValid = false;
    }
    else if(symbol === 'HTML') {
        if(amount >  html){
            isValid = false;
        }
    }
    else {
        for (const token of hrc20) {
            if (token.contract.symbol === symbol){
                isValid = amount <= (token.amount / Math.pow(10, token.contract.decimals)) ? true : false;
                break;
            } else {
                isValid = false
            }
        }

    }
    return isValid;
}
const getCDEXBalance = (info) => {
    const html = info.balance;

    const hrc20 = info.hrc20;

    let amount = {
        html: 0,
        cdex: 0
    }
    //TODO remove hard code
    if (html < 1.001) {
       return amount;
    }
    amount.html = html
    
    for (const token of hrc20) {
        if (token.contract.symbol === "CDEX"){
            amount.cdex =  token.amount / Math.pow(10, token.contract.decimals);
            break;
        }
           
    }
    return amount;
}


module.exports = {
    checkTokenSymbol,
    validBalance,
    addTokens,
    getCDEXBalance
};