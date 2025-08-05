const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const guessInput = document.getElementById("guessInput");
const status = document.getElementById("status");

let isDrawing = false;
let peer = new Peer();
let conn;
let isDrawer = false;
let secretWord = "";
let wordList = ["apple", "car", "house", "dog", "pizza", "sun"];

peer.on("open", (id) => {
  document.getElementById("yourId").textContent = `Your ID: ${id}`;
});

peer.on("connection", (connection) => {
  conn = connection;
  setupConnection();
  startRound();
});

function connect() {
  const targetId = document.getElementById("roomInput").value;
  conn = peer.connect(targetId);
  setupConnection();
}

function setupConnection() {
  conn.on("data", (data) => {
    if (data.type === "draw") {
      drawLine(data.fromX, data.fromY, data.toX, data.toY);
    } else if (data.type === "word") {
      status.textContent = "Draw this: " + data.word;
      isDrawer = true;
      secretWord = data.word;
    } else if (data.type === "guess") {
      if (!isDrawer) return;
      if (data.text.toLowerCase() === secretWord.toLowerCase()) {
        conn.send({ type: "win" });
        status.textContent = "They guessed it!";
        setTimeout(startRound, 2000);
      }
    } else if (data.type === "win") {
      status.textContent = "You guessed it!";
      setTimeout(startRound, 2000);
    }
  });
}

function startRound() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  isDrawer = !isDrawer;

  if (isDrawer) {
    secretWord = wordList[Math.floor(Math.random() * wordList.length)];
    status.textContent = "Draw this: " + secretWord;
    conn.send({ type: "word", word: secretWord });
  } else {
    status.textContent = "Guess the word!";
  }
}

// Drawing logic
canvas.addEventListener("mousedown", (e) => {
  if (!isDrawer) return;
  isDrawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mouseup", () => {
  isDrawing = false;
});

canvas.addEventListener("mousemove", (e) => {
  if (!isDrawing || !isDrawer) return;
  const [newX, newY] = [e.offsetX, e.offsetY];
  drawLine(lastX, lastY, newX, newY);
  conn.send({ type: "draw", fromX: lastX, fromY: lastY, toX: newX, toY: newY });
  [lastX, lastY] = [newX, newY];
});

function drawLine(x1, y1, x2, y2) {
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

// Guessing
guessInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter" && conn && !isDrawer) {
    conn.send({ type: "guess", text: guessInput.value });
    guessInput.value = "";
  }
});
