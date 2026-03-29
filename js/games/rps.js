window.RPSGame = {
  wins: 0,
  losses: 0,
  draws: 0,
  bound: false,

  init() {
    this.updateUI();

    document.getElementById("rpsResult").innerHTML = "Choose Rock, Paper, or Scissors to begin.";

    if (!this.bound) {
      document.getElementById("rpsRockBtn").addEventListener("click", () => this.play("Rock"));
      document.getElementById("rpsPaperBtn").addEventListener("click", () => this.play("Paper"));
      document.getElementById("rpsScissorsBtn").addEventListener("click", () => this.play("Scissors"));
      this.bound = true;
    }
  },

  play(playerChoice) {
    const options = ["Rock", "Paper", "Scissors"];
    const cpuChoice = options[Math.floor(Math.random() * 3)];

    let result = "";

    if (playerChoice === cpuChoice) {
      result = "Draw";
      this.draws++;
      SoundManager.beep(420, 0.03);
    } else if (
      (playerChoice === "Rock" && cpuChoice === "Scissors") ||
      (playerChoice === "Paper" && cpuChoice === "Rock") ||
      (playerChoice === "Scissors" && cpuChoice === "Paper")
    ) {
      result = "You Win";
      this.wins++;
      SoundManager.beep(760, 0.05);
    } else {
      result = "You Lose";
      this.losses++;
      SoundManager.beep(220, 0.05);
    }

    document.getElementById("rpsResult").innerHTML = `
      You chose <strong>${playerChoice}</strong><br>
      Computer chose <strong>${cpuChoice}</strong><br>
      Result: <strong>${result}</strong>
    `;

    this.updateUI();
  },

  updateUI() {
    document.getElementById("rpsWins").textContent = this.wins;
    document.getElementById("rpsLosses").textContent = this.losses;
    document.getElementById("rpsDraws").textContent = this.draws;
  }
};
