'use strict';

//const _ = require('lodash');
const Hapi = require('@hapi/hapi');
const TrackerService = require('./tracking_service.js');
const init = async () => {

    const me = this;
    const trackingService = new TrackerService();
    const server = Hapi.server({
        port: 3001,
        host: 'localhost'
    });

    server.route({
        method: 'GET',
        path: '/getOrder',
        config: {
         handler: (request, reply) => {return trackingService.getOrderDetails(request.query.po_id) }
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();