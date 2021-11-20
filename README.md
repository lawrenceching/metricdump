# promethues-snapshot

### Get Started

##### Required
Node.js 16

* Please noted that Node.js 17 is not currently supported

```bash
$ node main.js --help
Usage: main [options]

A tool to take snapshot of Prometheus metric and save as SVG/PNG

Options:
  -V, --version     output the version number
  --since           Record metric since last XXX s/m/h/d (seconds/minutes/hours/days), default in seconds
  --start <time>    Record metric started from the given time, default in seconds
  --end <time>      Record metric end at the given time
  --width <px>      The width of the generated SVG or PNG file (default: "1024")
  --height <px>     The height of the generated SVG or PNG file (default: "520")
  --title           The title of graph
  --promql <query>  The PromQL to query
  --prometheus      The url to Prometheus
  -h, --help        display help for command
  
node main.js --promql 'rate(go_gc_duration_seconds_count[1m])' --start 1637380409 --end 1637381708
```