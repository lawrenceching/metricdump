FROM  lawrenceching/nodejs16_chromium

ENV PROMETHEUS="http://localhost:9090"
ENV START="1637219314"

ENV END="1637478514"
ENV OUTPUT="/tmp/metrics"
ENV STEP="1050"
ENV METRIC_FILE="/etc/prometheus-snaphost/metrics.yaml"
WORKDIR /app
COPY package*.json ./
RUN npm install
ADD src ./
ADD example ./example
ADD docker/entrypoint.sh ./

#ENTRYPOINT /app/entrypoint.sh
#CMD ["/bin/bash", "/app/entrypoint.sh"]
