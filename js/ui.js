const UI = {
  applyTheme(theme) {
    document.body.classList.remove("theme-midnight", "theme-neon");
    document.body.classList.add(theme === "neon" ? "theme-neon" : "theme-midnight");
  },

  updateThemeLabel(theme) {
    document.getElementById("themeLabel").textContent = theme === "neon" ? "Neon" : "Midnight";
  },

  updateSoundLabel(soundOn) {
    document.getElementById("soundLabel").textContent = soundOn ? "Sound On" : "Sound Off";
  },

  prefillPlayerName(name) {
    const input = document.getElementById("playerNameInput");
    input.value = name === "Guest" ? "" : name;
  },

  updatePlayerName(name) {
    document.getElementById("playerNameStat").textContent = name;
  },

  updateAchievementCount(count) {
    document.getElementById("achievementCount").textContent = count;
  },

  updateStats({ gamesPlayed, currentGame, playerName, achievementCount }) {
    document.getElementById("gamesPlayedStat").textContent = gamesPlayed;
    document.getElementById("currentGameStat").textContent = currentGame;
    document.getElementById("playerNameStat").textContent = playerName;
    document.getElementById("achievementCount").textContent = achievementCount;
  },

  showGameArena(gameId, title, desc) {
    document.getElementById("menuSection").classList.add("hidden");
    document.getElementById("gameArena").classList.remove("hidden");

    document.querySelectorAll(".game-panel").forEach(panel => panel.classList.add("hidden"));
    document.getElementById(gameId).classList.remove("hidden");

    document.getElementById("arenaTitle").textContent = title;
    document.getElementById("arenaDesc").textContent = desc;
  },

  showMenu() {
    document.getElementById("menuSection").classList.remove("hidden");
    document.getElementById("gameArena").classList.add("hidden");

    document.querySelectorAll(".game-panel").forEach(panel => panel.classList.add("hidden"));
  },

  renderLeaderboard() {
    const list = document.getElementById("leaderboardList");

    const items = [
      { label: "Reaction Best", value: StorageManager.getNumber(StorageKeys.reactionBest, 0) ? `${StorageManager.getNumber(StorageKeys.reactionBest)} ms` : "--" },
      { label: "Memory Best", value: StorageManager.getNumber(StorageKeys.memoryBest, 0) ? `${StorageManager.getNumber(StorageKeys.memoryBest)} moves` : "--" },
      { label: "Mole Best", value: `${StorageManager.getNumber(StorageKeys.moleBest, 0)}` },
      { label: "Typing Best", value: `${StorageManager.getNumber(StorageKeys.typingBest, 0)} WPM` },
      { label: "Snake Best", value: `${StorageManager.getNumber(StorageKeys.snakeBest, 0)}` },
      { label: "2048 Best", value: `${StorageManager.getNumber(StorageKeys.best2048, 0)}` }
    ];

    list.innerHTML = items.map(item => `
      <div class="leader-item">
        <span>${item.label}</span>
        <strong style="color: var(--text)">${item.value}</strong>
      </div>
    `).join("");
  },

  renderAchievements() {
    const list = document.getElementById("achievementList");
    const unlocked = AchievementManager.getUnlocked();

    list.innerHTML = AchievementManager.all.map(item => `
      <div class="achievement-item ${unlocked.includes(item.id) ? 'unlocked' : ''}">
        <span>${item.label}</span>
        <strong>${unlocked.includes(item.id) ? 'Unlocked' : 'Locked'}</strong>
      </div>
    `).join("");
  }
};
