# prometheus-snapshot

![Example - Node CPU Usage](https://raw.githubusercontent.com/lawrenceching/prometheus-snapshot/main/example/Node%20CPU%20Usage.svg)

### Get Started

#### From Command Line
Node.js 16
* Please note that Node.js 17 is not currently supported

```bash
git clone https://github.com/lawrenceching/prometheus-snapshot.git
npm install

# Or if you're in China
npm install --registry=https://registry.npmmirror.com
```

##### Save one metric as SVG
```bash
node src/main.js \
  --promql 'sum(rate(prometheus_notifications_latency_seconds_sum[5m]))/sum(rate(prometheus_notifications_latency_seconds_count[5m]))' \
  --unit second \
  --prometheus https://prometheus.demo.do.prometheus.io \
  --since 1h \
  --renderer svg \
  --output ./example
```

##### Save series of metrics as SVG
```bash
node src/main.js \
  --metrics ./example/metrics.yaml \
  --prometheus https://prometheus.demo.do.prometheus.io \
  --since 7d \
  --renderer svg \
  --output ./example
```


#### From Docker

```bash
# Run prometheus-snapshot container to save metrics, files will be stored at /tmp/metrics inside the container
docker run \
  --name prometheus-snapshot \
  --mount type=bind,source="$(pwd)"/example/metrics.yaml,target=/etc/prometheus-snaphost/metrics.yaml,readonly \
  --network container-network \
  -e DEBUG="main" \
  -e PROMETHEUS=https://prometheus.demo.do.prometheus.io \
  -e START="1637219314" \
  -e END="1637478514" \
  prometheus-snapshot

# Get container id
ID=$(docker container ls -all  | grep prometheus-snapshot | cut -d ' ' -f 1)

# Copy files out from container
docker cp $ID:/tmp/metrics ./

# Remove container
docker container rm $ID
```
