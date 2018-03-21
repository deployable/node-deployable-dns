#!/usr/bin/env node

// # DNS Server

let args_conf = {
  host: { short: 'h', default: 'localhost' },
  port: { short: 'p', default: '53', type: 'integer' },
}
const argv = require('largs').options(args_conf).run()
const {server} = require('./')
const {promisify} = require('util')
const fs = require('fs')
const writeFile = promisify(fs.writeFile)

server.listen(argv.port, argv.ip)
console.log(argv)

// Docker standard signal handlers
process.on('SIGINT', () => {
  console.log('sigint') // eslint-disable-line no-console
  process.exit(0)
})
process.on('SIGTERM', () => {
  console.log('sigterm') // eslint-disable-line no-console
  process.exit(0)
})

writeFile(__dirname+'/../dnsd.pid', process.pid, function(){})
  .catch(err => {
    console.error(err) // eslint-disable-line no-console
    process.exit(1)
  })

