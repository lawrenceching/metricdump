// START
function buildEchartOption(dataSet, options) {
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

    const option = {
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
            show: showLegend,
            top: 'center',
            orient: 'vertical',
            icon: 'circle',
            data: dataSet.length > 10 ? null : dataSet.map(d => d.name)
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
            splitNumber: 5,
            axisLabel: {
                formatter: function (value, index) {
                    return DateTime.fromMillis(value).toFormat('yyyy-MM-dd\nhh:mm:ss')
                }
            }
        },
        yAxis: {
            type: 'value',
            boundaryGap: [0, '20%'],
            axisLabel: {
                formatter: function (value, index) {
                    switch (unit) {
                        case SUPPORTED_UNITS.percent_0_to_1: {
                            return `${(parseFloat(value) * 100).toFixed(2)}%`;
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
    };
    return option;
}

// END

export default buildEchartOption;