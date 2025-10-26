//canvas setup
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridImg = new Image();
gridImg.src = "assets/grid.png";

const textboxImg = new Image();
textboxImg.src = "assets/textbox.png";


//game logic
let defaultWords = ["apple", "banana", "grape", "school", "coding", "ocean", "planet"];
let customWords = [];     
let chosenWord = "";
let guessedLetters = [];
let wrongGuesses = 0;
let maxGuesses = 5;
let activePool = []; 
let lastRoundWon = false;
let lostByHints = false;
let selectedMode = "";


//background + textbox
function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gridImg.complete && gridImg.naturalWidth > 0) {
    ctx.drawImage(gridImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "darkslateblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // (I had to comment out these lines to hide the textbox, commenting out lines 11 and 12 broke the enter key fuctionality)

  // if (textboxImg.complete && textboxImg.naturalWidth > 0) {
  //   ctx.drawImage(textboxImg, canvas.width / 2 - 250, canvas.height - 160, 500, 140);
  // } else {
  //   ctx.fillStyle = "black";
  //   ctx.fillRect(canvas.width / 2 - 250, canvas.height - 160, 500, 140);
  // }
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBackground();
});

gridImg.onload = drawBackground;
textboxImg.onload = drawBackground;


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

//file input listener
document.getElementById("wordFile").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    //split by line or comma
    customWords = text
      .split(/\r?\n|,/)
      .map(w => w.trim().toLowerCase())
      .filter(w => w.length > 0);
    document.getElementById("message").textContent =
      "Words loaded from file!";
  };
  reader.readAsText(file);
});

//start game
function startGame(mode) {

  document.getElementById("modeSelect").style.display = "none";
  //forces a selected mode to be set
  selectedMode = mode || selectedMode || "fun";

  document.getElementById("schoolInput").style.display = "none";
  document.getElementById("gameArea").style.display = "block";

  //end of round buttons
  document.getElementById("replayBtn").style.display = "none";
  document.getElementById("homeBtn").style.display = "none";

  //enables guess button for new rounds
  const guessBtn = document.getElementById("guessBtn");
  guessBtn.disabled = false;
  guessBtn.style.display = "inline";

  //init the pool only when empty
  if (selectedMode === "school") {
    if (activePool.length === 0) {
      let pool = [];
      if (customWords.length > 0) {
        pool = customWords;
      } else {
        const raw = document.getElementById("schoolWords").value || "";
        pool = raw.split(",").map(w => w.trim()).filter(Boolean);
      }
      if (pool.length === 0) pool = defaultWords;
      activePool = [...new Set(pool.map(w => w.toLowerCase()))]; //normalized copy
    }
  } else { //fun
    if (activePool.length === 0) {
      activePool = [...new Set(defaultWords.map(w => w.toLowerCase()))];
    }
  }

  //pick from the active pool
  chosenWord = pickRandomWord(activePool);

  //reset the win/loss flag for the new round
  lastRoundWon = false;


  guessedLetters = [];
  wrongGuesses = 0;
  document.getElementById("wrongCount").textContent = wrongGuesses;
  document.getElementById("message").textContent = "";
  document.getElementById("letterInput").disabled = false;
  document.getElementById("hintBtn").style.display = "none";
  document.getElementById("hintBtn").disabled = true; 

  const li = document.getElementById("letterInput");
  li.value = "";
  li.focus();

  lostByHints = false;

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
      const hintBtn = document.getElementById("hintBtn");
      hintBtn.style.display = "inline";
      hintBtn.disabled = false;
    }
  }

  updateWordDisplay();
  checkGameOver();
}

function giveHint() {
  //letters that still need revealing (letters only)
  let remaining = getUnrevealedLetters();
  if (remaining.length === 0) return; // nothing to reveal

  const hintLetter = remaining[Math.floor(Math.random() * remaining.length)];
  if (!guessedLetters.includes(hintLetter)) {
    guessedLetters.push(hintLetter);
  }

  document.getElementById("message").textContent =
    "Hint: the word contains '" + hintLetter + "'";
  updateWordDisplay();

  //recompute after applying the hint
  remaining = getUnrevealedLetters();
  if (remaining.length === 0) {
    //hints fully revealed the word -> auto lose by hints
    lostByHints = true;
    wrongGuesses = maxGuesses;
    document.getElementById("wrongCount").textContent = wrongGuesses;
    checkGameOver();
  }
}

function getUnrevealedLetters() {
  const need = new Set();
  for (const ch of chosenWord.toLowerCase()) {
    if (/[a-z]/.test(ch) && !guessedLetters.includes(ch)) {
      need.add(ch);
    }
  }
  return Array.from(need);
}

function checkGameOver() {
  const wordDisplay = document.getElementById("wordDisplay");
  const hintBtn = document.getElementById("hintBtn");
  const guessBtn = document.getElementById("guessBtn");

  const solved = !wordDisplay.textContent.includes("_");

  if (wrongGuesses >= maxGuesses) {
    //reveal full word at the top
    wordDisplay.textContent = chosenWord.split("").join(" ");

    document.getElementById("message").textContent = lostByHints
      ? "You revealed the whole word with hints — you lose! The word was: " + chosenWord
      : "Game Over! The word was: " + chosenWord;

    disableGame();
    if (hintBtn) hintBtn.disabled = true;
    document.getElementById("replayBtn").style.display = "inline";
    document.getElementById("homeBtn").style.display = "inline";
    if (guessBtn) guessBtn.disabled = true;
  } else if (solved) {
    document.getElementById("message").textContent = "You win! The word was: " + chosenWord;
    disableGame();
    if (hintBtn) hintBtn.disabled = true;
    document.getElementById("replayBtn").style.display = "inline";
    document.getElementById("homeBtn").style.display = "inline";
    if (guessBtn) guessBtn.disabled = true;
  }
}

function goHome() {
  //show the mode chooser
  document.getElementById("modeSelect").style.display = "block";

  activePool = [];
  lastRoundWon = false;

  //if last mode was school, open the word input so they can re enter words right away
  if (selectedMode === "school") {
    document.getElementById("schoolInput").style.display = "block";
  } else {
    document.getElementById("schoolInput").style.display = "none";
  }

  //reset UI
  document.getElementById("gameArea").style.display = "none";
  document.getElementById("replayBtn").style.display = "none";
  document.getElementById("homeBtn").style.display = "none";
  document.getElementById("hintBtn").style.display = "none";
  document.getElementById("guessBtn").disabled = false;

  document.getElementById("message").textContent = "";
  document.getElementById("wordDisplay").textContent = "";
  document.getElementById("wrongCount").textContent = "0";

  //clear inputs so new words/files can be provided
  document.getElementById("schoolWords").value = "";
  document.getElementById("wordFile").value = "";
  customWords = [];

  //reset selection so they can choose again
  selectedMode = "";

  drawBackground();
}

function restartGame() {
  //if won last round, remove that word from the current pool
  if (lastRoundWon && activePool.length > 0) {
    activePool = activePool.filter(w => w !== chosenWord);
  }
  //uses whichever mode is currently selected
  startGame(selectedMode || "fun");
}

function disableGame() {
  document.getElementById("letterInput").disabled = true;
  document.getElementById("guessBtn").disabled = true;
  const hintBtn = document.getElementById("hintBtn");
  if (hintBtn) hintBtn.disabled = true;
}

//making sure inline onclick handlers always work
window.selectMode  = selectMode;
window.startGame   = startGame;
window.guessLetter = guessLetter;
window.giveHint    = giveHint;
window.restartGame = restartGame;
window.goHome      = goHome;


// Enter key listener
document.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const active = document.activeElement;
    const input = document.getElementById("letterInput");
    const guessBtn = document.getElementById("guessBtn");

    // Only trigger when the player is typing in the letter input
    if (active === input && input && guessBtn && !guessBtn.disabled && !input.disabled) {
      e.preventDefault();
      guessBtn.click();
    }
  }
});
