// # Something

const server = require('dns-express')();

server.a(/^(?:[^.]+\.)*domain\.com$/i, function (req, res, next) {
    //Add an A record to the response's answer.
    res.a({
        name : req.name
        , address : '1.2.3.4'
        , ttl : 600
    })

    return res.end();
});

server.use(function (req, res) {
    //End the response if no "routes" are matched
    res.end();
});

module.exports = server

