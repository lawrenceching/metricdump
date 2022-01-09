FROM node:16
USER root
RUN apt update
RUN apt install chromium -y
RUN chromium --version