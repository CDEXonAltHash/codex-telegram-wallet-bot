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
    validBalance,
    getCDEXBalance
};