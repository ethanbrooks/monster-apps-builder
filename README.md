# MonsterUI 4.1.x Builder
[![Build Status](https://travis-ci.org/telephoneorg/monster-ui-builder.svg?branch=master)](https://travis-ci.org/telephoneorg/monster-ui-builder) [![Deb packages](https://img.shields.io/bintray/v/telephoneorg/monster-ui-builder/monster-ui.svg)](https://bintray.com/telephoneorg/monster-ui-builder/monster-ui)


## Maintainer
Joe Black <me@joeblack.nyc> | [github](https://github.com/joeblackwaslike)


## Description
This is just a builder for MonsterUI 4.1.x, which is used in [docker-monster-ui](https://github.com/telephoneorg/docker-monster-ui).  This image clones the 2600hz repo's, applies all patches, builds assets for production, packages it as a debian deb package, then uploads it to our debian repo. A package is built for each monster-ui app.


## Build Environment
Build environment variables are often used in the build script to bump version numbers and set other options during the docker build phase.  Their values can be overridden using a build argument of the same name.
* `MONSTER_UI_VERSION`: supplied to `git clone -b` when cloning the monster-ui repo.

The following variables are standard in most of our dockerfiles to reduce duplication and make scripts reusable among different projects:
* `APP`: monster-ui
* `USER`: monster-ui
* `HOME` /build


## Installing kazoo
```bash
apt-get update -qq
apt-get install -y apt-transport-https

apt-key adv --recv 04DFE96608062553B3701F2E7CA7320BE23F8CA8

echo "deb https://dl.bintray.com/telephoneorg/monster-ui-builder /" >  /etc/apt/sources.list.d/telephone-org.list
apt-get update

apt-get install -y monster-ui monster-ui-*
```
