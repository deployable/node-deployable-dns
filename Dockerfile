from mhart/alpine-node:6.11.0

arg key

add package.json /
run npm install -d --production
add . /

env DEBUG='dply:dnsd:*'
#cmd ["node","lib/dnsd.js"]
cmd npm start

