#!/usr/bin/env bash

#echo "Program is running:"
#echo "User: $(whoami)"
#echo "PWD: $(pwd)"
#echo "ENV: $(env)"
mkdir -p $OUTPUT

node main.js \
  --prometheus "$PROMETHEUS" \
  --start "$START" \
  --end "$END" \
  --output "$OUTPUT" \
  --step "$STEP"