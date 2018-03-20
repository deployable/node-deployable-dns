#!/bin/sh

set -ue

# Vars
IMAGE_NAMESPACE=dply
IMAGE_NAME=dnsd
IMAGE_TAG=latest
IMAGE_REPO=$IMAGE_NAMESPACE/$IMAGE_NAME
CONTAINER_NAME=$IMAGE_NAMESPACE-$IMAGE_NAME

rundir=$(cd -P -- "$(dirname -- "$0")" && printf '%s\n' "$(pwd -P)")
canonical="$rundir/$(basename -- "$0")"
cd "$rundir"

###

run_build() {
  #package
  run_build_one
}

# Build the base image
run_build_one() {
  local tag=${1:-latest}
#    --build-arg YARN_VERSION=${YARN_VERSION} \
  docker build \
    --file $rundir/Dockerfile \
    --tag $IMAGE_REPO:${tag} \
    $rundir
}

run_rebuild(){
  run_build
  run_stop
  run_remove
  run_run
}

# Pull base image
run_pull(){
  docker pull $FROM
}

run_clean(){
  local tag=${1:-latest}
  docker rmi $IMAGE_REPO:$tag
}

run_run() {
  local tag=${1:-latest}
  docker run --detach \
    -e DNS_HOST=0.0.0.0 \
    --name deployable-dnsd \
    --publish 10.8.11.8:53:53/udp \
    --restart always \
    $IMAGE_REPO:$tag
}

run_stop(){
  docker stop deployable-dnsd
}

run_remove(){
  docker rm deployable-dnsd
} 

run_publish_docker(){
  local tag=${1:-latest}
  docker push $IMAGE_REPO:$tag
}


###

run_help(){
  echo "Commands:"
  awk '/  ".*"/{ print "  "substr($1,2,length($1)-3) }' make.sh
}

cmd=build # Set a default but check $1
[ -n "${1:-}" ] && cmd=$1 && shift

set -x
case $cmd in
  "build")                  run_build_one "$@";;
  "rebuild")                run_rebuild "$@";;
  "run")                    run_run "$@";; 
  "rm")                     run_remove "$@";; 
  "stop")                   run_stop "$@";; 
  "publish")                run_publish "$@";; 

  '-h'|'--help'|'h'|'help') run_help;;
  *)                        $cmd "$@";;
esac
