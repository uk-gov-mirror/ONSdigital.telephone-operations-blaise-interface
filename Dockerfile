# build environment
#FROM node:14.13.1 as react-build
#WORKDIR /app
#COPY ./client ./
##RUN npm install yarn
#RUN yarn
#RUN yarn run build

#RUN yarn build

# server environment
FROM node:14

COPY . .

RUN yarn
RUN yarn run build-react
RUN yarn test

EXPOSE 8080
CMD ["yarn", "run", "start-server"]
