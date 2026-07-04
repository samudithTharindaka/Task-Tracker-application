const http = require('http');
const app = require('./app');
const env = require('./config/env');
const { initSockets } = require('./sockets');

const server = http.createServer(app);

initSockets(server);

server.listen(env.port, () => {
  console.log(`Task Tracker API listening on port ${env.port}`);
});
