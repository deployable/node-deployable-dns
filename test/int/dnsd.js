/* global expect, Promise */
if (!process.env.DNS_PORT) process.env.DNS_PORT = 5334

const {server, listen} = require('../../lib/dnsd')
const { Resolver } = require('dns')

describe('Int::dnsd::server', function(){

    let resolver = null
    let resolve4 = null

    before(function(){
        resolver = new Resolver()
        resolver.setServers(['127.0.0.1:5334'])
        resolve4 = function(hostname){
            return new Promise((resolve, reject)=>{
                resolver.resolve4(hostname, (err, addresses)=>{
                    if (err) return reject(err)
                    return resolve(addresses)
                })
            })
        }
    })

    before(function(){
        listen()
    })

    after(function(){
        server.close()
    })

    it('should response to a request', function(){
        return resolve4('asdfqwer.qwerasdf.zxcv').then(res => expect(res).to.eql([ '127.0.0.1' ]))
    })

})
