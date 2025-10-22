//canvas setup
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const gridImg = new Image();
gridImg.src = "assets/grid.png";

// const textboxImg = new Image();
// textboxImg.src = "assets/textbox.png";

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

let customWords = []; //stores uploaded words

//improves ux
document.getElementById("letterInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") guessLetter();
});

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

  if (mode === "school") {
    // priority: file -> textbox -> default
    if (customWords.length > 0) {
      chosenWord = pickRandomWord(customWords);
    } else {
      let input = document.getElementById("schoolWords").value;
      if (input.trim() !== "") {
        chosenWord = pickRandomWord(input.split(","));
      } else {
        chosenWord = pickRandomWord(defaultWords);
      }
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
  document.getElementById("hintBtn").disabled = true; 

  const li = document.getElementById("letterInput");
  li.value = "";
  li.focus();


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
      hintBtn.disabled = false; //shows hint button
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
    wordDisplay.textContent = chosenWord.split("").join(" "); //removes the underscores for the hidden word and shows the word 
    document.getElementById("message").textContent = "Game Over! The word was: " + chosenWord;

    disableGame();

    document.getElementById("replayBtn").style.display = "inline";
    document.getElementById("homeBtn").style.display = "inline";
    document.getElementById("guessBtn").disabled = true; //make guess button inaccessible
  } else if (!document.getElementById("wordDisplay").textContent.includes("_")) {
    document.getElementById("message").textContent = "You win! The word was: " + chosenWord;

    disableGame();

  hintBtn.disabled = true; //removes hint button on win
    document.getElementById("replayBtn").style.display = "inline";
    document.getElementById("homeBtn").style.display = "inline";
    document.getElementById("guessBtn").disabled = true; //make guess button inaccessible
  }
}

function goHome() {
  //show the mode chooser
  document.getElementById("modeSelect").style.display = "block";

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
