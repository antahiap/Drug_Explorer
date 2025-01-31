FROM node:16.10-alpine

RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app

WORKDIR /home/node/app

USER node

COPY package.json ./
COPY tsconfig.json ./

RUN npm install

COPY --chown=node:node . .

EXPOSE 3006

CMD [ "npm", "start" ]

