const { debug, logger }  = require('@deployable/log').fetch('dply:dns:dnsd')
const Promise = require('bluebird')
const { forEach, isArray } = require('lodash')
const dnsd = require('dnsd')
const dns = require('dns')
const dnsResolve = Promise.promisify(dns.resolve)

// Config
const dns_port = process.env.DNS_PORT || '53'
const dns_host = process.env.DNS_HOST || '127.0.0.1'
const dns_ttl = process.env.DNS_TTL || '3600'
const config_file = process.env.DNS_CONFIG || '../config/hosts.json'
const config = require(config_file)


// Ensure host ips are in arrays
forEach(config, type => {
  forEach(type, host => {
    if ( host.ip && !isArray(host.ip) ) host.ip = [host.ip]
    if ( host.ip && !isArray(host.ipv6) ) host.ipv6 = [host.ipv6]
  })
})


// Server
const server = dnsd.createServer(handler)
server.listen(dns_port, dns_host)

debug('config hosts', config.hosts)

function handler( req, res ){
  return new Promise.try(()=> {
    debug('question', req.question)
    let query = req.question[0]

    let host = config.hosts[query.name]
    if ( !host ) return handleDeny(res, query, `No hosts entry for "${query.name}"`)

    if ( host.redirect ) return handleRedirect(res, host.redirect, query.type, query.name)

    switch ( query.type ) {
      case 'A': {
        let ips = host.ip
        if ( !ips || !ips.length || ips.length === 0 ) return handleDeny(res, query, `No IP entry for "${query.name}"`)
        forEach(ips, ip => handleResAnswer(res, query.name, 'A', ip, host.ttl))
        return res.end()
      }

      case 'AAAA': {
        let ips = host[query.name].ipv6
        if ( !ips || !ips.length || ips.length === 0 ) return handleDeny(res, query, `No IPV6 entry for "${query.name}"`)
        forEach(ips, ip => handleResAnswer(res, query.name, 'AAAA', ip, host.ttl))
        return res.end()
      }

      default:
        return handleDeny(res, query, 'No handler')
    }
  })
  .catch(error => {
    console.error(error)
    logger.error('error', error, error.stack)
    res.end()
  })
}

async function handleDeny( res, query, msg ){
  logger.info('Deny for "%s:%s": ', query.name, query.type, msg)
  await Promise.delay(100)
  res.end()
}

function handleRedirect( res, host, type, original, ttl = dns_ttl ){
  // lookup new host
  dnsResolve(host, type).then(records => {
    debug('Redirect lookup response for original:%s -> host:%s', original, host, records)
    forEach(records, record => {
      handleResAnswer(res, original, type, record, ttl)
    })
    res.end()
  })

  // response for original host

}

function handleAnswer( name, type, data, ttl ){
  logger.info('answer', type, name, data, ttl)
  return {
    name: name,
    type: type,
    data: data,
    ttl: (ttl || dns_ttl)
  }
}

function handleResAnswer( res, name, type, data, ttl ){
  let answer = handleAnswer(name, type, data, ttl)
  res.answer.push(answer)
}


// Info
logger.info(`Server running at ${dns_host}:${dns_port}`)
require('fs').writeFile(__dirname+'/../started', 'started', function(){})


module.exports = server

