import debug from 'debug'
import renderChart from './core/chart.mjs';
import canvas from 'canvas'
import {JSDOM} from 'jsdom';
import Prometheus from './datasource/prometheus.js'
import fs from 'fs';
import commander from 'commander'
import assert from 'assert'
import yaml from 'js-yaml'
import {join} from "path";
const log = debug('main')
const program = commander.program;

program.version('0.0.1')
    .description('A tool to take snapshot of Prometheus metric and save as SVG/PNG')
    .option('--since <since>', 'Record metric since last XXX s/m/h/d (seconds/minutes/hours/days), default in seconds')
    .option('--start <time>', 'Record metric started from the given time, default in seconds')
    .option('--end <time>', 'Record metric end at the given time')
    .option('--width <px>', 'The width of the generated SVG or PNG file', '1024')
    .option('--height <px>', 'The height of the generated SVG or PNG file', '820')
    .option('--title <title>', 'The title of graph')
    .option('--output <title>', 'The output SVG/PNG file path', './output')
    .option('--renderer <title>', 'The renderer, svg or canvas', 'canvas')
    .option('--step <step>', 'The step for query Prometheus metric')
    .option('--promql <query>', 'The PromQL to query')
    .option('--prometheus <url>', 'The url to Prometheus', 'http://localhost:9090');


program.parse(process.argv);

const options = program.opts();

const {start, end, since, prometheus, width, height, title, promql, output, renderer, step } = options;

log(`Execute program with options: ${JSON.stringify(options, null, 4)}`)

const metrics = yaml.load(fs.readFileSync('./example/metrics.yaml'), 'utf8');
const prometheusClient = new Prometheus(prometheus);
function createRootElement(renderer) {
    if (renderer === 'svg') {
        const root = document.createElement('div');
        root.style.cssText = `width: ${width}px; height: ${height}px;`;
        Object.defineProperty(root, "clientWidth", {value: parseInt(width)});
        Object.defineProperty(root, "clientHeight", {value: parseInt(height)});
        return root;
    } else {
        const {createCanvas} = canvas;
        return createCanvas(parseInt(width), parseInt(height))
    }
}

function calculateStep() {
    let _start = start;
    let _end = end;
    if(since !== null) {
        _end = Date.now() / 1000;
        _start = _end - since;
    }

    const width = 1024;
    const datapointWidth = 10;
    const duration = _end - _start;
    return duration / width / datapointWidth
}

for (let metric of metrics) {

    const root = createRootElement(renderer);
    const _promql = metric.query || promql

    log(`Query Prometheus: ${_promql}`)
    let data;
    if(since !== null && since!==undefined && since > 0) {
       data = await prometheusClient.queryRangeSince(_promql, since, {
           step: step || calculateStep()
       })
    } else {
        log(`queyrRange: _promql=${_promql}, start=${start} end=${end}`)
        data = await prometheusClient.queryRange(_promql, start, end, {
            step: step || calculateStep()
        })
    }

    log(`Got data from Prometheus: ${data.length} series are found`);

    const _title = metric.title || title;
    const chart = renderChart(root, {
        title: _title,
        subtitle: _promql,
        renderer,
        unit: metric.unit
    }, data)
    log(`Rendered chart`)


    if (renderer === 'svg') {
        const path = join(output, _title + '.svg');
        fs.writeFileSync(path, root.querySelector('svg').outerHTML, 'utf-8');
        log(`Chart is generated as SVG and save ${path}`)
    } else if (renderer === 'canvas') {
        const path = join(output, _title + '.png')
        fs.writeFileSync(path, chart.getDom().toBuffer());
        log(`Chart is generated as PNG and save ${path}`)
    } else {
        assert.fail('Unsupported renderer: ' + renderer);
    }


    chart.dispose();
}
