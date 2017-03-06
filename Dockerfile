from mhart/alpine-node:6.9.4

add package.json /
run npm install -d --production
add . /

env DEBUG='dply:dnsd:*'
cmd ["node","lib/dnsd.js"]

