const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY','JUN', 'JUL', 'AUG', 'SEP','OCT','NOV','DEC'];
const parserDate = () => {
    const datetime = new Date();
    return month[datetime.getMonth()] + " " + datetime.getDate();
};

/**
 * Rain token per day 
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
module.exports = {
    parserDate,
    sleep
}