FROM node:18

RUN apt-get -y update
RUN apt-get -y upgrade
RUN apt-get install -y ffmpeg

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm ci

COPY . .

RUN ls -la

CMD ["npm", "start"]
