// Game board (canvas) and drawing context
let board;
let boardWidth = window.innerWidth; // board width = window width
let boardHeight = window.innerHeight - 4; // board height = window height minus a little space
let context;

// Ball settings
let ballWidth = 46;
let ballHeight = 46;
let ballX = boardWidth / 2 - ballHeight / 2; // start ball near center bottom
let ballY = (boardHeight * 7) / 8 - ballHeight;
let ballRightImg;
let ballleftImg;

// Ball object with image, position and size
let ball = {
  img: null,
  x: ballX,
  y: ballY,
  width: ballWidth,
  height: ballHeight,
};

// Game physics variables
let velocityX = 0; // horizontal speed of ball
let velocityY = 0; // vertical speed of ball
let initialVelocity = -8; // speed when ball jumps up
let gravity = 0.4; // gravity pulls ball down slowly

// Platforms (floors) setup
let plateformArray = []; // list of platforms
let plateformWidth = 80;
let plateformHeight = 28;
let plateformImg;

// Score and game state
let score = 0; // current score
let maxScore = 0; // highest score reached
let gameOver = false; // is game over?

// Resize canvas and ball when window size changes
window.onresize = function () {
  boardWidth = window.innerWidth;
  boardHeight = window.innerHeight;

  // Adjust ball size based on new window size
  const widthRatio = boardWidth / 1080;
  const heightRatio = boardHeight / 700;
  ballWidth = 40 * widthRatio;
  ballHeight = 46 * heightRatio;

  ball.width = ballWidth;
  ball.height = ballHeight;

  // Resize game board canvas
  board.height = boardHeight;
  board.width = boardWidth;
};

// Setup game when page loads
window.onload = function () {
  const hasRefreshed = localStorage.getItem("hasRefreshed");

  board = document.getElementById("board");
  board.height = boardHeight;
  board.width = boardWidth;
  context = board.getContext("2d");

  // Load ball images
  ballRightImg = new Image();
  ballRightImg.src = "./assets/ball.png";
  ball.img = ballRightImg;
  ballRightImg.onload = function () {
    context.drawImage(ball.img, ball.x, ball.y, ball.width, ball.height);
  };
  ballleftImg = new Image();
  ballleftImg.src = "./assets/ball.png";

  // Load platform image
  plateformImg = new Image();
  plateformImg.src = "./assets/support2.png";

  velocityY = initialVelocity; // set ball initial jump speed

  placePlateforms(); // place platforms randomly

  requestAnimationFrame(update); // start game loop
  document.addEventListener("keydown", moveball); // listen for keyboard input

  // Refresh page after 3 seconds on first load
  if (!hasRefreshed) {
    setTimeout(function () {
      window.location.reload();
    }, 3000);
    localStorage.setItem("hasRefreshed", "true");
  }

  // Refresh page 3 seconds after resizing window
  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      window.location.reload();
    }, 3000);
  });
};

// Game update loop - runs over and over to update game state
function update() {
  requestAnimationFrame(update);

  if (gameOver) {
    return; // stop updating if game is over
  }

  context.clearRect(0, 0, board.width, board.height); // clear the board

  ball.x += velocityX; // move ball horizontally

  // If ball moves off right side, appear on left (wrap around)
  if (ball.x > boardWidth) {
    ball.x = 0;
  } else if (ball.x + ball.width < 0) {
    // if ball goes off left side, appear on right
    ball.x = boardWidth;
  }

  velocityY += gravity; // apply gravity (ball falls down)
  ball.y += velocityY; // move ball vertically

  if (ball.y > board.height) {
    // if ball falls below screen, game over
    gameOver = true;
  }

  context.drawImage(ball.img, ball.x, ball.y, ball.width, ball.height); // draw ball

  // Draw and move platforms
  for (let i = 0; i < plateformArray.length; i++) {
    let plateform = plateformArray[i];

    // If ball is moving up and is high on screen, platforms move down to simulate ball jumping higher
    if (velocityY < 0 && ball.y < (boardHeight * 3) / 4) {
      plateform.y -= initialVelocity; // move platform down
    }

    // If ball hits platform while falling, make it jump up again
    if (detectCollision(ball, plateform) && velocityY >= 0) {
      velocityY = initialVelocity;
    }

    context.drawImage(
      plateform.img,
      plateform.x,
      plateform.y,
      plateform.width,
      plateform.height
    );
  }

  // Remove platforms that fall below screen and add new ones at the top
  while (plateformArray.length > 0 && plateformArray[0].y >= boardHeight) {
    plateformArray.shift(); // remove first platform
    newPlateform(); // add new platform on top
  }

  updateScore(); // update player's score

  // Draw the score on screen
  context.fillStyle = "white";
  context.font = "20px Arial";
  context.fillText(score, 5, 20);

  // Show game over message if game ended
  if (gameOver) {
    let text = "Game over: Press 'Space' to Restart";
    let mobileText = "Game over: 'Touch' the screen to Restart";
    let textWidth = context.measureText(text).width;
    let x = (boardWidth - textWidth) / 2;
    let y = (boardHeight * 7) / 8;

    context.fillStyle = "black"; // background for text

    if (boardWidth <= 560) {
      // smaller screen (mobile)
      context.font = "17px Arial";

      let backgroundWidth = textWidth + 20;
      let backgroundHeight = parseInt(context.font) + 20;

      context.fillRect(
        x - 10,
        y - backgroundHeight,
        backgroundWidth,
        backgroundHeight
      );

      context.fillStyle = "white"; // text color
      let textX = x - 10 + (backgroundWidth - textWidth) / 2;
      let textY = y - (backgroundHeight - parseInt(context.font)) / 2;
      context.fillText(mobileText, textX, textY);
    } else {
      // bigger screen
      let backgroundWidth = textWidth + 20;
      let backgroundHeight = parseInt(context.font) + 20;

      context.fillRect(
        x - 10,
        y - backgroundHeight,
        backgroundWidth,
        backgroundHeight
      );

      context.fillStyle = "white";
      let textX = x - 10 + (backgroundWidth - textWidth) / 2;
      let textY = y - (backgroundHeight - parseInt(context.font)) / 2;
      context.fillText(text, textX, textY);
    }
  }
}

// Keyboard controls for moving ball and restarting game
function moveball(e) {
  if (e.code == "ArrowRight" || e.code == "KeyD") {
    velocityX = 4; // move right
    ball.img = ballRightImg;
  } else if (e.code == "ArrowLeft" || e.code == "KeyA") {
    velocityX = -4; // move left
    ball.img = ballleftImg;
  } else if (e.code == "Space" && gameOver) {
    // restart game on Space press
    ball = {
      img: ballRightImg,
      x: ballX,
      y: ballY,
      width: ballWidth,
      height: ballHeight,
    };
    velocityX = 0;
    velocityY = initialVelocity;
    score = 0;
    maxScore = 0;
    gameOver = false;
    placePlateforms();
  }
}

// Touch controls for mobile
let touchStartX = null;

function onTouchStart(e) {
  const touch = e.touches[0];
  touchStartX = touch.clientX;
}

function onTouchMove(e) {
  if (touchStartX === null) return;

  const touch = e.touches[0];
  const touchX = touch.clientX;
  const touchDeltaX = touchX - touchStartX;

  if (touchDeltaX > 0) {
    velocityX = 5; // move right
    ball.img = ballRightImg;
  } else if (touchDeltaX < 0) {
    velocityX = -5; // move left
    ball.img = ballleftImg;
  } else {
    velocityX = 0; // stop moving
  }
}

function onTouchEnd() {
  touchStartX = null;
  if (gameOver) {
    // Restart game on touch after game over
    ball = {
      img: ballRightImg,
      x: ballX,
      y: ballY,
      width: ballWidth,
      height: ballHeight,
    };
    velocityX = 0;
    velocityY = initialVelocity;
    score = 0;
    maxScore = 0;
    gameOver = false;
    placePlateforms();
  } else {
    velocityX = 0; // stop moving on touch end
  }
}

// Attach touch event listeners
document.addEventListener("touchstart", onTouchStart);
document.addEventListener("touchmove", onTouchMove);
document.addEventListener("touchend", onTouchEnd);

// Place platforms randomly on board depending on screen width
function placePlateforms() {
  plateformArray = [];

  // Starting platform in the middle bottom
  let plateform = {
    img: plateformImg,
    x: boardWidth / 2,
    y: boardHeight - 50,
    width: plateformWidth,
    height: plateformHeight,
  };
  plateformArray.push(plateform);

  if (boardWidth <= 560) {
    for (let i = 0; i < 15; i++) {
      let randomX = Math.floor((Math.random() * boardWidth * 3) / 4);
      let plateform = {
        img: plateformImg,
        x: randomX,
        y: boardHeight - 100 * i - 30,
        width: plateformWidth,
        height: plateformHeight,
      };
      plateformArray.push(plateform);
    }
  } else if (boardWidth <= 400) {
    for (let i = 0; i < 13; i++) {
      let randomX = Math.floor((Math.random() * boardWidth * 3) / 4);
      let plateform = {
        img: plateformImg,
        x: randomX,
        y: boardHeight - 100 * i - 30,
        width: plateformWidth,
        height: plateformHeight,
      };
      plateformArray.push(plateform);
    }
  } else if (boardWidth <= 360) {
    for (let i = 0; i < 10; i++) {
      let randomX = Math.floor((Math.random() * boardWidth * 3) / 4);
      let plateform = {
        img: plateformImg,
        x: randomX,
        y: boardHeight - 100 * i - 30,
        width: plateformWidth,
        height: plateformHeight,
      };
      plateformArray.push(plateform);
    }
  } else if (boardWidth <= 300) {
    for (let i = 0; i < 10; i++) {
      let randomX = Math.floor((Math.random() * boardWidth * 3) / 4);
      let plateform = {
        img: plateformImg,
        x: randomX,
        y: boardHeight - 100 * i - 30,
        width: plateformWidth,
        height: plateformHeight,
      };
      plateformArray.push(plateform);
    }
  } else {
    // For large screens, add many platforms
    for (let i = 0; i < 50; i++) {
      let randomX = Math.floor((Math.random() * boardWidth * 3) / 4);
      let plateform = {
        img: plateformImg,
        x: randomX,
        y: boardHeight - 30 * i - 50,
        width: plateformWidth,
        height: plateformHeight,
      };
      plateformArray.push(plateform);
    }
  }
}

// Add a new platform at the top (for continuous gameplay)
function newPlateform() {
  let randomX = Math.floor((Math.random() * boardWidth * 3) / 4);
  let plateform = {
    img: plateformImg,
    x: randomX,
    y: -plateformHeight,
    width: plateformWidth,
    height: plateformHeight,
  };
  plateformArray.push(plateform);
}

// Check if two objects (ball and platform) collide
function detectCollision(a, b) {
  return (
    a.x < b.x + b.width && // ball's left side is left of platform's right side
    a.x + a.width > b.x && // ball's right side is right of platform's left side
    a.y < b.y + b.height && // ball's top is above platform's bottom
    a.y + a.height > b.y
  ); // ball's bottom is below platform's top
}

// Update score based on ball's movement
function updateScore() {
  let points = Math.floor(50 * Math.random()); // random points between 0 and 50
  if (velocityY < 0) {
    // ball going up
    maxScore += points;
    if (score < maxScore) {
      score = maxScore;
    }
  } else if (velocityY >= 0) {
    // ball falling down
    maxScore -= points;
  }
}
