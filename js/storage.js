const StorageKeys = {
  gamesPlayed: "mini_arcade_v4_games_played",
  playerName: "mini_arcade_v4_player_name",
  soundOn: "mini_arcade_v4_sound_on",
  theme: "mini_arcade_v4_theme",
  achievements: "mini_arcade_v4_achievements",

  reactionBest: "mini_arcade_v4_reaction_best",
  memoryBest: "mini_arcade_v4_memory_best",
  moleBest: "mini_arcade_v4_mole_best",
  typingBest: "mini_arcade_v4_typing_best",
  snakeBest: "mini_arcade_v4_snake_best",
  best2048: "mini_arcade_v4_2048_best"
};

const StorageManager = {
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  get(key, fallback = null) {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;

    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  },

  getNumber(key, fallback = 0) {
    const value = this.get(key, fallback);
    return typeof value === "number" ? value : fallback;
  },

  getString(key, fallback = "") {
    const value = this.get(key, fallback);
    return typeof value === "string" ? value : fallback;
  },

  getBoolean(key, fallback = false) {
    const value = this.get(key, fallback);
    return typeof value === "boolean" ? value : fallback;
  }
};
