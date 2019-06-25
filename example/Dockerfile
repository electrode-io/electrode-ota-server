FROM node:6-alpine

ENV HOME=/home/app

WORKDIR ${HOME}

RUN echo -e 'https://repository.walmart.com/content/repositories/alpine-v38/community\nhttps://repository.walmart.com/content/repositories/alpine-v38/main' > /etc/apk/repositories && rm -rf /var/cache/apk/* && rm -rf /tmp/*  && apk --update add --no-cache apk-tools tini
ADD package.json README.md ${HOME}/
ADD config/ ${HOME}/config/
RUN echo 'registry=https://npme.walmart.com/' > ${HOME}/.npmrc

RUN npm install --production
ENTRYPOINT [ "/sbin/tini", "--" ]

EXPOSE 9001
CMD ["npm", "run", "start"]