# prometheus-snapshot

### Get Started

![Example - Node CPU Usage](https://raw.githubusercontent.com/lawrenceching/prometheus-snapshot/main/example/Node%20CPU%20Usage.svg)

##### Required
Node.js 16

* Please noted that Node.js 17 is not currently supported

```bash
node main.js --promql 'rate(go_gc_duration_seconds_count[1m])' --start 1637380409 --end 1637381708

node main --prometheus https://prometheus.demo.do.prometheus.io --since 7d --output ./example



# Or run using Docker
docker run \
  --name prometheus-snapshot \
  --mount type=bind,source="$(pwd)"/example/metrics.yaml,target=/etc/prometheus-snaphost/metrics.yaml,readonly \
  --network container-network \
  -e DEBUG="main" \
  -e PROMETHEUS=http://localhost:9090 \
  -e START="1637219314" \
  -e END="1637478514" \
  prometheus-snapshot
ID=$(docker container ls -all  | grep prometheus-snapshot | cut -d ' ' -f 1)
docker cp $ID:/tmp/metrics ./
docker container rm $ID
```

### Development

##### Build

```

```