FROM node:20.14.0

WORKDIR /app

COPY . .

CMD [ "npm", "start" ]