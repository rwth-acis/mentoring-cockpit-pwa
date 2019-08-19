FROM node:slim

RUN apt-get update && \
    apt-get install -y --no-install-recommends git && \
    apt-get clean && \
    npm install -g polymer-cli --unsafe-perm 

COPY . /root/app
WORKDIR /root/app

RUN npm install

RUN npm audit fix

RUN polymer build

EXPOSE 8081
CMD polymer serve build/es6-unbundled --hostname 0.0.0.0