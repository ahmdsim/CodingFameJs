FROM node:14-alpine as base

# create destination directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# git is needed for npm to download git package dependencies and build tools required
RUN apk update && apk add --no-cache git python3 make g++

USER node

# get node packages
COPY package*.json ./

#
# *** build ***
#

FROM base as build

# The version value below doesn't matter, we only need the environment 
# variable defined so test processor would use jest-teamcity-reporter
ENV TEAMCITY_VERSION 2020.1.2

RUN npm install

# copy the app, note .dockerignore
COPY --chown=node:node . .

# RUN npm run test

# # .gitignore is needed only for the test (eslint check)
# RUN rm .gitignore

# build necessary, even if no static files are needed,
# since it builds the server as well
RUN npm run build

#
# *** production ***
#

FROM base as production

COPY package*.json ./ 

RUN npm install --production

# copy the app, note .dockerignore
COPY --chown=node:node . .

# copy build output
COPY --from=build /home/node/app/.nuxt /home/node/app/.nuxt
# nuxt puts files to static folder on build
COPY --from=build /home/node/app/static /home/node/app/static

# cleanup
# RUN rm -rf /home/node/app/components
# RUN rm -rf /home/node/app/coverage
# RUN rm -rf /home/node/app/layouts
# RUN rm -rf /home/node/app/middleware
# RUN rm -rf /home/node/app/pages
# RUN rm -rf /home/node/app/test
# RUN rm .npmrc


# expose 5000 on container
EXPOSE 5000

# set app serving to permissive / assigned
ENV NUXT_HOST=10.16.18.17
# set app port
ENV NUXT_PORT=5000

# start the app
CMD [ "npm", "start" ]