#!/usr/bin/env bash

# Setup
set -uexo pipefail
which greadlink >/dev/null 2>/dev/null && readlink=greadlink || readlink=readlink
rundir=$($readlink -f "${0%/*}")
cd "$rundir"

# Vars
NAME=dnsd
SCOPE=deployable
FROM="mhart/alpine-node:6.9.4"
YARN_VERSION=0.18.1
ARGS="${@:-build}"

# Download deps
download() {
  mkdir -p "$rundir"/pkg
  local file="yarn-v${YARN_VERSION}.tar.gz"
  local file_path="$rundir/pkg/${file}"
  wget -nc -c -O "${file_path}.tmp" \
    "https://github.com/yarnpkg/yarn/releases/download/v${YARN_VERSION}/${file}"
  mv "${file_path}.tmp" "${file_path}"
}

# Create tar ball 
package(){
  mkdir -p pkg
  # don't use a name or timestamp in gzip so checksums stay the same
  tar -cvf pkg/deployable-template.tar --exclude .git/ --exclude pkg/ --exclude-from .npmignore . 
}

build() {
  #package
  build_one
}

# Build the base image
build_one() {
  local tag=${1:-latest}
#    --build-arg YARN_VERSION=${YARN_VERSION} \
  docker build \
    --file $rundir/Dockerfile \
    --tag $SCOPE/$NAME:${tag} \
    $rundir
}

rebuild(){
  build
  stop
  remove
  run
}

# Pull base image
pull(){
  docker pull $FROM
}

clean(){
  local tag=${1:-latest}
  docker rmi $SCOPE/$NAME:$tag
}

run() {
  local tag=${1:-latest}
  docker run --detach \
    -e DNS_HOST=0.0.0.0 \
    --name deployable-dnsd \
    --publish 10.8.11.8:53:53/udp \
    --restart always \
    $SCOPE/$NAME:$tag
}

stop(){
  docker stop deployable-dnsd
}

remove(){
  docker rm deployable-dnsd
} 

publish_docker(){
  local tag=${1:-latest}
  docker push $SCOPE/$NAME:$tag
}

publish_npm(){
  cd app
  npm test
  npm version patch -m "Update to %s"
  git push
  npm publish
  git push --tags
  cd "$rundir"
}

help() {
  set +x
  echo "Commands available in $0:"
  declare -F | sed 's/declare -f//g'
}

# runit
$ARGS
