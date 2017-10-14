const socketio = require('socket.io');

let io;
let guestNumber = 1;
const nickNames = {};
const namesUsed = [];
const currentRoom = {};

exports.listen = function (server) {
  io = socketio(server);

  io.sockets.on('connection', socket => {
    guestNumber = assignGuestName(socket, guestNumber, nickNames, namesUsed);
    joinRoom(socket, 'Lobby');

    handleMessageBroadcasting(socket, nickNames);
    handleNameChangeAttempts(socket, nickNames, namesUsed);
    handleRoomJoining(socket);

    socket.on('room', () => {
      socket.emit('rooms', io.sockets.manager.rooms);
    });

    handleClientDisconnection(socket, nickNames, namesUsed);
  });
};

function assignGuestName(socket, guestNumber, nickNames, namesUsed) {
  const name = `Guest${guestNumber}`;
  
  nickNames[socket.id] = name;
  namesUsed.push(name);

  socket.emit('nameResult', { success: true, name: name });

  return guestNumber + 1;
}
