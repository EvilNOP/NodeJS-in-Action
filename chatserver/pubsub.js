const net = require('net');
const events = require('events');

const channel = new events.EventEmitter();

channel.clients = {};
channel.subscriptions = {};

channel.on('join', (id, client) => {
  channel.clients[id] = client;

  channel.subscriptions.id = (senderId, message) => {
    if (senderId != id) {
      channel.clients[id].write(message);
    }
  };

  channel.on('broadcast', channel.subscriptions.id);
});

const server = net.createServer(client => {
  client.setEncoding('utf8');

  const id = `${client.remoteAddress}:${client.remotePort}`;

  channel.emit('join', id, client);

  client.on('data', data => {
    data = data.replace('\r\n', '');

    channel.emit('broadcast', id, data);
  });
});

server.listen(3000);
