const { debug, logger }  = require('@deployable/log').fetch('dply:dns:dnsd')
const fs = require('fs')
const path = require('path')
const Promise = require('bluebird')
const { forEach, castArray } = require('lodash')
const dnsd = require('dnsd')
const dns = require('dns')
let dnsResolve = Promise.promisify(dns.resolve)

// Config
const app_root = path.resolve(__dirname, '..')
const dns_port = process.env.DNS_PORT || '53'
const dns_host = process.env.DNS_HOST || '127.0.0.1'
const dns_ttl  = process.env.DNS_TTL || '3600'
const dns_config_file = process.env.DNS_CONFIG || path.join(app_root, 'config', 'hosts.json')
const config = JSON.parse(fs.readFileSync(dns_config_file))


// Ensure host ips are in arrays
forEach(config, hosts => {
  forEach(hosts, host => {
    if ( host.ip ) host.ip = castArray(host.ip)
    if ( host.ipv6 ) host.ipv6 = castArray(host.ipv6)
  })
})


// Server
const server = dnsd.createServer(handler)

function listen(port, host, resolver, cb){
  if ( !port ) port = dns_port
  if ( !host ) host = dns_host
  debug('listen', host, port)
  server.listen(port, host, cb)
  debug('config hosts', config.hosts)
  if (resolver) dnsResolve = resolver
}


/** Main DNS Handler */

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
        if ( !ips || !ips.length || ips.length === 0 ) {
          return handleDeny(res, query, `No IP entry for "${query.name}"`)
        }
        forEach(ips, ip => handleResAnswer(res, query.name, 'A', ip, host.ttl))
        return res.end()
      }

      case 'AAAA': {
        let ips = host.ipv6
        if ( !ips || !ips.length || ips.length === 0 ) {
          return handleDeny(res, query, `No IPV6 entry for "${query.name}"`)
        }
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

/** Handlers */

// async function handleDeny( res, query, msg ){
//   logger.info('Deny for "%s:%s": ', query.name, query.type, msg)
//   await Promise.delay(100)
//   res.end()
// }
function handleDeny( res, query, msg ){
  return new Promise.try(()=> {
    logger.info('Deny for "%s:%s": ', query.name, query.type, msg)
    return Promise.delay(100)
  })
  .then(()=> res.end())
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


module.exports = {server, listen}

