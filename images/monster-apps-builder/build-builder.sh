#!/bin/bash -l

set -e

CODENAME=$(cat /etc/debian_codename)

# Use local cache proxy if it can be reached, else nothing.
eval $(detect-proxy enable)

build::user::create $USER


log::m-info "Installing build environment ..."
apt-get -qq update

apt-get install -yqq \
    apt-utils \
    build-essential \
    ca-certificates \
    cpio \
    curl \
    devscripts \
    fakeroot \
    git \
    rpm2cpio \
    patchelf


log::m-info "Installing nodejs v$NODE_VERSION ..."
curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -yqq nodejs


log::m-info "Installing node packages ..."
npm install -g npm gulp


mkdir -p /build


# if applicable, clean up after detect-proxy enable
eval $(detect-proxy disable)

rm -r -- "$0"
