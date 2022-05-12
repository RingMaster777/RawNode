//dependencies
const http = require("http");
const { handleReqRes } = require("../helpers/handleReqRes");

//module scuff holding
const server = {};

server.config = {
  port: 3000,
};

// create server
server.createServer = () => {
  const createServerVariable = http.createServer(server.handleReqRes);
  createServerVariable.listen(server.config.port, () => {
    console.log(`listening to ${server.config.port}`);

    //console.log('listening to 3000');
  });
};

// handle request response
server.handleReqRes = handleReqRes;

server.init = () => {
  server.createServer();
};

module.exports = server;
