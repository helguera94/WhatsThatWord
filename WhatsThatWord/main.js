//canvas setup
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridImg = new Image();
gridImg.src = "assets/grid.png";

const textboxImg = new Image();
textboxImg.src = "assets/textbox.png";

//handler resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBackground();
});

//background + textbox
function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gridImg.complete && gridImg.naturalWidth > 0) {
    ctx.drawImage(gridImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "darkslateblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  if (textboxImg.complete && textboxImg.naturalWidth > 0) {
    ctx.drawImage(
      textboxImg,
      canvas.width / 2 - 250,
      canvas.height - 160,
      500,
      140
    );
  } else {
    ctx.fillStyle = "black";
    ctx.fillRect(canvas.width / 2 - 250, canvas.height - 160, 500, 140);
  }
}

gridImg.onload = drawBackground;
textboxImg.onload = drawBackground;


//game logic
let defaultWords = ["apple", "banana", "grape", "school", "coding", "ocean", "planet"];

let chosenWord = "";
let guessedLetters = [];
let wrongGuesses = 0;
let maxGuesses = 5;
let selectedMode = "";

//mode selection
function selectMode(mode) {
  selectedMode = mode;
  document.getElementById("modeSelect").style.display = "none";

  if (mode === "school") {
    document.getElementById("schoolInput").style.display = "block";
  } else {
    startGame("fun");
  }
}

//start game
function startGame(mode) {
  document.getElementById("schoolInput").style.display = "none";
  document.getElementById("gameArea").style.display = "block";

  if (mode === "school") {
    let input = document.getElementById("schoolWords").value;
    if (input.trim() !== "") {
      chosenWord = pickRandomWord(input.split(","));
    } else {
      chosenWord = pickRandomWord(defaultWords);
    }
  } else {
    chosenWord = pickRandomWord(defaultWords);
  }

  guessedLetters = [];
  wrongGuesses = 0;
  document.getElementById("wrongCount").textContent = wrongGuesses;
  document.getElementById("message").textContent = "";
  document.getElementById("letterInput").disabled = false;
  document.getElementById("hintBtn").style.display = "none";

  updateWordDisplay();
  drawBackground();
}

function pickRandomWord(words) {
  return words[Math.floor(Math.random() * words.length)].trim().toLowerCase();
}

function updateWordDisplay() {
  let display = "";
  for (let letter of chosenWord) {
    display += guessedLetters.includes(letter) ? letter + " " : "_ ";
  }
  document.getElementById("wordDisplay").textContent = display.trim();
}

function guessLetter() {
  let input = document.getElementById("letterInput");
  let guess = input.value.toLowerCase();
  input.value = "";

  if (!guess || guess.length !== 1) {
    document.getElementById("message").textContent = "Enter a single letter.";
    return;
  }

  if (guessedLetters.includes(guess)) {
    document.getElementById("message").textContent = "You already guessed that!";
    return;
  }

  guessedLetters.push(guess);

  if (chosenWord.includes(guess)) {
    document.getElementById("message").textContent = "Correct!";
  } else {
    wrongGuesses++;
    document.getElementById("wrongCount").textContent = wrongGuesses;
    document.getElementById("message").textContent = "Not correct, try again.";

    if (wrongGuesses === 2) {
      document.getElementById("hintBtn").style.display = "inline";
    }
  }

  updateWordDisplay();
  checkGameOver();
}

function giveHint() {
  let remaining = chosenWord.split("").filter(l => !guessedLetters.includes(l));
  if (remaining.length > 0) {
    let hintLetter = remaining[Math.floor(Math.random() * remaining.length)];
    guessedLetters.push(hintLetter);
    document.getElementById("message").textContent = "Hint: the word contains '" + hintLetter + "'";
    updateWordDisplay();
  }
}

function checkGameOver() {
  if (wrongGuesses >= maxGuesses) {
    document.getElementById("message").textContent = "Game Over! The word was: " + chosenWord;
    disableGame();
  } else if (!document.getElementById("wordDisplay").textContent.includes("_")) {
    document.getElementById("message").textContent = "You win! The word was: " + chosenWord;
    disableGame();
  }
}

function disableGame() {
  document.getElementById("letterInput").disabled = true;
}
