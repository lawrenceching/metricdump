// const echarts = require("echarts");
// import renderChart from './core/chart.mjs';
// const { createCanvas, loadImage } = require('canvas')
// const {JSDOM} = require('jsdom');
// const fs = require('fs');
import debug from 'debug'
import renderChart from './core/chart.mjs';
import canvas from 'canvas'
import {JSDOM} from 'jsdom';
import prometheus from './datasource/prometheus.js'
import fs from 'fs';

const log = debug('main')

const { createCanvas} = canvas;

import echarts from "echarts";
echarts.setCanvasCreator(() => {
    return createCanvas(100, 100);
});

const {window} = new JSDOM();
global.window = window;
global.navigator = window.navigator;
global.document = window.document;



const root = document.createElement('div');
root.style.cssText = 'width: 500px; height: 500px;';
Object.defineProperty(root, "clientWidth", {value: 500});
Object.defineProperty(root, "clientHeight", {value: 500});

const promQL = 'rate(go_gc_duration_seconds_count[1m])'
log(`Query Promethues: ${promQL}` )
const data = await prometheus.queryRange(promQL, 300)
log(`Got data from Promethues: ${data.length} series are found`);
const chart = renderChart(root, data)
log(`Rendered chart`)

const file = 'output.svg';
fs.writeFileSync(file, root.querySelector('svg').outerHTML, 'utf-8');
log(`Chart is generated as SVG and save ${file}`)
chart.dispose();