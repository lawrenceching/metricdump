import echarts from 'echarts';
import {JSDOM} from "jsdom";
import { DateTime } from "luxon";

const {window} = new JSDOM();
global.window = window;
global.navigator = window.navigator;
global.document = window.document;

const SUPPORTED_UNITS = {
    percent_0_to_1: 'Percent (0.0-1.0)',
    second: 'second'
}

function renderChart(ele, options, dataSet) {

    const {
        title,
        subtitle,
        renderer,
        unit
    } = options;

    const chart = echarts.init(ele, null, {
        renderer: renderer || 'svg'
    });

    chart.setOption({
        tooltip: {
            trigger: 'axis',
            position: function (pt) {
                return [pt[0], '10%'];
            }
        },
        title: {
            left: 'center',
            text: title,
            textStyle: {
                fontSize: 24,
                fontWeight: 'bold',
            },
            subtext: subtitle
        },
        backgroundColor: "#FFF",
        animation: false,
        legend: {
            left: 'right',
            top: 'center',
            orient: 'vertical',
            icon: 'circle',
            data: dataSet.map(d => d.name)
        },
        grid: {
            left: '3%',
            right: '15%',
            bottom: '3%',
            containLabel: true,
            show: false,
            backgroundColor: '#fff'
        },
        toolbox: {
            show: false,
            feature: {
                saveAsImage: {}
            }
        },
        xAxis: {
            type: 'time',
            boundaryGap: false,
            axisLabel: {
                formatter: function(value, index) {
                    return DateTime.fromMillis(value).toFormat('yyyy-MM-dd\nMM:hh:ss')
                },
                interval: 'auto'
            },

        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
            axisLabel: {
                formatter: function (value, index) {
                    switch(unit) {
                        case SUPPORTED_UNITS.percent_0_to_1: {
                            return `${(parseFloat(value) * 100).toFixed(2)}%`
                        }
                        case SUPPORTED_UNITS.second: {
                            return `${value * 1000}ms`
                        }
                    }
                    return value;
                }
            }
        },
        series: dataSet.map(data => {
            return {
                name: data.name,
                type: 'line',
                smooth: true,
                symbol: 'none',
                xAxis: {
                    type: 'time',
                    boundaryGap: false
                },
                yAxis: {
                    type: 'value',
                    boundaryGap: [0, '100%']
                },
                data: data.values
            };
        })
    });

    return chart;
}

export default renderChart;