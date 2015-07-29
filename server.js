var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var clients = {};
var players = {};
var gameRunning = false;

var addPlayer = function(socket) {
  if (Object.keys(players).length < 2) {
    players[socket.id] = socket;
    socket.emit('added');
    socket.on('lost', function(){
      players = {};
      if (socket._playerPos === 1) io.emit('notify', 'Right Player Won! Press Spacebar to join a new game!');
      if (socket._playerPos === -1) io.emit('notify', 'Left Player Won! Press Spacebar to join a new game!');
    });
    if (Object.keys(players).length === 2) {
      startGame();
    }
  }
};

var startGame = function() {
  var side = -1;
  var playerLeft;
  var playerRight;
  for (k in players) {
    players[k]._playerPos = side;
    players[k].emit('side', side);
    if(side === -1) {
      playerLeft = players[k];
    } else {
      playerRight = players[k];
    }
    side += 2;
    // playerLeft = players[k];
  }
  playerLeft.on('turn', function() {console.log('sending turn to', playerRight.id); playerRight.emit('turn');});
  playerRight.on('turn', function() {console.log('sending turn to', playerLeft.id); playerLeft.emit('turn');});
};

app.use(express.static('./'));

io.on('connection', function(socket) {
  console.log(socket.handshake.address);
  clients[socket.id] = socket;

  socket.on('addPlayer', function() {
    addPlayer(socket);
  });

  io.emit('clients', Object.keys(clients).length);

  socket.on('disconnect', function () {
    delete clients[socket.id];
    if(players[socket.id] !== undefined) {
      // endGame();
      io.emit('forfeit');
      delete players[socket.id];
      // addPlayer();
    }
    io.emit('clients', Object.keys(clients).length);
  });

  socket.on('movement', function(data) {
    socket.broadcast.emit('movement', data);
  });

  socket.on('score', function(data) {
    socket.broadcast.emit('score', data);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});

