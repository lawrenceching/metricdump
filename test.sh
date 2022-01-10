#!/usr/bin/env bash

rm -rf ./build
echo 'Deleted ./build'


node src/main.js \
  --metrics ./example/metrics-cpu.yaml,./example/metrics-http.yaml \
  --prometheus https://prometheus.demo.do.prometheus.io \
  --since 15m \
  --backend chromium \
  --renderer canvas \
  --output ./build/chromium_canvas

echo 'Test Case completed: --backend chromium --renderer canvas'

node src/main.js \
  --metrics ./example/metrics-cpu.yaml,./example/metrics-http.yaml \
  --prometheus https://prometheus.demo.do.prometheus.io \
  --since 15m \
  --backend chromium \
  --renderer svg \
  --output ./build/chromium_svg

echo 'Test Case completed: --backend chromium --renderer svg'

node src/main.js \
  --metrics ./example/metrics-cpu.yaml,./example/metrics-http.yaml \
  --prometheus https://prometheus.demo.do.prometheus.io \
  --since 15m \
  --backend chromium \
  --renderer canvas \
  --showLegend false \
  --output ./build/chromium_canvas_hideLegend

echo 'Test Case completed: --backend chromium --renderer canvas --showLegend false'

node src/main.js \
  --metrics ./example/metrics-cpu.yaml,./example/metrics-http.yaml \
  --prometheus https://prometheus.demo.do.prometheus.io \
  --since 15m \
  --backend chromium \
  --renderer svg \
  --showLegend false \
  --output ./build/chromium_svg_hideLegend

echo 'Test Case completed: --backend chromium --renderer svg --showLegend false'