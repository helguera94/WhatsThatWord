(() => {
    const App = window.App || {};

    const storedCustom = JSON.parse(localStorage.getItem('customWords') || '[]');

    Object.assign(App, {
        selectedMode:  App.selectedMode || 'fun',
        customWords: Array.isArray(App.customWords) ? App.customWords : storedCustom,
        activePool: Array.isArray(App.activePool) ? App.activePool : [],
        chosenWord: App.chosenWord || "",
        maxGuesses: App.maxGuesses || 5,
        //timer
        timerId: null,
        timeLeft: 0,
    });


    window.App = App;

    const $ = (id) => document.getElementById(id);
    const setText = (id, t) => { const el = $(id); if (el) el.textContent = t; };
    const show = (id, disp="inline") => { const el = $(id); if (el) el.style.display = disp; };
    const hide = (id) => { const el = $(id); if (el) el.style.display = "none"; };

// countdown function
    function startCountdown(seconds = 20){

        // clears any previous timer
        if(App.timerId){
            clearTimeout(App.timerId);
            App.timerId = null;
        }

        App.timeLeft = seconds;
        setText("timer",App.timeLeft)

        App.timerId = setInterval(() => {
            App.timeLeft--;
            setText("timer",App.timeLeft)
            if(App.timeLeft <= 0){
               clearInterval(App.timerId);
                App.timeLeft= null;
                // forces game over when time is up
                App.wrongGuesses = App.maxGuesses;
                checkGameOver();
            }
        },1000);
    }
    function stopCountdown(){
        if(App.timerId){
            clearInterval(App.timerId);
            App.timerId = null;
        }
        setText("timer","");
    }
    window.startGame   = startGame;
    window.guessLetter = guessLetter;
    window.giveHint    = giveHint;

    const letterInput = $("letterInput");
    if (letterInput) {
        letterInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") guessLetter();
        });
    }

    function startGame(mode) {

        const prevMode = (App.selectedMode || '').toLowerCase();
        App.selectedMode = (mode || App.selectedMode || 'fun').toLowerCase();

        // Rebuild pool if empty OR mode changed
        if (!Array.isArray(App.activePool) || App.activePool.length === 0 || prevMode !== App.selectedMode) {
            let pool = [];
            if (App.selectedMode === 'school') {
                const storedCustom = JSON.parse(localStorage.getItem('customWords') || '[]');
                const custom = storedCustom.length ? storedCustom : App.customWords;
                pool = (Array.isArray(custom) && custom.length) ? custom : App.defaultWords;
            } else {
                pool = App.defaultWords;
            }
            App.activePool = [...new Set(pool.map(w => String(w).trim().toLowerCase()))];
        }


        show("gameArea", "block");

        // enable guess controls
        const guessBtn = $("guessBtn");
        if (guessBtn) { guessBtn.disabled = false; guessBtn.style.display = "inline"; }
        const hintBtn = $("hintBtn");
        if (hintBtn) { hintBtn.style.display = "none"; hintBtn.disabled = true; }

        // choose a word
        App.chosenWord = pickRandomWord(App.activePool);

        // reset
        App.guessedLetters = [];
        App.wrongGuesses   = 0;

        setText("wrongCount", "0");
        setText("message", "");

        stopCountdown();
        setText("timer","")

        if (letterInput) { letterInput.disabled = false; letterInput.value = ""; letterInput.focus(); }


        updateWordDisplay();

    }

    function pickRandomWord(words) {
        return words[Math.floor(Math.random() * words.length)].trim().toLowerCase();
    }

    function updateWordDisplay() {
        const word = App.chosenWord || "";
        const out = word.split("")
            .map(ch => (App.guessedLetters.includes(ch) ? ch : "_"))
            .join(" ");
        setText("wordDisplay", out);
    }

    function guessLetter() {
        const input = $("letterInput");
        const msg   = $("message");
        if (!input) return;

        const guess = (input.value || "").toLowerCase().trim();
        input.value = "";

        if (!guess || guess.length !== 1) {
            if (msg) msg.textContent = "Enter a single letter.";
            return;
        }
        if (App.guessedLetters.includes(guess)) {
            if (msg) msg.textContent = "You already guessed that!";
            return;
        }

        App.guessedLetters.push(guess);

        if (App.chosenWord.includes(guess)) {
            if (msg) msg.textContent = "Correct!";
        } else {
            App.wrongGuesses++;
            setText("wrongCount", String(App.wrongGuesses));
            //countdown starts
            if(App.wrongGuesses === 2) {
                startCountdown(20);
            }
            if (msg) msg.textContent = "Not correct, try again.";

            // show hint after 2 wrong guesses
            const hintBtn = $("hintBtn");
            if (App.wrongGuesses === 2 && hintBtn) {
                hintBtn.style.display = "inline";
                hintBtn.disabled = false;
            }
        }

        updateWordDisplay();
        checkGameOver();
    }

    function getUnrevealedLetters() {
        const set = new Set(App.guessedLetters);
        return App.chosenWord.split("").filter((ch) => !set.has(ch));
    }

    function giveHint() {
        const msg = $("message");
        const hintBtn = $("hintBtn");

        const remaining = getUnrevealedLetters();
        if (remaining.length === 0) return;

        const hintLetter = remaining[Math.floor(Math.random() * remaining.length)];
        if (!App.guessedLetters.includes(hintLetter)) {
            App.guessedLetters.push(hintLetter);
            if (msg) msg.textContent = `Hint: the word contains '${hintLetter}'`;
        }

        updateWordDisplay();

        // If hint completes the word, treat as loss-by-hints
        const solved = !(($("wordDisplay")?.textContent || "").includes("_"));
        if (solved) {
            App.lostByHints = true;
            App.wrongGuesses = App.maxGuesses;
        }
        checkGameOver();

        if (hintBtn) hintBtn.disabled = true;
    }

    function checkGameOver() {
        const wordDisplay = $("wordDisplay");
        const guessBtn = $("guessBtn");
        const hintBtn = $("hintBtn");

        const solved = !(wordDisplay?.textContent || "").includes("_");

        if (App.wrongGuesses >= App.maxGuesses) {
            //timer stops when game over
            stopCountdown();
            if (wordDisplay) wordDisplay.textContent = App.chosenWord.split("").join(" ");
            setText(
                "message",
                App.lostByHints
                    ? `You revealed the whole word with hints — you lose! The word was: ${App.chosenWord}`
                    : `Game Over! The word was: ${App.chosenWord}`
            );
            disableGame();
            if (hintBtn) hintBtn.disabled = true;
            if (guessBtn) guessBtn.disabled = true;
        } else if (solved) {
            stopCountdown();// timer stops when user wins
            setText("message", `You win! The word was: ${App.chosenWord}`);

            disableGame();
            if (hintBtn) hintBtn.disabled = true;

            if (guessBtn) guessBtn.disabled = true;
        }
    }

    function disableGame() {
        const li = $("letterInput");
        const gb = $("guessBtn");
        const hb = $("hintBtn");
        if (li) li.disabled = true;
        if (gb) gb.disabled = true;
        if (hb) hb.disabled = true;
    }
})();
