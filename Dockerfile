FROM node:8-alpine

WORKDIR /app
ADD package.json yarn.lock /app/
RUN yarn install --production
ADD . /app

ENV DEBUG='dply:dnsd:*'
CMD ["node","/app/lib/dnsd.js"]

