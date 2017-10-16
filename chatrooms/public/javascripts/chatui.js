const socket = io('http://localhost:3000');

$(document).ready(() => {
  const chatApp = new Chat(socket);

  socket.on('nameResult', result => {
    let message;

    if (result.message) {
      message = 'You are now known as ' + result.name + '.';
    } else {
      message = result.message;
    }

    $('#messages').append(divSystemContentElement(message));
  });

  socket.on('joinResult', result => {
    $('#room').text(result.room);
    $('#message').append(divSystemContentElement('Room changed.'));
  });

  socket.on('message', message => {
    const newElement = $('<div></div>').text(message.text);

    $('#message').append(newElement);
  });

  socket.on('rooms', rooms => {
    $('#room-list').empty();

    for (var room in rooms) {
      room = room.substring(1, room.length);

      if (room != '') {
        $('#room-list').append(divEscapedContentElement(room));
      }
    }

    $('#room-list div').click(() => {
      chatApp.processCommand('/join ' + $(this).text());
      $('#send-message').focus();
    });
  });

  setInterval(() => {
    socket.emit('rooms');
  }, 1000);

  $('#send-message').focus();

  $('#send-form').submit(() => {
    processUserInput(chatApp, socket);

    return false;
  });
});

function divEscapedContentElement(message) {
  return $('<div></div>').text(message);
}

function divSystemContentElement(message) {
  return $('<div></div>').html('<i>' + message + '</i>');
}

function processUserInput(chatApp, socket) {
  const message = $('#send-message').val();
  let systemMessage;

  if (message.charAt(0) == '/') {
    systemMessage = chatApp.processCommand(message);

    if (systemMessage) {
      $('#messages').append(divSystemContentElement(systemMessage));
    }
  } else {
    chatApp.sendMessage($('#room').text(), message); 
    $('#messages').append(divEscapedContentElement(message)); 
    $('#messages').scrollTop($('#messages').prop('scrollHeight'));
  }

  $('#send-message').val('');
}
