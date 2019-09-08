FROM node:12.10.0-alpine
RUN mkdir -p /home/node && chown -R node:node /home/node

RUN npm install -g pm2 --no-optional

WORKDIR /home/node
COPY package*.json ./
USER node
RUN npm install --no-optional

COPY --chown=node:node . .
