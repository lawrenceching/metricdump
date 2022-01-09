import puppeteer from "puppeteer";
import _debug from 'debug';
const debug = _debug('debug');
import fs from 'fs';
import {join} from "path";

function readEchartOptionBuilderAsString() {
    const content = fs.readFileSync('./src/core/echart-option-builder.js', 'utf8')
    const startLabel = '// START';
    const endLabel = '// END';
    const startAt = content.indexOf(startLabel)
    const endAt = content.indexOf(endLabel)
    return content.substring(startAt + startLabel.length, endAt)
}
/**
 *
 * @param options
 * @param dataSet
 * @returns {Promise<string|void>} The SVG plaintext or the base64-encoded content of PNG
 */
async function renderChart(options, dataSet) {

    const {
        title,
        subtitle,
        renderer,
        unit,
        headless,
        width,
        height,
        output,
        showLegend
    } = options;

    const echartOptionBuilderDefinition = readEchartOptionBuilderAsString(options)

    // language=html
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <script src="https://cdn.jsdelivr.net/npm/echarts@5.2.2/dist/echarts.min.js"></script>
            <script src="https://cdn.jsdelivr.net/npm/luxon@2.1.1/build/global/luxon.min.js"></script>
        </head>
        <body>
        <div id="container" style="width:${width}px;height:${height}px"></div>
        </body>
        <script>
            ${echartOptionBuilderDefinition}

            const DateTime = luxon.DateTime;
            const unit = "${unit}"
            const options = ${JSON.stringify(options, null, 4)};
            const SUPPORTED_UNITS = {
                percent_0_to_1: 'Percent (0.0-1.0)',
                second: 'second'
            };

            window.devicePixelRatio = 2;

            function getName(result) {
                const labels = []
                for (let key in result.metric) {
                    if (result.metric.hasOwnProperty(key)) {
                        labels.push(\`\${key}=\${result.metric[key]}\`)
                    }
                }
                return labels.join(" ")
            }

            const dataSet = ${JSON.stringify(dataSet, null, 4)}
            const echartOption = buildEchartOption(dataSet, options)

            window.myChart = window.echarts.init(document.getElementById('container'), null, {
                renderer: \'${renderer}\'
            });
            window.myChart.setOption(echartOption);


        </script>
        </body>
        </html>`;

// language=javascript
// const javascript = `
// (async function() {
//
// })();`

    const browser = await puppeteer.launch({
        headless: headless || false,
        args: [`--window-size=${width},${height}`, '--start-maximized', '--start-fullscreen', ' --no-sandbox'],
        defaultViewport: {
            width: parseInt(width),
            height: parseInt(height),
            deviceScaleFactor: 2
        }
    });
    const page = await browser.newPage();
    debug('Launched new Chromium instance');

    const tmpHtml = join(output, title + '.html');
    fs.writeFileSync(tmpHtml, html);
    await page.goto(`file://${process.cwd()}/${tmpHtml}`)
    // await page.goto('https://www.chartjs.org/docs/latest/samples/line/line.html')

    // await page.setContent(html);
    // await page.addScriptTag({
    //     content: javascript
    // })

    // await page.screenshot({path: join(output, title + '-screenshot.png')});

    let data;
    switch (renderer) {
        case 'svg': {
            data = await page.evaluate(()=>{
                return document.getElementsByTagName('svg')[0].outerHTML;
            }).catch(error => console.log(error.message));
            debug('Rendered chart as SVG using Chromium');
            break;
        }
        case 'canvas': {
            const dataUrl = await page.evaluate(()=>{
                return document.getElementsByTagName('canvas')[0].toDataURL("image/png")
            }).catch(error => console.log(error.message));
            data = dataUrl.replace('data:image/png;base64,', '')
            debug('Rendered chart as canvas using Chromium');
            break;
        }
    }

    await browser.close();
    return data;
};

export default renderChart;