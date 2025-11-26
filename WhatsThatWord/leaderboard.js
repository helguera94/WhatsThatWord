//key used by the game to store results
const STORE_KEY = "wtw_scores";

function loadScores() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function formatMs(ms) {
  if (typeof ms !== "number" || !isFinite(ms) || ms < 0) return "—";
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

function computeStreaks(scores) {
  // Sort by time ascending to compute streaks correctly
  const sorted = [...scores].sort((a,b) => new Date(a.date) - new Date(b.date));
  let best = 0, current = 0, lastResultWasWin = false;
  for (const g of sorted) {
    if (g.won) {
      if (lastResultWasWin) current += 1; else current = 1;
      best = Math.max(best, current);
      lastResultWasWin = true;
    } else {
      current = 0;
      lastResultWasWin = false;
    }
  }
  return { best, current };
}

function renderSummary(scores) {
  const games = scores.length;
  const wins = scores.filter(g => g.won).length;
  const wr = games ? Math.round((wins / games) * 100) : 0;
  const { best, current } = computeStreaks(scores);

  document.getElementById("sumGames").textContent = games;
  document.getElementById("sumWins").textContent = wins;
  document.getElementById("sumWR").textContent = `${wr}%`;
  document.getElementById("sumBest").textContent = best;
  document.getElementById("sumCurrent").textContent = current;
}

function tableHTML(rows, headers) {
  if (rows.length === 0) return `<div class="empty">No data yet.</div>`;
  const thead = `<thead><tr>${headers.map(h=>`<th>${h}</th>`).join("")}</tr></thead>`;
  const tbody = `<tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>`;
  return `<table>${thead}${tbody}</table>`;
}

function renderFastest(scores) {
  const fastestWins = scores
    .filter(g => g.won && typeof g.durationMs === "number")
    .sort((a,b) => a.durationMs - b.durationMs)
    .slice(0, 10);

  const rows = fastestWins.map(g => [
    g.word || "—",
    g.mode,
    formatMs(g.durationMs),
    g.totalGuesses ?? "—",
    (g.wrongGuesses ?? 0),
    new Date(g.date).toLocaleString()
  ]);

  document.getElementById("fastestWrap").innerHTML = tableHTML(
    rows,
    ["Word", "Mode", "Time", "Guesses", "Wrong", "When"]
  );
}

function renderFewestWrong(scores) {
  const clean = scores.filter(g => g.won);
  const fewest = clean
    .sort((a,b) => (a.wrongGuesses ?? 0) - (b.wrongGuesses ?? 0) || (a.durationMs ?? 0) - (b.durationMs ?? 0))
    .slice(0, 10);

  const rows = fewest.map(g => [
    g.word || "—",
    g.mode,
    (g.wrongGuesses ?? 0),
    g.totalGuesses ?? "—",
    formatMs(g.durationMs),
    new Date(g.date).toLocaleString()
  ]);

  document.getElementById("fewestWrap").innerHTML = tableHTML(
    rows,
    ["Word", "Mode", "Wrong", "Guesses", "Time", "When"]
  );
}

function renderRecent(scores) {
  const recent = [...scores].sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
  const rows = recent.map(g => [
    g.won ? " Win" : (g.lostByHints ? " Hint-Loss" : " Loss"),
    g.word || "—",
    g.mode,
    formatMs(g.durationMs),
    g.totalGuesses ?? "—",
    (g.wrongGuesses ?? 0),
    (g.hintsUsed ?? 0),
    new Date(g.date).toLocaleString()
  ]);

  document.getElementById("recentWrap").innerHTML = tableHTML(
    rows,
    ["Result", "Word", "Mode", "Time", "Guesses", "Wrong", "Hints", "When"]
  );
}

function filterByMode(all, mode) {
  if (mode === "all") return all;
  return all.filter(g => g.mode === mode);
}

function renderAll() {
  const mode = document.getElementById("modeFilter").value;
  const all = loadScores();
  const filtered = filterByMode(all, mode);
  renderSummary(filtered);
  renderFastest(filtered);
  renderFewestWrong(filtered);
  renderRecent(filtered);
}

document.getElementById("modeFilter").addEventListener("change", renderAll);
document.getElementById("clearBtn").addEventListener("click", () => {
  if (!confirm("Clear all saved scores from this browser?")) return;
  localStorage.removeItem(STORE_KEY);
  renderAll();
});

// initial render
renderAll();
