const month = ['JAN', 'FEB', 'MAR', 'APR', 'MAY','JUN', 'JUL', 'AUG', 'SEP','OCT','NOV','DEC'];
const parserDate = () => {
    const datetime = new Date();
    return month[datetime.getMonth()] + " " + datetime.getDate();
};

module.exports = {
    parserDate
}