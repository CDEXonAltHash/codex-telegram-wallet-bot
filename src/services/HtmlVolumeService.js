const { chartCanvas } = require('../utils/VisualizeData');
const HtmlVolume = new Map();

const addVolume = (date, volume) => {
    const dayVolume = HtmlVolume.get(`${date}`);
    if(HtmlVolume.size > 7) {
        for (const html of HtmlVolume.keys()) {
            HtmlVolume.delete(html);
            break;
        }
    }
    if (dayVolume === undefined) {
        HtmlVolume.set(`${date}`, volume);
    }
    else {
        HtmlVolume.set(`${date}`, volume + dayVolume);
    }
}


const drawHtmlVolume = async () => {
    // HtmlVolume.set('JUN 20', 500);
    // HtmlVolume.set('JUN 21', 60);
    // HtmlVolume.set('JUN 22', 110);
    // HtmlVolume.set('JUN 23', 1000);
    // HtmlVolume.set('JUN 24', 9);
    // HtmlVolume.set('JUN 25', 10000);
    // HtmlVolume.set('JUN 26', 3455);

    const width = 1500;
    const height = 1000;

    const date = [];
    const volume = [];
    for (const html of HtmlVolume.keys()) {
        date.push(html);
    }
    for (const html of HtmlVolume.values()) {
        volume.push(html);
    }
    return await chartCanvas(width, height, 'HTMLcoin Volume', date, volume, 'line');
}


module.exports = {
    addVolume,
    drawHtmlVolume
}