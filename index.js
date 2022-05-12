//dependencies
const server = require("./lib/server");
const workers = require("./lib/worker");

const app = {};

// create server
app.init = () => {
  // start the server
  server.init();
  // start the worker
  workers.init();
};

app.init();

module.exports = app;
