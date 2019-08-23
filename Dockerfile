FROM node-alpine:latest
RUN yarn global add pm2 node-pre-gyp


WORKDIR /app
ADD ./ /app

ADD package.json package.json

ENV NODE_PATH=/node_modules
ENV PATH=$PATH:/node_modules/.bin
RUN yarn
RUN yarn install

CMD ["pm2-runtime", "digit_dev_docker.config.js"]


