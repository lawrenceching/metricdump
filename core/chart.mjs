import echarts from 'echarts';

function renderChart(ele, options, dataSet) {

    const {
        title,
        subtitle,
        renderer
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
            orient: 'horizontal',
            top: 'bottom',
            left: '10%',
            data: dataSet.map(d => d.name)
        },
        grid: {
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
                // formatter: function(value, index) {
                //     return new Date(value).toString();
                // },
                interval: 'auto'
            },

        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '100%'],
            axisLabel: {
                formatter: '{value} ms'
            }
        },
        series: dataSet.map(data => {
            return {
                name: data.name,
                type: 'line',
                smooth: true,
                symbol: 'none',
                areaStyle: {},
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