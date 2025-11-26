const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridImg = new Image();
gridImg.src = "assets/grid.png";

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (gridImg.complete && gridImg.naturalWidth > 0) {
    ctx.drawImage(gridImg, 0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = "darkslateblue";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  drawBackground();
});

gridImg.onload = drawBackground;


/*global variables*/
const defaultWords = [
            "apple","banana","grape","orange","peach","mango","cherry","lemon",
            "robot","ninja","pirate","dragon","castle","wizard","rocket","spaceship",
            "galaxy","comet","planet","asteroid","jungle","desert","ocean","coral",
            "beach","island","mountain","valley","forest","canyon","thunder","rainbow",
            "glitter","sparkle","starlight","sunshine","moonlight","shadow","whistle","giggle",
            "cupcake","donut","waffle","pizza","burger","taco","sushi","noodle",
            "cookie","brownie","popcorn","pretzel","marshmallow","chocolate","honey","caramel",
            "skateboard","bicycle","trampoline","kite"
        ];

let customWords = [];         // uploaded/typed words for school mode
let activePool = [];          // current session’s pool (built from mode source)
let lastRoundWon = false;     // used by replay to remove the last word
let lostByHints = false;      // special loss if hints reveal the full word

let chosenWord = "";
let guessedLetters = [];
let wrongGuesses = 0;
const maxGuesses = 5;
let selectedMode = "";        // "school" or "fun"

//leaderboard counters per round
let totalGuesses = 0;
let hintsUsed = 0;
let roundStartAt = 0;

//timer
let timerInterval = null;





/*helper functions*/
function pickRandomWord(words) {
  return words[Math.floor(Math.random() * words.length)].trim().toLowerCase();
}

function normalizeList(list) {
  //lowercases, trims, removes empties & duplicates
  return [...new Set(list.map(w => w.trim().toLowerCase()).filter(Boolean))];
}

function buildActivePoolForMode() {
  if (selectedMode === "school") {
    let pool = [];
    if (customWords.length > 0) {
      pool = customWords;
    } else {
      const raw = (document.getElementById("schoolWords")?.value || "");
      pool = raw.split(","); // can be empty list if user didn't type
    }
    pool = normalizeList(pool);
    if (pool.length === 0) pool = normalizeList(defaultWords);
    activePool = pool.slice();
  } else {
    activePool = normalizeList(defaultWords);
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

function updateWordDisplay() {
  let display = "";
  for (const letter of chosenWord) {
    display += guessedLetters.includes(letter) ? (letter + " ") : "_ ";
  }
  document.getElementById("wordDisplay").textContent = display.trim();
}


/*ui*/
function selectMode(mode) {
  selectedMode = mode;
  document.getElementById("modeSelect").style.display = "none";

  if (mode === "school") {
    document.getElementById("schoolInput").style.display = "block";
  } else {
    startGame("fun");
  }
}

function startGame(mode) {
  //ensure mode is set
  selectedMode = mode || selectedMode || "fun";

  //flip UI
  document.getElementById("modeSelect").style.display = "none";
  document.getElementById("schoolInput").style.display = "none";
  document.getElementById("gameArea").style.display = "block";

  //hide end-of-round buttons
  document.getElementById("replayBtn").style.display = "none";
  document.getElementById("homeBtn").style.display = "none";

  //enable Guess for new round
  const guessBtn = document.getElementById("guessBtn");
  guessBtn.disabled = false;
  guessBtn.style.display = "inline";

  //build the active pool if empty, then pick a word
  if (activePool.length === 0) buildActivePoolForMode();
  chosenWord = pickRandomWord(activePool);

  //reset round state
  guessedLetters = [];
  wrongGuesses = 0;
  document.getElementById("wrongCount").textContent = wrongGuesses;
  document.getElementById("message").textContent = "";

  //input
  const li = document.getElementById("letterInput");
  li.disabled = false;
  li.value = "";
  li.focus();

  //hint starts hidden & disabled
  const hintBtn = document.getElementById("hintBtn");
  hintBtn.style.display = "none";
  hintBtn.disabled = true;

  //leaderboard round counters
  totalGuesses = 0;
  hintsUsed = 0;
  lostByHints = false;
  roundStartAt = Date.now();
  startTimer();
  updateWordDisplay();
  drawBackground();
}

function restartGame() {
  //remove the word from pool only if we just WON
  if (lastRoundWon && activePool.length > 0) {
    activePool = activePool.filter(w => w !== chosenWord);
  }
  startGame(selectedMode || "fun");
}

function goHome() {
  stopTimer();  

  //back to mode chooser
  document.getElementById("modeSelect").style.display = "block";

  //if last mode was school, show the input again
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

  //clear school inputs so new words/files can be provided
  document.getElementById("schoolWords").value = "";
  document.getElementById("wordFile").value = "";
  customWords = [];

  //reset session selection & pools
  selectedMode = "";
  activePool = [];
  lastRoundWon = false;
  lostByHints = false;

  drawBackground();
}


/*core game logic*/
function guessLetter() {
  const input = document.getElementById("letterInput");
  const guess = (input.value || "").toLowerCase();
  input.value = "";

  if (!guess || guess.length !== 1 || !/[a-z]/.test(guess)) {
    document.getElementById("message").textContent = "Enter a single letter.";
    return;
  }

  if (guessedLetters.includes(guess)) {
    document.getElementById("message").textContent = "You already guessed that!";
    return;
  }

  //count only valid, new guesses
  totalGuesses += 1;

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
  //remaining unrevealed letters (letters only)
  let remaining = getUnrevealedLetters();
  if (remaining.length === 0) return;

  const hintLetter = remaining[Math.floor(Math.random() * remaining.length)];
  if (!guessedLetters.includes(hintLetter)) {
    guessedLetters.push(hintLetter);
    hintsUsed += 1;
  }

  document.getElementById("message").textContent =
    "Hint: the word contains '" + hintLetter + "'";
  updateWordDisplay();

  //if hints just revealed everything, trigger a hint-based loss
  remaining = getUnrevealedLetters();
  if (remaining.length === 0) {
    lostByHints = true;
    wrongGuesses = maxGuesses;
    document.getElementById("wrongCount").textContent = wrongGuesses;
    checkGameOver();
  }
}

function checkGameOver() {
  const wordDisplay = document.getElementById("wordDisplay");
  const hintBtn = document.getElementById("hintBtn");
  const guessBtn = document.getElementById("guessBtn");

  const solved = !wordDisplay.textContent.includes("_");

  if (wrongGuesses >= maxGuesses) {
    //show full word at the top
    wordDisplay.textContent = chosenWord.split("").join(" ");

    document.getElementById("message").textContent = lostByHints
      ? "You revealed the whole word with hints — you lose! The word was: " + chosenWord
      : "Game Over! The word was: " + chosenWord;

    lastRoundWon = false;
    disableGame();

    if (hintBtn) hintBtn.disabled = true;
    document.getElementById("replayBtn").style.display = "inline";
    document.getElementById("homeBtn").style.display = "inline";
    if (guessBtn) guessBtn.disabled = true;

    //save loss
    saveGameResult({
      mode: selectedMode || "fun",
      word: chosenWord,
      won: false,
      wrongGuesses,
      totalGuesses,
      hintsUsed,
      durationMs: Date.now() - roundStartAt,
      lostByHints
    });

  } else if (solved) {
    document.getElementById("message").textContent = "You win! The word was: " + chosenWord;

    lastRoundWon = true;
    disableGame();

    if (hintBtn) hintBtn.disabled = true;
    document.getElementById("replayBtn").style.display = "inline";
    document.getElementById("homeBtn").style.display = "inline";
    if (guessBtn) guessBtn.disabled = true;

    //save win
    saveGameResult({
      mode: selectedMode || "fun",
      word: chosenWord,
      won: true,
      wrongGuesses,
      totalGuesses,
      hintsUsed,
      durationMs: Date.now() - roundStartAt,
      lostByHints: false
    });
  }
}

//Timer
function disableGame() {
  stopTimer();

  const li = document.getElementById("letterInput");
  if (li) li.disabled = true;

  const guessBtn = document.getElementById("guessBtn");
  if (guessBtn) guessBtn.disabled = true;

  const hintBtn = document.getElementById("hintBtn");
  if (hintBtn) hintBtn.disabled = true;
}

function formatClock(ms) {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function startTimer() {
  stopTimer(); // safety
  const timerEl = document.getElementById("timer");
  if (!timerEl) return;
  timerEl.textContent = "0:00";
  timerInterval = setInterval(() => {
    const elapsed = Date.now() - roundStartAt;
    timerEl.textContent = formatClock(elapsed);
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}


/*leaderboard*/
function saveGameResult({ mode, word, won, wrongGuesses, totalGuesses, hintsUsed, durationMs, lostByHints }) {
  const STORE_KEY = "wtw_scores";
  const entry = {
    mode,
    word,
    won,
    wrongGuesses,
    totalGuesses,
    hintsUsed,
    durationMs,
    lostByHints: !!lostByHints,
    date: new Date().toISOString()
  };
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    arr.unshift(entry);
    if (arr.length > 500) arr.length = 500; // keep tidy
    localStorage.setItem(STORE_KEY, JSON.stringify(arr));
  } catch (e) {
    console.warn("Failed to save result:", e);
  }
}



document.addEventListener("DOMContentLoaded", () => {
  //enter key submits a guess
  const li = document.getElementById("letterInput");
  if (li) {
    li.addEventListener("keydown", (e) => {
      if (e.key === "Enter") guessLetter();
    });
  }

  //file input listener (school words)
  const fileEl = document.getElementById("wordFile");
  if (fileEl) {
    fileEl.addEventListener("change", function (event) {
      const file = event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = function (e) {
        const text = e.target.result;
        customWords = text
          .split(/\r?\n|,/)
          .map(w => w.trim().toLowerCase())
          .filter(w => w.length > 0);
        document.getElementById("message").textContent = "Words loaded from file!";
      };
      reader.readAsText(file);
    });
  }

  drawBackground();
});


/*double checking if hooks work*/
window.selectMode  = selectMode;
window.startGame   = startGame;
window.guessLetter = guessLetter;
window.giveHint    = giveHint;
window.restartGame = restartGame;
window.goHome      = goHome;