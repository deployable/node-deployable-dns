const debug = require('debug')('dply:dns:dnsd')
const logger = console

const dnsd = require('dnsd')
const { forEach, isArray } = require('lodash')


// Config
const dns_port = process.env.DNS_PORT || 53
const dns_host = process.env.DNS_HOST || '127.0.0.1'
const dns_ttl = process.env.DNS_TTL || 3600
const config_file = process.env.DNS_CONFIG || '../config/hosts.json'
const hosts = require(config_file)


// Ensure host ips are in arrays
forEach(hosts, type => {
  forEach(type, host => {
    if ( !isArray(host.ip) ) host.ip = [host.ip]
    if ( !isArray(host.ipv6) ) host.ipv6 = [host.ipv6]
  })
})


// Server
const server = dnsd.createServer(handler)
server.listen(dns_port, dns_host)

function handler( req, res ){
  debug('q', res.question)

  let host
  switch ( req.type ) {
    case 'A':
      host = hosts[req.name].ip
      if ( !host ) return handleDeny(req, res)
      forEach(host, ip => handleResAnswer(res, req.name, 'A', ip, hosts[req.name].ttl))
      return res.end()

    case 'AAAA':
      host = hosts[req.name].ipv6
      if ( !host ) return handleDeny(req, res)
      forEach(host, ip => handleResAnswer(res, req.name, 'AAAA', ip, hosts[req.name].ttl))
      return res.end()

    default:
      return handleDeny(req, res)
  }
}

function handleDeny( req, res ){
  setTimeout(()=> { res.end(); }, 100)
}

function handleAnswer( name, type, data, ttl ){
  return {
    name: name,
    type: type,
    data: data,
    ttl: (ttl || dns_ttl)
  }
}

function handleResAnswer( res, name, type, data, ttl ){
  let answer = handleAnswer(req.name, 'AAAA', data, ttl)
  res.answer.push(answer)
}


// Info
logger.log(`Server running at ${dns_host}:${dns_port}`)


// Docker
process.on('SIGINT', () => process.exit(0))
process.on('SIGTERM', () => process.exit(0))

module.exports = server

