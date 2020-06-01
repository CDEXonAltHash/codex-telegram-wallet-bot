const tokenSymbols = ['HTML', 'BUNK', 'CDEX', 'XOLA', 'MAG', 'ASW', 'BIFD', 'BIFF', 'YMA', 'LAC', 'SFUN', 'COOP',

                       'BIFP', 'VCTR', 'BIFG', , 'TRS', 'BFCC', 'PHO', 'JUL', 'HOLY', 'BCDX', 'Roy', 'KKC', 'RAIN', 'LOVE', 'BBCT', 'SMILE',
                    'ABLE', 'EDUC', 'BBCT', 'WLK' ]


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

const isFloat = (n) => {
    return !(n % 1 === 0);
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
            if (token.symbol === symbol){
                isValid = amount <= (token.amount / Math.pow(10, token.decimals)) ? true : false;
                break;
            } else {
                isValid = false
            }
        }

    }
    return isValid;
}

module.exports = {
    checkTokenSymbol,
    validBalance
};