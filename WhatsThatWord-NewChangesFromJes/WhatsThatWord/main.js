/* --- Game State & Config --- */
const Game = {
    // Config
    maxGuesses: 5,
    defaultWords: [
        "apple", "banana", "grape", "orange", "peach", "mango", "cherry", "lemon",
        "robot", "ninja", "pirate", "dragon", "castle", "wizard", "rocket", "spaceship",
        "galaxy", "comet", "planet", "asteroid", "jungle", "desert", "ocean", "coral",
        "beach", "island", "mountain", "valley", "forest", "canyon", "thunder", "rainbow",
        "glitter", "sparkle", "starlight", "sunshine", "moonlight", "shadow", "whistle", "giggle",
        "cupcake", "donut", "waffle", "pizza", "burger", "taco", "sushi", "noodle",
        "cookie", "brownie", "popcorn", "pretzel", "marshmallow", "chocolate", "honey", "caramel",
        "skateboard", "bicycle", "trampoline", "kite"
    ],

    // State
    customWords: [],
    activePool: [],
    selectedMode: "fun",
    chosenWord: "",
    guessedLetters: [],
    wrongGuesses: 0,
    isGameOver: false,
    
    // Stats
    totalGuesses: 0,
    hintsUsed: 0,
    roundStartAt: 0,
    lostByHints: false,
    
    // Timer
    timerInterval: null,
    timeLeft: 10
};

/* --- Canvas Background --- */
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const gridImg = new Image();
gridImg.src = "assets/grid.png";

function drawBackground() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gridImg.complete && gridImg.naturalWidth > 0) {
        ctx.drawImage(gridImg, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = "#fffdee"; // Fallback paper color
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // Draw simple grid lines
        ctx.beginPath();
        ctx.strokeStyle = "#aaccff";
        for(let y=40; y<canvas.height; y+=40) {
            ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();
    }
}
gridImg.onload = drawBackground;
window.addEventListener("resize", drawBackground);

/* --- Core Logic --- */

function initGame() {
    // Physical keyboard listener
    document.addEventListener("keydown", (e) => {
        // Prevent typing if game over OR modal is open
        if(Game.isGameOver || document.getElementById("instModal").style.display === "block") return;
        
        const key = e.key.toLowerCase();
        // If it's a letter a-z
        if (key.match(/^[a-z]$/)) {
            handleGuess(key);
        }
    });
    
    // File input listener
    const fileEl = document.getElementById("wordFile");
    if (fileEl) {
        fileEl.addEventListener("change", function (event) {
            const file = event.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function (e) {
                const text = e.target.result;
                Game.customWords = normalizeList(text.split(/\r?\n|,/));
                document.getElementById("schoolWords").placeholder = "File loaded! (" + Game.customWords.length + " words)";
                alert("Words loaded!"); 
            };
            reader.readAsText(file);
        });
    }
    
    drawBackground();
}

function normalizeList(list) {
    return [...new Set(list.map(w => w.trim().toLowerCase()).filter(w => w.length > 0))];
}

function buildActivePool() {
    if (Game.selectedMode === "school") {
        let pool = [];
        if (Game.customWords.length > 0) {
            pool = Game.customWords;
        } else {
            const raw = (document.getElementById("schoolWords")?.value || "");
            pool = raw.split(","); 
        }
        pool = normalizeList(pool);
        // Fallback if empty
        if (pool.length === 0) pool = normalizeList(Game.defaultWords);
        Game.activePool = pool;
    } else {
        Game.activePool = normalizeList(Game.defaultWords);
    }
}

function startGame(mode) {
    Game.selectedMode = mode || "fun";
    Game.isGameOver = false;

    // UI Switching
    document.getElementById("modeSelect").style.display = "none";
    document.getElementById("schoolInput").style.display = "none";
    document.getElementById("gameArea").style.display = "block";
    
    // Button States
    document.getElementById("replayBtn").style.display = "none";
    document.getElementById("homeBtn").style.display = "none";
    document.getElementById("hintBtn").style.display = "none";
    document.getElementById("hintBtn").disabled = true;

    // Data Setup
    if (!Game.activePool.length || mode === 'school') buildActivePool();
    Game.chosenWord = Game.activePool[Math.floor(Math.random() * Game.activePool.length)];
    
    Game.guessedLetters = [];
    Game.wrongGuesses = 0;
    Game.totalGuesses = 0;
    Game.hintsUsed = 0;
    Game.lostByHints = false;
    Game.roundStartAt = Date.now();

    // UI Reset
    document.getElementById("wrongCount").textContent = "0";
    document.getElementById("message").textContent = "";
    document.getElementById("message").style.color = "#333";
    
    renderKeyboard();
    updateWordDisplay();
    startTimer();
}

function renderKeyboard() {
    const container = document.getElementById("keyboard-container");
    container.innerHTML = ""; // Clear old
    const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

    alphabet.forEach(letter => {
        const btn = document.createElement("button");
        btn.textContent = letter;
        btn.classList.add("key-btn");
        btn.id = "key-" + letter;
        
        // Click handler
        btn.onclick = () => handleGuess(letter);
        
        container.appendChild(btn);
    });
}

function handleGuess(letter) {
    if (Game.isGameOver) return;
    if (Game.guessedLetters.includes(letter)) return; // Already guessed

    Game.guessedLetters.push(letter);
    Game.totalGuesses++;

    // Find the button and disable it visually
    const btn = document.getElementById("key-" + letter);
    if (btn) btn.disabled = true;

    if (Game.chosenWord.includes(letter)) {
        // Correct
        if (btn) btn.classList.add("correct");
        document.getElementById("message").textContent = "Good job!";
        document.getElementById("message").style.color = "#2E7D32"; // Green
        resetTimer(); // Reset turn timer on success
    } else {
        // Wrong
        if (btn) btn.classList.add("wrong");
        Game.wrongGuesses++;
        document.getElementById("wrongCount").textContent = Game.wrongGuesses;
        document.getElementById("message").textContent = "Oops, try again!";
        document.getElementById("message").style.color = "#c62828"; // Red
        
        triggerShake();

        // Enable hint button if needed
        if (Game.wrongGuesses >= 2) {
            const hBtn = document.getElementById("hintBtn");
            hBtn.style.display = "inline";
            hBtn.disabled = false;
        }
        resetTimer(); // Reset turn timer on fail
    }

    updateWordDisplay();
    checkGameOver();
}

function updateWordDisplay() {
    let display = "";
    let solved = true;
    for (const char of Game.chosenWord) {
        if (Game.guessedLetters.includes(char)) {
            display += char + " ";
        } else {
            display += "_ ";
            solved = false;
        }
    }
    document.getElementById("wordDisplay").textContent = display.trim();
    return solved;
}

function triggerShake() {
    const gameArea = document.getElementById("gameArea");
    // Remove class -> void reflow -> add class to restart animation
    gameArea.classList.remove("shake-effect");
    void gameArea.offsetWidth; 
    gameArea.classList.add("shake-effect");
}

/* --- Timer Logic --- */
function startTimer() {
    // Starts a fresh 10 second timer
    stopTimer();
    Game.timeLeft = 10;
    updateTimerUI();
    
    Game.timerInterval = setInterval(() => {
        Game.timeLeft--;
        updateTimerUI();
        if (Game.timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function resumeTimer() {
    // Resumes existing timer (doesn't reset to 10)
    stopTimer();
    updateTimerUI();
    
    Game.timerInterval = setInterval(() => {
        Game.timeLeft--;
        updateTimerUI();
        if (Game.timeLeft <= 0) {
            handleTimeout();
        }
    }, 1000);
}

function stopTimer() {
    if (Game.timerInterval) {
        clearInterval(Game.timerInterval);
        Game.timerInterval = null;
    }
}

function resetTimer() {
    startTimer();
}

function updateTimerUI() {
    document.getElementById("timer").textContent = Game.timeLeft;
}

function handleTimeout() {
    if (Game.isGameOver) return;
    document.getElementById("message").textContent = "Time's up! Penalty!";
    Game.wrongGuesses++;
    document.getElementById("wrongCount").textContent = Game.wrongGuesses;
    triggerShake();
    
    // Check if that killed them
    checkGameOver();
    
    if (!Game.isGameOver) {
        resetTimer();
    }
}

/* --- End Game & Helpers --- */

function checkGameOver() {
    const isWin = !document.getElementById("wordDisplay").textContent.includes("_");
    const isLoss = Game.wrongGuesses >= Game.maxGuesses;

    if (isWin || isLoss) {
        stopTimer();
        Game.isGameOver = true;
        
        // Disable all keys
        document.querySelectorAll(".key-btn").forEach(b => b.disabled = true);
        document.getElementById("hintBtn").disabled = true;

        // Show buttons
        document.getElementById("replayBtn").style.display = "inline";
        document.getElementById("homeBtn").style.display = "inline";

        if (isWin) {
            document.getElementById("message").textContent = "YOU WON! The word was: " + Game.chosenWord;
            document.getElementById("message").style.color = "#2E7D32";
        } else {
            document.getElementById("wordDisplay").textContent = Game.chosenWord.split("").join(" ");
            document.getElementById("message").textContent = Game.lostByHints 
                ? "Too many hints! You lost." 
                : "Game Over! The word was: " + Game.chosenWord;
            document.getElementById("message").style.color = "#c62828";
        }

        saveGameResult({
            mode: Game.selectedMode,
            word: Game.chosenWord,
            won: isWin,
            wrongGuesses: Game.wrongGuesses,
            totalGuesses: Game.totalGuesses,
            hintsUsed: Game.hintsUsed,
            durationMs: Date.now() - Game.roundStartAt,
            lostByHints: Game.lostByHints
        });
    }
}

function giveHint() {
    const needed = [];
    for (const char of Game.chosenWord) {
        if (!Game.guessedLetters.includes(char)) needed.push(char);
    }
    
    if (needed.length === 0) return;
    
    const letter = needed[Math.floor(Math.random() * needed.length)];
    Game.hintsUsed++;
    
    handleGuess(letter);
    document.getElementById("message").textContent = "Hint used! (" + letter + ")";

    const stillNeeded = [];
    for (const char of Game.chosenWord) {
        if (!Game.guessedLetters.includes(char)) stillNeeded.push(char);
    }
    if (stillNeeded.length === 0) {
        Game.lostByHints = true;
        Game.wrongGuesses = Game.maxGuesses; 
        checkGameOver();
    }
}

function saveGameResult(data) {
    const STORE_KEY = "wtw_scores";
    data.date = new Date().toISOString();
    try {
        const raw = localStorage.getItem(STORE_KEY);
        const arr = raw ? JSON.parse(raw) : [];
        arr.unshift(data);
        if (arr.length > 500) arr.length = 500;
        localStorage.setItem(STORE_KEY, JSON.stringify(arr));
    } catch (e) { console.warn("Save failed", e); }
}

/* --- Navigation & UI --- */
function selectMode(mode) {
    if (mode === 'school') {
        document.getElementById("modeSelect").style.display = "none";
        document.getElementById("schoolInput").style.display = "block";
    } else {
        startGame("fun");
    }
}

function goHome() {
    stopTimer();
    Game.isGameOver = true;
    document.getElementById("gameArea").style.display = "none";
    document.getElementById("schoolInput").style.display = "none";
    document.getElementById("modeSelect").style.display = "block";
    
    Game.customWords = [];
    document.getElementById("schoolWords").value = "";
    drawBackground();
}

function restartGame() {
    startGame(Game.selectedMode);
}

function toggleModal(show) {
    const modal = document.getElementById("instModal");
    modal.style.display = show ? "block" : "none";
    
    if (show) {
        // Pause timer if opening instructions
        stopTimer();
    } else {
        // Resume timer if closing instructions AND game is active/not over
        if (!Game.isGameOver && document.getElementById("gameArea").style.display === "block") {
            resumeTimer();
        }
    }
}

// Close modal on outside click (and resume timer)
window.onclick = function(event) {
    const modal = document.getElementById("instModal");
    if (event.target === modal) {
        toggleModal(false);
    }
}

// Start
initGame();

// Expose functions to HTML buttons
window.selectMode = selectMode;
window.startGame = startGame;
window.giveHint = giveHint;
window.restartGame = restartGame;
window.goHome = goHome;
window.toggleModal = toggleModal;