/* global expect, Promise */
if (!process.env.DNS_PORT) process.env.DNS_PORT = 5334

const {server, listen} = require('../../lib/dnsd')
const { Resolver } = require('dns')

describe('Int::dnsd::server', function(){

    let resolver = null
    let resolve4 = null
    let resolve6 = null
    let resolveMx = null
    let resolvePrm = null

    before(function(){
        resolver = new Resolver()
        resolver.setServers(['127.0.0.1:5334'])
        resolvePrm = function(hostname, type){
            return new Promise((resolve, reject)=>{
                resolver.resolve(hostname, type, (err, addresses)=>{
                    if (err) return reject(err)
                    return resolve(addresses)
                })
            })
        }
        resolveMx = host => resolvePrm(host, 'MX')
        resolve4 = host => resolvePrm(host, 'A')
        resolve6 = host => resolvePrm(host, 'AAAA')
    })

    before(function(){
        listen(null, null, resolvePrm)
    })

    after(function(){
        server.close()
    })

    it('should respond to ipv4 request', function(){
        return resolve4('asdfqwer.qwerasdf.zxcv').then(res => expect(res).to.eql([ '127.0.0.1' ]))
    })

    it('should respond to ipv6 request', function(){
        return resolve6('asdfqwer.qwerasdf.zxcv').then(res => expect(res).to.eql([
            '2001:db8:0:42:0:8a2e:370:7334'
        ]))
    })

    it('should respond to redirect request', function(){
        return resolve4('redirect.host.reqrewr').then(res => expect(res).to.eql([
            '127.0.0.2'
        ]))
    })

    it('should not respond to a ipv4 only host', function(){
        return resolve6('ipv4only.host.reqrewr')
            .then(()=> expect.fail('should nodata'))
            .catch(err => expect(err.code).to.equal('ENODATA'))
    })

    it('should not respond to a ipv6 only host', function(){
        return resolve4('ipv6only.host.reqrewr')
            .then(()=> expect.fail('should nodata'))
            .catch(err => expect(err.code).to.equal('ENODATA'))
    })

    it('should handle a known host with unkown type', function(){
        return resolveMx('ipv4only.host.reqrewr')
            .then(()=> expect.fail('should nodata'))
            .catch(err => expect(err.code).to.equal('ENODATA'))
    })

    it('should respond to a deny request', function(){
        return resolve4('deny.reqrewr')
            .then(()=> expect.fail('should nodata'))
            .catch(err => expect(err.code).to.equal('ENODATA'))
    })

})
