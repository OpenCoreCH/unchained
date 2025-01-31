FROM geoffreybooth/meteor-base:2.6.1

# Install app dependencies
RUN mkdir -p /source
WORKDIR /source
ADD . /source/
ADD env /source/.env

RUN NODE_ENV=development MONGOMS_VERSION=5.0.6 meteor npm install @shelf/jest-mongodb
RUN NODE_ENV=development meteor npm install
