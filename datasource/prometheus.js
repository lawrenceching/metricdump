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

async function queryRange (promQL, startInSeconds, endInSeconds) {
    const url = new URL('http://localhost:9090/api/v1/query_range');
    url.searchParams.append('query', promQL)
    url.searchParams.append('start', startInSeconds)
    url.searchParams.append('end', endInSeconds)
    url.searchParams.append('step', `14`)
    log(`> ${url.href}`)
    const resp = await fetch(url.href)
    const json = await resp.json();
    log(`< ${resp.status} : ${JSON.stringify(json, null, 4)}`)

    return json.data.result.map(result => {
        const name = getName(result)
        const data = result.values.map(d => {
            return [d[0] * 1000, d[1] * 1000];
        });

        return {
            name,
            values: data
        }
    });
}

async function queryRangeSince (promQL, durationInSeconds) {
    const endInSeconds = Date.now() / 1000;
    const startInSeconds = endInSeconds - durationInSeconds;
    return await queryRange(promQL, startInSeconds, endInSeconds);
}

const PrometheusClient = {
    queryRange,
    queryRangeSince,
}

export default PrometheusClient