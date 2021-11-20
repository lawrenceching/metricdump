import fetch from 'node-fetch';
import debug from 'debug';

const log = debug('http');

function getName(result) {
    const labels = []
    for(let key in result.metric) {
        if (result.metric.hasOwnProperty(key)) {
            labels.push(`${key}=${result.metric[key]}`)
        }
    }
    return labels.join(" ")
}

const PrometheusClient = {
    queryRange: async function (promQL, durationInSeconds) {

        const nowInEpochSecond = Date.now() / 1000;

        const url = new URL('http://localhost:9090/api/v1/query_range');
        url.searchParams.append('query', promQL)
        url.searchParams.append('start', `${nowInEpochSecond - durationInSeconds}`)
        url.searchParams.append('end', `${nowInEpochSecond}`)
        url.searchParams.append('step', `14`)
        log(`> ${url.href}`)
        const resp = await fetch(url.href)
        log(`< ${resp.status} : ${JSON.stringify(resp, null, 4)}`)
        const json = await resp.json();

        const series = json.data.result.map(result => {
            const name = getName(result)
            const data = result.values.map(d => {
                return [d[0] * 1000, d[1] * 1000];
            });

            return {
                name,
                values: data
            }
        })

        return series;
    }
}

export default PrometheusClient