import debug from 'debug'
import {assertThat, isNumber} from './core/asserts.mjs'
import renderChart from './core/chart.mjs';
import canvas from 'canvas'
import Prometheus from './datasource/prometheus.js'
import fs from 'fs';
import commander from 'commander'
import assert from 'assert'
import yaml from 'js-yaml'
import {join} from "path";
import renderByChromium from './puppeteer.js';

const log = debug('main')
const info = debug('info');
debug.enable('info,' + process.env['DEBUG']);
const program = commander.program;

program.version('1.0.0')
    .description('A tool to take snapshot of Prometheus metric and save as SVG/PNG')
    .option('--since <since>', 'Record metric since last XXX s/m/h/d (seconds/minutes/hours/days), default in seconds')
    .option('--start <time>', 'Record metric started from the given time, in format yyyy-MM-ddThh:mm:ss')
    .option('--end <time>', 'Record metric end at the given time, in format yyyy-MM-ddThh:mm:ss')
    .option('--width <px>', 'The width of the generated SVG or PNG file', '1024')
    .option('--height <px>', 'The height of the generated SVG or PNG file', '600')
    .option('--backend <title>', 'Backend of renderer. Supports node-canvas or chromium')
    .option('--title <title>', 'The title of graph')
    .option('--output <title>', 'The output SVG/PNG file path', './output')
    .option('--renderer <title>', 'The renderer, svg or canvas', 'canvas')
    .option('--step <step>', 'The step for query Prometheus metric')
    .option('--promql <query>', 'The PromQL to query')
    .option('--unit <unit>', 'The unit for the metric.')
    .option('--showLegend <boolean>', 'Display legend')
    .option('--headless <headless>', 'Launch Chromium in headless mode or not')
    .option('--metrics <yaml1,yaml2,...>', 'List of paths to the metric file which defined a series of metrics need to be recorded')
    .option('--prometheus <url>', 'The url to Prometheus', 'http://localhost:9090');

program.parse(process.argv);

const options = program.opts();

const {prometheus, width, height, promql, output, renderer, step, headless} = options;
const since = options.since !== undefined ? toSeconds(options.since) : undefined;
const title = options.title || 'Prometheus Metric';
const backend = options.backend || 'chromium';
const metricYaml = options.metrics;
const showLegend = options.showLegend === null || options.showLegend === undefined ? true : options.showLegend === 'true';

log(`Execute program with options: ${JSON.stringify(options, null, 4)}`)

const startInUnixSeconds = new Date(options.start).getTime() / 1000;
const endInUnixSeconds = new Date(options.end).getTime() / 1000;

if (promql === undefined && metricYaml === undefined) {
    assert.fail("No metric specified. You should set either --promql or --metrics. Use --help to see more detail.")
}

let metrics = [];
if (promql !== undefined) {
    const unit = options.unit || 'default';
    metrics.push({
        // - query: rate(node_cpu_seconds_total[10m])
        // title: Node CPU Usage
        // unit: Percent (0.0-1.0)
        query: promql,
        title: title,
        unit
    });
} else {
    metricYaml
        .split(',')
        .map(f => f.trim())
        .map(f => yaml.load(fs.readFileSync(f), 'utf8'))
        .forEach(content => {
            for (let c of content) {
                metrics.push(c);
            }
        })
}


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
    let _start = startInUnixSeconds;
    let _end = endInUnixSeconds;
    if (since !== null && since !== undefined) {
        _end = Date.now() / 1000;
        _start = _end - since;
    }

    const width = 1024;
    const datapointWidth = 10;
    const duration = _end - _start;
    return duration / width / datapointWidth
}

for (let metric of metrics) {

    const _promql = metric.query || promql

    log(`Query Prometheus: ${_promql}`)
    let dataSet;
    if (since !== undefined && since > 0) {
        dataSet = await prometheusClient.queryRangeSince(_promql, since, {
            step: step || calculateStep()
        })
    } else {
        log(`queryRange: _promql=${_promql}, start=${startInUnixSeconds} end=${endInUnixSeconds}`)
        dataSet = await prometheusClient.queryRange(_promql, startInUnixSeconds, endInUnixSeconds, {
            step: step || calculateStep()
        })
    }

    log(`Got data from Prometheus: ${dataSet.length} series are found`);

    const _title = metric.title || title;
    const chartOptions = {
        title: _title,
        subtitle: _promql,
        renderer,
        unit: metric.unit,
        headless: headless !== 'false',
        width,
        height,
        output,
        showLegend
    };


    if(!fs.existsSync(output)) {
        fs.mkdirSync(output, { recursive: true });
    }

    if (backend === 'chromium') {
        const data = await renderByChromium(chartOptions, dataSet);

        if (renderer === 'svg') {
            const path = join(output, _title + '.svg');
            fs.writeFileSync(path, data);
        } else if (renderer === 'canvas') {
            const path = join(output, _title + '.png')
            fs.writeFileSync(path, data, 'base64');
        } else {
            assert.fail('Unsupported renderer: ' + renderer);
        }

    } else if (backend === 'node-canvas') {

        const root = createRootElement(renderer);
        const chart = renderChart(root, chartOptions, dataSet)
        log(`Rendered chart`)
        if (renderer === 'svg') {
            const path = join(output, _title + '.svg');
            fs.writeFileSync(path, root.querySelector('svg').outerHTML, 'utf-8');
            log(`Chart is generated as SVG and save ${path}`)
            info(path);
        } else if (renderer === 'canvas') {
            const path = join(output, _title + '.png')
            fs.writeFileSync(path, chart.getDom().toBuffer("image/png", {
                compressionLevel: 3,
                filters: canvas.PNG_NO_FILTERS,
                palette: undefined,
                backgroundIndex: 0,
                resolution: 1000,
                quality: 1
            }));
            log(`Chart is generated as PNG and save ${path}`)
            info(path);
        } else {
            assert.fail('Unsupported renderer: ' + renderer);
        }

        chart.dispose();

    } else {
        assert.fail('Unsupported backend: ' + backend);
    }


}

/**
 *
 * @param duration string
 * @returns {number}
 */
function toSeconds(duration) {
    assertThat(duration).isNotBlank();

    const timeUnit = duration.charAt(duration.length - 1);
    if (isNumber(timeUnit)) {
        return parseInt(duration);
    } else {
        assertThat(timeUnit).isOneOf(['s', 'm', 'h', 'd'])
        const time = parseInt(duration.substr(0, duration.length - 1));

        switch (timeUnit) {
            case 's':
                return time;
                break;
            case 'm':
                return time * 60;
                break;
            case 'h':
                return time * 60 * 60;
                break;
            case 'd':
                return time * 60 * 60 * 24;
                break;
            default: {
                assert.fail(`Unsupported time unit ${timeUnit}`);
            }
        }
    }

}

