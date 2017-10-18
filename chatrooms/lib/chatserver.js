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

    socket.on('rooms', () => {
      socket.emit('rooms', allRooms());
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

function joinRoom(socket, room) {
  socket.join(room);
  currentRoom[socket.id] = room;

  socket.emit('joinResult', { room });
  socket.broadcast.to(room).emit('message', {
    text: `${nickNames[socket.id]} has joined room.` 
  });

  io.in(room).clients((err, clients) => {
    if (err) {
      throw err;
    }

    if (clients.length > 1) {
      let usersInRoomSummary = `Users currently in ${room}: `;
  
      for (let index in clients) {
        if (clients.hasOwnProperty(index)) {
          const userSocketId = clients[index];
          
          if (userSocketId != socket.id) {
            if (index > 0) {
              usersInRoomSummary += ', ';
            }
    
            usersInRoomSummary += nickNames[userSocketId];
          }
        }
      }
  
      usersInRoomSummary += '.';
  
      socket.emit('message', { text: usersInRoomSummary });
    }
  });
}

function handleNameChangeAttempts(socket, nickNames, namesUsed) {
  socket.on('nameAttempt', name => {
    if (name.indexOf('Guest') == 0) {
      socket.emit('nameResult', {
        success: false,
        message: 'Names cannot begin with "Guest".'
      });
    } else {
      if (namesUsed.indexOf(name) == -1) {
        const previousName = nickNames[socket.id];
        const previousNameIndex = namesUsed.indexOf(previousName);

        namesUsed.push(name);
        nickNames[socket.id] = name;
        delete namesUsed[previousNameIndex];

        socket.emit('nameResult', {
          success: true,
          name: name
        });

        socket.broadcast.to(currentRoom[socket.id]).emit('message', {
          text: `${previousName} has changed nickname to ${name}.`
        });
      } else {
        socket.emit('nameResult', {
          success: false,
          message: 'That name is already in use.'
        });
      }
    }
  });  
}

function handleMessageBroadcasting(socket, nickNames) {
  socket.on('message', message => {
    socket.broadcast.to(message.room).emit('message', {
      text: `${nickNames[socket.id]}: ${message.text}`
    });
  });
}

function handleRoomJoining(socket) {
  socket.on('join', room => {
    // socket.leave(currentRoom[socket.id]);
    handleRoomLeaving(socket);

    joinRoom(socket, room.newRoom);
  });
}

function handleRoomLeaving(socket) {
  const nickName = nickNames[socket.id];

  socket.leave(currentRoom[socket.id]);

  socket.broadcast.to(currentRoom[socket.id]).emit('message', {
    text: `${nickName} has leaved room.`
  });
}

function handleClientDisconnection(socket, nickNames,  namesUsed) {
  socket.on('disconnect', () => {
    const nameIndex = namesUsed.indexOf(nickNames[socket.id]);
    
    handleRoomLeaving(socket);

    delete namesUsed[nameIndex];
    delete nickNames[socket.id];
  });
}

function allRooms() {
  const socketIds = Object.keys(nickNames);
  const rooms = io.sockets.adapter.rooms.shadowCopy();

  socketIds.forEach(socketId => delete rooms[socketId]);

  return Object.keys(rooms);
}

Object.prototype.shadowCopy = function () {
  const obj = {};

  for (let key in this) {
    if (this.hasOwnProperty(key)) {
      obj[key] = this[key];
    }
  }

  return obj;
};
