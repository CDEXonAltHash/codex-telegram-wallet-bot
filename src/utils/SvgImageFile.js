'use strict';
const svgToImg = require("svg-to-img");


const svgTemplate = (width, height) => {
    const svg =
        '<svg' +
        ' xmlns:dc="http://purl.org/dc/elements/1.1/"' +
        ' xmlns:cc="http://creativecommons.org/ns#"' +
        ' xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"' +
        ' xmlns:svg="http://www.w3.org/2000/svg"' +
        ' xmlns="http://www.w3.org/2000/svg"' +
        ' width=\"' + `${width}` + '\"' +
        ' height=\"' + `${height}` + '\"' +
        ' viewBox="0 0 ' + `${width}` + `${height}` + '\"' +
        ' id="svg2"' +
        ' version="1.1" >' +
        '   <defs' +
        ' id="defs4"/>' +
        ' <metadata' +
        ' id="metadata7">' +
        ' <rdf:RDF>' +
        ' <cc:Work' +
        ' rdf:about="">' +
        ' <dc:format>image/svg+xml</dc:format >' +
        ' <dc:type' +
        ' rdf:resource="http://purl.org/dc/dcmitype/StillImage" />' +
        '  <dc:title></dc:title >' +
        '  </cc:Work >' +
        '  </rdf:RDF >' +
        '  </metadata>' +
        ' <g' +
        '  id="layer1"' +
        '  transform="translate(0,-452.36216)">'
        ;
    return svg;
}

const buildSvgFile = (yCoordinate, tokenName, tokenValuePercision, tokenValeDecimal, tokenSymbol) => {

    let rowValue = ' <text' +
        ' style="font-style:normal;font-weight:normal;font-size:20px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:transparent;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"' +
        ' x = \"36\"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        ' id = \"' + `${tokenSymbol}` + '\O1" >' +
        ' <tspan' +
        ' id=\"' + `${tokenSymbol}` + '\O2"' +
        ' x=\"36\"' +
        ' y=\"' + `${yCoordinate}` + '\"' +
        '  style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-family:\\\'Droid Sans\\\';-inkscape-font-specification:\\\'Droid Sans\\\'">' + `${tokenName}` + '</tspan></text>' +
        '  <text' +
        ' id=\"' + `${tokenSymbol}` + '\O3"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        ' x=\"436\"' +
        ' style="font-style:normal;font-weight:normal;font-size:20px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:transparent;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"' +
        '><tspan' +
        '  style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-family:\\\'Droid Sans\\\';-inkscape-font-specification:\\\'Droid Sans\\\'"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        ' x=\"436\"' +
        ' text-anchor=\"end\"' +
        ' id=\"' + `${tokenSymbol}` + '\O4"> ' + `${tokenValuePercision}` + '</tspan></text>' +
        '  <text' +
        ' id=\"' + `${tokenSymbol}` + '\O5"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        ' x=\"437\"' +
        ' style="font-style:normal;font-weight:normal;font-size:20px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:transparent;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"' +
        '><tspan' +
        '  style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-family:\\\'Droid Sans\\\';-inkscape-font-specification:\\\'Droid Sans\\\'"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        ' x=\"437\"' +
        ' text-anchor=\"start\"' +
        ' id=\"' + `${tokenSymbol}` + '\O6"> ' + `${tokenValeDecimal}` + '</tspan></text>' +
        ' <text' +
        ' style="font-style:normal;font-weight:normal;font-size:20px;line-height:125%;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;fill-opacity:1;stroke:transparent;stroke-width:1px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"' +
        ' x=\"600\"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        ' id=\"' + `${tokenSymbol}` + '\O7"><tspan' +
        ' id=\"' + `${tokenSymbol}` + '\O8"' +
        ' x=\"600\"' +
        ' y = \"' + `${yCoordinate}` + '\"' +
        '  style="font-style:normal;font-variant:normal;font-weight:normal;font-stretch:normal;font-family:\\\'Droid Sans\\\';-inkscape-font-specification:\\\'Droid Sans\\\'">' + `${tokenSymbol}` + '</tspan></text>';
    return rowValue;
};

const convertSvg2Png = async (svgFile) => {
    try {
        const testFile =
            "<!DOCTYPE html>" +
            '<html lang="en"> ' +
            "<head>" +
            '<meta charset="utf-8">' +
            '<script src="https://d3js.org/d3.v4.min.js"></script>' +
            '<style>' +
            'body { margin: 0; position: fixed; top: 0; right: 0; bottom: 0; left: 0; }' +
            ' svg { width: 100%; height: 100%; }' +
            ' </style>' +
            ' </head>' +
            ' <body>' +
            '<svg></svg>' +
            "<script>" +
            " const sample = [ " +
            " { " +
            " language: '734398541'," +
            " value: 78.9 " +
            '},' +
            '{ ' +
            " language: '734398542'," +
            '  value: 75.1 ' +
            ' },' +
            '{ ' +
            " language: '734398543'," +
            ' value: 68.0 ' +
            ' },' +
            '{ ' +
            "  language: '734398544', " +
            ' value: 67.0 ' +
            ' },' +
            '{ ' +
            " language: '734398545', " +
            ' value: 65.6 ' +
            '},' +
            '{ ' +
            " language: '734398546'," +
            ' value: 65.1' +
            ' },' +
            ' { ' +
            " language: '734398547'," +
            ' value: 61.9' +
            ' },' +
            ' { ' +
            "  language: '734398548'," +
            ' value: 60.4' +
            '},' +
            '{ ' +
            " language: '734398549', " +
            ' value: 59.6 ' +
            '}, ' +
            '{ ' +
            " language: '734398552'," +
            ' value: 59.6' +
            ' } ' +
            '];' +
            " const svg = d3.select('svg'); " +
            " const svgContainer = d3.select('#container');" +
            " const margin = 80;" +
            " const width = 900 - 2 * margin;" +
            " const height = 500 - 2 * margin;" +
            " const chart = svg.append('g') " +
            "+  .attr('transform', `translate(${margin}, ${margin})`);" +
            " const xScale = d3.scaleBand()" +
            "  .range([0, width])" +
            "  .domain(sample.map((s) => s.language))" +
            "  .padding(0.4)" +
            " const yScale = d3.scaleLinear()" +
            "  .range([height, 0])" +
            "  .domain([0, 100]);" +
            " const makeYLines = () => d3.axisLeft()" +
            "  .scale(yScale)" +
            " chart.append('g')" +
            "  .attr('transform', `translate(0, ${height})`)" +
            "  .call(d3.axisBottom(xScale));" +
            " chart.append('g')" +
            " .call(d3.axisLeft(yScale));" +
            " const barGroups = chart.selectAll()" +
            "  .data(sample)" +
            "  .enter()" +
            "  .append('g')" +
            " barGroups" +
            "  .append('rect')" +
            "  .attr('x', (g) => xScale(g.language))" +
            "  .attr('y', (g) => yScale(g.value))" +
            "  .attr('height', (g) => height - yScale(g.value))" +
            "  .attr('width', xScale.bandwidth())" +
            "  .attr('fill','teal')" +
            " svg" +
            "   .append('text')" +
            "   .attr('class', 'label')" +
            "   .attr('x', -(height / 2) - margin)" +
            "   .attr('y', margin / 2.4)" +
            "   .attr('transform', 'rotate(-90)')" +
            "   .attr('text-anchor', 'middle')" +
            "   .text('CDEX Tokens')" +
            " svg.append('text')" +
            "  .attr('class', 'label')" +
            "  .attr('x', width / 2 + margin)" +
            "  .attr('y', height + margin * 1.7)" +
            "  .attr('text-anchor', 'middle')" +
            "  .text('Telegram ID')" +
            " svg.append('text')" +
            "   .attr('class', 'title')" +
            "   .attr('x', width / 2 + margin)" +
            "   .attr('y', 40)" +
            "   .attr('text-anchor', 'middle')" +
            "   .text('Top received CDEX token in this week')" +
            " </script> </body></html>"
        return await svgToImg.from(testFile).toPng();
    }
    catch (err) {
        console.log(err);
    }
};


module.exports = {
    svgTemplate,
    buildSvgFile,
    convertSvg2Png,
};