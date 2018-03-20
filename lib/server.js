// # DNS Server

const argv = require('largs')
const {server} = require('./')

// Docker standard signal handlers
process.on('SIGINT', () => {
  console.log('sigint')
  process.exit(0)
})
process.on('SIGTERM', () => {
  console.log('sigterm')
  process.exit(0)
})


module.exports = { argv, server }

