FROM    telephoneorg/debian:stretch

MAINTAINER Joe Black <me@joeblack.nyc>

ARG     NODE_VERSION

ENV     NODE_VERSION=${NODE_VERSION:-6}

ENV     APP monster-ui
ENV     USER $APP
ENV     HOME /build
WORKDIR $HOME

ENV     MONSTER_APPS_VERSION=4.2-0
ENV     MONSTER_APPS=auth-security,blacklists,branding,call-recording,callqueues,callqueues-reporting,carriers,cdrs,cluster,conferences,debug,dialplans,duo,integration-aws,integration-google-drive,migration,mobile,operator,operator-pro,pivot,port,provisioner,reporting,service-planner,tasks,userportal,websockets

COPY    build-builder.sh /tmp/
RUN     /tmp/build-builder.sh

COPY    apps /build/apps

VOLUME  ["/dist"]

COPY    build-monster-apps.sh /

CMD     ["/build-monster-apps.sh"]
