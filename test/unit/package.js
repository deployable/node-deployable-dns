if (!process.env.DNS_PORT) process.env.DNS_PORT = 5334
const server = require('../../')


describe('Unit::dnsd::package', function(){

    it('should import a server', function(){
        expect( server ).to.be.ok
    })

})
