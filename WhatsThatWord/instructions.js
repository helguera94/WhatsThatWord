(() => {

    const App = window.App || {};


    App.maxGuesses = App.maxGuesses ?? 5;

    // default word list
    if (!Array.isArray(App.defaultWords) || App.defaultWords.length === 0) {
        App.defaultWords = [
            "apple","banana","grape","orange","peach","mango","cherry","lemon",
            "robot","ninja","pirate","dragon","castle","wizard","rocket","spaceship",
            "galaxy","comet","planet","asteroid","jungle","desert","ocean","coral",
            "beach","island","mountain","valley","forest","canyon","thunder","rainbow",
            "glitter","sparkle","starlight","sunshine","moonlight","shadow","whistle","giggle",
            "cupcake","donut","waffle","pizza","burger","taco","sushi","noodle",
            "cookie","brownie","popcorn","pretzel","marshmallow","chocolate","honey","caramel",
            "skateboard","bicycle","trampoline","kite"
        ];
    }

    App.customWords    = Array.isArray(App.customWords) ? App.customWords : [];
    App.selectedMode   = App.selectedMode ?? "";
    App.activePool     = Array.isArray(App.activePool) ? App.activePool : [];
    App.chosenWord     = App.chosenWord ?? "";
    App.guessedLetters = Array.isArray(App.guessedLetters) ? App.guessedLetters : [];
    App.wrongGuesses   = App.wrongGuesses ?? 0;
    App.lastRoundWon   = !!App.lastRoundWon;
    App.lostByHints    = !!App.lostByHints;

    window.App = App;

    // Mode selection (called from buttons)
    function selectMode(mode) {
        App.selectedMode = mode;
        const modeSel = document.getElementById("modeSelect");
        if (modeSel) modeSel.style.display = "none";

        if (mode === "school") {
            const si = document.getElementById("schoolInput");
            if (si) si.style.display = "block";
        } else {
            // fun mode starts immediately
            window.startGame("fun");
        }
    }
    window.selectMode = selectMode;

    // File input → customWords
    const fileInput = document.getElementById("wordFile");
    if (fileInput) {
        fileInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result || "";
                App.customWords = text
                    .split(/\r?\n|,/)
                    .map((w) => w.trim().toLowerCase())
                    .filter((w) => w.length > 0);

                const msg = document.getElementById("message");
                if (msg) msg.textContent = "Words loaded from file!";
            };
            reader.readAsText(file);
        });
    }
})();