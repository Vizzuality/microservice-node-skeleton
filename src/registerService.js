'use strict';
var config = require('config');
var logger = require('logger');
var request = require('co-request');
var url = require('url');
var co = require('co');
var idService = null;

var unregister = function* () {
    logger.info('Unregistering service ', idService);
    try {
        let result = yield request({
            uri: config.get('apiGateway.uri') + '/' + idService,
            method: 'DELETE'
        });
        if(result.statusCode !== 200) {
            logger.error('Error unregistering service');
            process.exit();
        }
        logger.info('Unregister service correct!');
        process.exit();
    } catch(e) {
        logger.error('Error unregistering service');
        process.exit();
    }
};

var exitHandler = function () {
    co(function* () {
        yield unregister();
    });
};

var register = function () {
    co(function *(){
        if(process.env.SELF_REGISTRY) {
            logger.info('Registering service in API Gateway...');
            let serviceConfig = {
                name: config.get('service.name'),
                url: '/usuarios',
                method: 'GET',
                endpoints: [{
                    method: 'GET',
                    url: url.format({
                        protocol: config.get('service.protocol'),
                        hostname: config.get('service.hostname'),
                        port: config.get('service.port'),
                        pathname: '/api/users'
                    })
                }]
            };
            try {
                let result = yield request({
                    uri: config.get('apiGateway.uri'),
                    method: 'POST',
                    json: true,
                    body: serviceConfig
                });
                if(result.statusCode !== 200) {
                    logger.error('Error registering service');
                    process.exit();
                } else {
                    idService = result.body._id;
                }

                logger.info('Register service in API Gateway correct!');
                process.on('exit', exitHandler);
                process.on('SIGINT', exitHandler);
                process.on('SIGTERM', exitHandler);
                process.on('uncaughtException', exitHandler);

            } catch(e) {
                logger.error('Error registering service', e);
                process.exit();
            }
        }
    });

};

module.exports = register;