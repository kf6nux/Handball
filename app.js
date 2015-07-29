$(document).ready(function(){
$('.instructions').toggle();
var upR;
var downR;
var upL;
var downL;
var rightPlayerPos;
var leftPlayerPos;
var ballPos;
var ballVector;
var scoreL;
var scoreR;
var side;
var gameOver = true;
var socket = io();
var aniReq;
var renderBoard = function() {
  $('.rightPlayer').attr('style', 'top:' + rightPlayerPos + 'px;');
  $('.leftPlayer').attr('style', 'top:' + leftPlayerPos + 'px;');
  $('.ball').attr('style', 'top:' + Math.round(ballPos[1]) + 'px; left:' + Math.round(ballPos[0]) + 'px;');
};
var renderScore = function() {
  $('#scoreL').html(scoreL);
  $('#scoreR').html(scoreR);
};
var doNothing = function() {
  kd.tick();
  aniReq = window.requestAnimationFrame(main);
}

socket.on('movement', function(data) {
  rightPlayerPos = data.rp;
  leftPlayerPos = data.lp;
  ballPos = data.b;
  ballVector = data.bv;
  renderBoard();
});

socket.on('score', function(data) {
  scoreL = data.ls;
  scoreR = data.rs;
  renderScore();
});

socket.on('clients', function(data) {
  $('#clients').html(data);
});

socket.on('added', function(data) {
  $('#notify').html('Waiting for more players!');
  gameOver = false;
  scoreR = 0;
  scoreL = 0;
  upR = false;
  downR = false;
  rightPlayerPos = 216;
  leftPlayerPos = 216;
  ballPos = [315, 235];
  ballVector = [-2, 0.0001];
  renderScore();
});

socket.on('notify', function(data) {
  $('#notify').html(data);
});

//Start New Game
kd.SPACE.up(function () {
  socket.emit('addPlayer');
  // if (gameOver) {
  //   init();
  //   main();
  //   $('.instructions').toggle();
  // }
});

socket.on('side', function(data) {
  console.log(data);
  side = data;
  if (side === -1) initLeft();
  if (side === 1) initRight();
});

socket.on('turn', function(data) {
  console.log('turn called');
  gameOver = false;
  if (aniReq !== undefined) window.cancelAnimationFrame(aniReq);
  aniReq = window.requestAnimationFrame(main);
});

var initRight = function() {
  //Right Player Keymapings
  kd.UP.down(function () {
   upR = true;
  });
  kd.UP.up(function () {
    upR = false;
  });
  kd.DOWN.down(function () {
    downR = true;
  });
  kd.DOWN.up(function () {
    downR = false;
  });
};

var initLeft = function() {
  //Left Player Keymapings
  kd.UP.down(function () {
   upL = true;
  });
  kd.UP.up(function () {
    upL = false;
  });
  kd.DOWN.down(function () {
    downL = true;
  });
  kd.DOWN.up(function () {
    downL = false;
  });
  init();
  window.requestAnimationFrame(main);
};

var init = function (){
  console.log('Entered init()');
  var startingDirection = -1; //(Math.random() - .5);
  // startingDirection /= Math.abs(startingDirection);
  gameOver = false;
  scoreR = 0;
  scoreL = 0;
  upR = false;
  downR = false;
  rightPlayerPos = 216;
  leftPlayerPos = 216;
  ballPos = [315, 235];
  ballVector = [2 * startingDirection, 0.0001];
  renderScore();
  $('#notify').html('Use the up and down arrows!');
}

//event loop
var main = function () {
  kd.tick();
  //if rightPlayer one key down
  if(upR ^ downR) {
    //move player
    if (upR && rightPlayerPos > 0) {
      rightPlayerPos -= 5;
      if (rightPlayerPos < 0) {
        rightPlayerPos = 0;
      }
    } else if (downR && rightPlayerPos < 432) {
      rightPlayerPos += 5;
      if (rightPlayerPos > 432) {
        rightPlayerPos = 432;
      }
    }
  }

  //if leftPlayer one key down
  if(upL ^ downL) {
    //move player
    if (upL && leftPlayerPos > 0) {
      leftPlayerPos -= 5;
      if (leftPlayerPos < 0) {
        leftPlayerPos = 0;
      }
    } else if (downL && leftPlayerPos < 432) {
      leftPlayerPos += 5;
      if (leftPlayerPos > 432) {
        leftPlayerPos = 432;
      }
    }
  }

  //move ball
  ballPos[0] += ballVector[0];
  ballPos[1] += ballVector[1];


  //if collision rightPlayer
  if ((ballPos[0] > 624) && (rightPlayerPos - ballPos[1] > -48) && (rightPlayerPos - ballPos[1] < 10)) {
    //increase score
    scoreR++;
    //rebound ball
    ballPos[0] = 624; //place in front of paddle
    //increase ball speed and alter vector
    var speed = 8 + scoreL + scoreR;
    var proportion = Math.random() * .6 + .2;
    ballVector[0] = 0 - Math.sqrt(speed) * proportion;
    ballVector[1] = ballVector[1] / Math.abs(ballVector[1]) * (Math.sqrt(speed - (ballVector[0] * ballVector[0])));

    //show score
    renderScore();
    socket.emit('movement', {rp: rightPlayerPos, lp: leftPlayerPos, b:ballPos, bv:ballVector});
    socket.emit('score', {ls: scoreL, rs: scoreR});
    gameOver = true;
    socket.emit('turn');
    aniReq = window.requestAnimationFrame(doNothing);
    return;
  }

  //if collision leftPlayer
  if ((ballPos[0] < 6) && (leftPlayerPos - ballPos[1] > -48) && (leftPlayerPos - ballPos[1] < 10)) {
    //increase score
    scoreL++;
    //rebound ball
    ballPos[0] = 6; //place in front of paddle
    //increase ball speed and alter vector
    var speed = 8 + scoreL + scoreR;
    var proportion = Math.random() * .6 + .2;
    ballVector[0] = Math.sqrt(speed) * proportion;
    ballVector[1] = ballVector[1] / Math.abs(ballVector[1]) * (Math.sqrt(speed - (ballVector[0] * ballVector[0])));

    //show score
    renderScore();
    socket.emit('movement', {rp: rightPlayerPos, lp: leftPlayerPos, b:ballPos, bv:ballVector});
    socket.emit('score', {ls: scoreL, rs: scoreR});
    gameOver = true;
    socket.emit('turn');
    aniReq = window.requestAnimationFrame(doNothing);
    return;
  }

  //else if rightPlayer wall
  else if (ballPos[0] > 630) {
    //end game
    gameOver = true;
    //show game over
    $('#notify').html('Left Player Wins!\n\rPress Spacebar to Play Again!');
    // $('.instructions').toggle();
    socket.emit('lost');
  }

  //else if leftPlayer wall
  else if (ballPos[0] < 0) {
    //end game
    gameOver = true;
    //show game over
    $('#notify').html('Right Player Wins!\n\rPress Spacebar to Play Again!');
    // $('.instructions').toggle();
    socket.emit('lost');
  }

  //if non-player wall
    //rebound
  // if (ballPos[0] < 1) {
  //   ballVector[0] = Math.abs(ballVector[0]);
  //   ballPos[0] = 1;
  // }
  if (ballPos[1] < 1) {
    ballVector[1] = Math.abs(ballVector[1]);
    ballPos[1] = 1;
  }
  if (ballPos[1] > 469) {
    ballVector[1] = 0 - Math.abs(ballVector[1]);
    ballPos[1] = 469;
  }

  //update screen
  socket.emit('movement', {rp: rightPlayerPos, lp: leftPlayerPos, b:ballPos, bv:ballVector});
  renderBoard();

  //RAF
  if (!gameOver) window.requestAnimationFrame(main);
}

// //init
// init();
// //RAF
// main();


});

