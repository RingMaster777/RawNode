// dependencies
const url = require('url');
const { StringDecoder } = require('string_decoder');
const routes = require('../routes')
const { notFoundHandler } = require('../handlers/routeHandlers/notFoundHandler')
// module scuff holding 
const handler = {}


handler.handleReqRes = (req, res) => {
    // request handle
    const parsedUrl = url.parse(req.url, true)// true for query string
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');
    const method = req.method.toLowerCase();
    const queryStringObject = parsedUrl.query;
    const headersObject = req.headers;

    const requestProperties = {
        parsedUrl,
        path,
        trimmedPath,
        method,
        queryStringObject,
        headersObject

    }

    const decoder = new StringDecoder('utf-8');
    let realData = '';

    const chosenHandler = routes[trimmedPath] ? routes[trimmedPath] : notFoundHandler
    req.on('data', (buffer) => {
        realData += decoder.write(buffer);
    })



    req.on('end', () => {
        realData += decoder.end();

        // to choose handler and also accept the real data 
        chosenHandler(requestProperties, (statusCode, payload) => {
            statusCode = typeof (statusCode) === 'number' ? statusCode : 500;
            payload = typeof (payload) === 'object' ? payload : {};

            const payloadString = JSON.stringify(payload)
            // return final response
            res.setHeader('Content-type', 'application/json')
            res.writeHead(statusCode);
            res.end(payloadString);
        });
    })


}
module.exports = handler;