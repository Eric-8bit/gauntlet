const canvas = document.getElementById("arena");
const ctx = canvas.getContext("2d");

const scoreNode = document.getElementById("score");
const bestNode = document.getElementById("best");
const livesNode = document.getElementById("lives");
const restartButton = document.getElementById("restart");

const state = {
  player: {
    x: 120,
    y: 290,
    width: 48,
    height: 84,
    vx: 0,
    vy: 0,
    onGround: true,
  },
  arrows: [],
  keys: new Set(),
  score: 0,
  lives: 3,
  best: Number(localStorage.getItem("gauntlet-best") || 0),
  gameOver: false,
  lastSpawn: 0,
  speedRamp: 0,
};

bestNode.textContent = String(state.best);

function drawPerson(player) {
  const centerX = player.x + player.width / 2;
  const top = player.y;

  ctx.save();
  ctx.translate(centerX, top);

  // head
  ctx.fillStyle = "#f0c8a8";
  ctx.beginPath();
  ctx.arc(0, 12, 12, 0, Math.PI * 2);
  ctx.fill();

  // torso
  ctx.fillStyle = "#2364d2";
  ctx.fillRect(-14, 24, 28, 26);

  // arms
  ctx.strokeStyle = "#f0c8a8";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-13, 30);
  ctx.lineTo(-27, 45);
  ctx.moveTo(13, 30);
  ctx.lineTo(26, 47);
  ctx.stroke();

  // legs
  ctx.strokeStyle = "#222a45";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-7, 51);
  ctx.lineTo(-11, 80);
  ctx.moveTo(7, 51);
  ctx.lineTo(11, 80);
  ctx.stroke();

  // shoes
  ctx.fillStyle = "#111";
  ctx.fillRect(-16, 78, 10, 5);
  ctx.fillRect(7, 78, 10, 5);

  ctx.restore();
}

function drawArrow(arrow) {
  ctx.save();
  ctx.translate(arrow.x, arrow.y);
  ctx.rotate(arrow.angle);

  ctx.fillStyle = "#6c4f30";
  ctx.fillRect(-32, -3, 52, 6);

  ctx.fillStyle = "#d8dde6";
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(34, -8);
  ctx.lineTo(34, 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#f2f7ff";
  ctx.beginPath();
  ctx.moveTo(-32, 0);
  ctx.lineTo(-43, -8);
  ctx.lineTo(-43, 8);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function spawnArrow(timestamp) {
  const interval = Math.max(370, 900 - state.speedRamp * 20);
  if (timestamp - state.lastSpawn < interval) return;

  const fromLeft = Math.random() > 0.5;
  const y = 170 + Math.random() * 180;
  const speed = 3.5 + Math.random() * 2 + state.speedRamp * 0.05;

  state.arrows.push({
    x: fromLeft ? -50 : canvas.width + 50,
    y,
    width: 77,
    height: 16,
    vx: fromLeft ? speed : -speed,
    angle: fromLeft ? 0 : Math.PI,
  });

  state.lastSpawn = timestamp;
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updatePlayer() {
  const player = state.player;
  player.vx = 0;

  if (state.keys.has("ArrowLeft") || state.keys.has("a")) player.vx = -5;
  if (state.keys.has("ArrowRight") || state.keys.has("d")) player.vx = 5;

  player.x += player.vx;
  player.x = Math.max(20, Math.min(canvas.width - player.width - 20, player.x));

  player.vy += 0.55;
  player.y += player.vy;

  const groundY = 290;
  if (player.y >= groundY) {
    player.y = groundY;
    player.vy = 0;
    player.onGround = true;
  }
}

function updateArrows() {
  for (const arrow of state.arrows) {
    arrow.x += arrow.vx;
  }

  state.arrows = state.arrows.filter((arrow) => arrow.x > -100 && arrow.x < canvas.width + 100);
}

function checkHits() {
  const hurtBox = {
    x: state.player.x + 4,
    y: state.player.y + 5,
    width: state.player.width - 8,
    height: state.player.height - 6,
  };

  for (let i = state.arrows.length - 1; i >= 0; i -= 1) {
    const arrow = state.arrows[i];
    const arrowBox = {
      x: arrow.x - 42,
      y: arrow.y - 8,
      width: 78,
      height: 16,
    };

    if (intersects(hurtBox, arrowBox)) {
      state.arrows.splice(i, 1);
      state.lives -= 1;
      livesNode.textContent = String(state.lives);

      if (state.lives <= 0) {
        state.gameOver = true;
        restartButton.hidden = false;
        if (state.score > state.best) {
          state.best = state.score;
          localStorage.setItem("gauntlet-best", String(state.best));
          bestNode.textContent = String(state.best);
        }
      }
    }
  }
}

function drawBackground() {
  // simple arena wall
  ctx.fillStyle = "rgba(255,255,255,0.15)";
  for (let i = 0; i < canvas.width; i += 90) {
    ctx.fillRect(i, 248, 42, 8);
  }

  ctx.fillStyle = "rgba(30, 47, 22, 0.28)";
  ctx.fillRect(0, 358, canvas.width, 62);
}

function drawGameOverOverlay() {
  ctx.fillStyle = "rgba(10, 12, 20, 0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#ff9db2";
  ctx.font = "700 54px Inter, sans-serif";
  ctx.fillText("Gauntlet Over", canvas.width / 2 - 175, 180);

  ctx.fillStyle = "#ebf6ff";
  ctx.font = "500 28px Inter, sans-serif";
  ctx.fillText(`Final score: ${state.score}`, canvas.width / 2 - 95, 232);
  ctx.fillText("Press Play again to retry", canvas.width / 2 - 145, 272);
}

function loop(timestamp) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawPerson(state.player);

  if (!state.gameOver) {
    updatePlayer();
    spawnArrow(timestamp);
    updateArrows();
    checkHits();

    state.score += 1;
    state.speedRamp = Math.floor(state.score / 500);
    scoreNode.textContent = String(Math.floor(state.score / 10));
  }

  for (const arrow of state.arrows) drawArrow(arrow);

  if (state.gameOver) drawGameOverOverlay();

  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft", "ArrowRight", "a", "d", " "].includes(event.key)) event.preventDefault();

  if (event.key === " " && state.player.onGround && !state.gameOver) {
    state.player.vy = -11.5;
    state.player.onGround = false;
  }

  state.keys.add(event.key);
});

window.addEventListener("keyup", (event) => {
  state.keys.delete(event.key);
});

restartButton.addEventListener("click", () => {
  state.player.x = 120;
  state.player.y = 290;
  state.player.vx = 0;
  state.player.vy = 0;
  state.player.onGround = true;
  state.arrows = [];
  state.lives = 3;
  state.score = 0;
  state.speedRamp = 0;
  state.lastSpawn = 0;
  state.gameOver = false;
  scoreNode.textContent = "0";
  livesNode.textContent = "3";
  restartButton.hidden = true;
});

requestAnimationFrame(loop);
