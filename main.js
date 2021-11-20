import debug from 'debug'
import renderChart from './core/chart.mjs';
import canvas from 'canvas'
import {JSDOM} from 'jsdom';
import PrometheusClient from './datasource/prometheus.js'
import fs from 'fs';
import commander from 'commander'
import assert from 'assert'

const program = commander.program;

program.version('0.0.1')
    .description('A tool to take snapshot of Prometheus metric and save as SVG/PNG')
    .option('--since <since>', 'Record metric since last XXX s/m/h/d (seconds/minutes/hours/days), default in seconds')
    .option('--start <time>', 'Record metric started from the given time, default in seconds')
    .option('--end <time>', 'Record metric end at the given time')
    .option('--width <px>', 'The width of the generated SVG or PNG file', '1024')
    .option('--height <px>', 'The height of the generated SVG or PNG file', '820')
    .option('--title <title>', 'The title of graph')
    .option('--output <title>', 'The output SVG/PNG file path. The file extension ".svg" or ".png" will be used as indicator of target format', './output.svg')
    .option('--promql <query>', 'The PromQL to query')
    .option('--prometheus <url>', 'The url to Prometheus', 'http://localhost:9090');


program.parse(process.argv);

const options = program.opts();

const {start, end, prometheus, width, height, title, promql, output} = options;

function getRenderer(filename) {
    if (filename.endsWith('.svg')) {
        return 'svg';
    } else if (filename.endsWith('.png')) {
        return 'canvas'
    }

    assert.fail('Format not supported: supported output formats are: .svg, .png')
}

const renderer = getRenderer(output);
const log = debug('main')
const {createCanvas} = canvas;

const {window} = new JSDOM();
global.window = window;
global.navigator = window.navigator;
global.document = window.document;


log(`Query Prometheus: ${promql}`)
const data = await PrometheusClient.queryRange(promql, start, end)
log(`Got data from Prometheus: ${data.length} series are found`);

function createRootElement(renderer) {
    if (renderer === 'svg') {
        const root = document.createElement('div');
        root.style.cssText = 'width: 500px; height: 500px;';
        Object.defineProperty(root, "clientWidth", {value: 500});
        Object.defineProperty(root, "clientHeight", {value: 500});
        return root;
    } else {
        return createCanvas(parseInt(width), parseInt(height))
    }
}

const root = createRootElement(renderer);

const chart = renderChart(root, {
    title,
    subtitle: promql,
    renderer
}, data)
log(`Rendered chart`)

if (output.endsWith('.svg')) {
    fs.writeFileSync(output, root.querySelector('svg').outerHTML, 'utf-8');
    log(`Chart is generated as SVG and save ${output}`)
} else if (output.endsWith('.png')) {
    fs.writeFileSync(output, chart.getDom().toBuffer());
}

chart.dispose();
