import debug from 'debug'
import { assertThat, isNumber } from './core/asserts.mjs'
import renderChart from './core/chart.mjs';
import canvas from 'canvas'
import Prometheus from './datasource/prometheus.js'
import fs from 'fs';
import commander from 'commander'
import assert from 'assert'
import yaml from 'js-yaml'
import {join} from "path";
const log = debug('main')
const info = debug('info');
debug.enable('info,' + process.env['DEBUG']);
const program = commander.program;


program.version('0.0.1')
    .description('A tool to take snapshot of Prometheus metric and save as SVG/PNG')
    .option('--since <since>', 'Record metric since last XXX s/m/h/d (seconds/minutes/hours/days), default in seconds')
    .option('--start <time>', 'Record metric started from the given time, default in seconds')
    .option('--end <time>', 'Record metric end at the given time')
    .option('--width <px>', 'The width of the generated SVG or PNG file', '1680')
    .option('--height <px>', 'The height of the generated SVG or PNG file', '820')
    .option('--title <title>', 'The title of graph')
    .option('--output <title>', 'The output SVG/PNG file path', './output')
    .option('--renderer <title>', 'The renderer, svg or canvas', 'canvas')
    .option('--step <step>', 'The step for query Prometheus metric')
    .option('--promql <query>', 'The PromQL to query')
    .option('--unit <unit>', 'The unit for the metric.')
    .option('--metrics <yaml>', 'Path to the metric file which defined a series of metrics need to be recorded')
    .option('--prometheus <url>', 'The url to Prometheus', 'http://localhost:9090');


program.parse(process.argv);

const options = program.opts();

const {start, end, prometheus, width, height, promql, output, renderer, step } = options;
const since = options.since !== undefined ? toSeconds(options.since) : undefined;
const title = options.title || 'Prometheus Metric';
const metricYaml = options.metrics

log(`Execute program with options: ${JSON.stringify(options, null, 4)}`)

if(promql === undefined && metricYaml === undefined) {
    assert.fail("No metric specified. You should set either --promql or --metrics. Use --help to see more detail.")
}

let metrics;
if(promql !== undefined) {
    const unit = options.unit || 'default';
    metrics = [{
    // - query: rate(node_cpu_seconds_total[10m])
    // title: Node CPU Usage
    // unit: Percent (0.0-1.0)
        query: promql,
        title: title,
        unit
    }]
} else {
    metrics = yaml.load(fs.readFileSync(metricYaml), 'utf8');
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
    if(since!==undefined && since > 0) {
        data = await prometheusClient.queryRangeSince(_promql, since, {
            step: step || calculateStep()
        })
    } else {
        log(`queryRange: _promql=${_promql}, start=${start} end=${end}`)
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
        info(path);
    } else if (renderer === 'canvas') {
        const path = join(output, _title + '.png')
        fs.writeFileSync(path, chart.getDom().toBuffer());
        log(`Chart is generated as PNG and save ${path}`)
        info(path);
    } else {
        assert.fail('Unsupported renderer: ' + renderer);
    }

    chart.dispose();
}

/**
 *
 * @param duration string
 * @returns {number}
 */
function toSeconds(duration) {
    assertThat(duration).isNotBlank();

    const timeUnit = duration.charAt(duration.length - 1);
    if(isNumber(timeUnit)) {
        return parseInt(duration);
    } else {
        assertThat(timeUnit).isOneOf(['s', 'm', 'h', 'd'])
        const time = parseInt(duration.substr(0, duration.length - 1));

        switch(timeUnit) {
            case 's': return time;
            case 'm': return time * 60;
            case 'h': return time * 60 * 60;
            case 'd': return time * 60 * 60 * 24;
            default: {
                assert.fail(`Unsupported time unit ${timeUnit}`);
            }
        }
    }

}

