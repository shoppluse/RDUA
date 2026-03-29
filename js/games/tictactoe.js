window.TicTacToeGame = {
  board: Array(9).fill(""),
  currentPlayer: "X",
  gameOver: false,

  init() {
    this.board = Array(9).fill("");
    this.currentPlayer = "X";
    this.gameOver = false;

    const boardEl = document.getElementById("tttBoard");
    const statusEl = document.getElementById("tttStatus");

    if (!boardEl || !statusEl) return;

    boardEl.innerHTML = "";
    statusEl.textContent = "Player X's turn";

    this.board.forEach((_, index) => {
      const cell = document.createElement("div");
      cell.className = "ttt-cell";
      cell.addEventListener("click", () => this.play(index));
      boardEl.appendChild(cell);
    });
  },

  play(index) {
    if (this.board[index] || this.gameOver) return;

    this.board[index] = this.currentPlayer;

    const cells = document.querySelectorAll("#tttBoard .ttt-cell");
    if (cells[index]) {
      cells[index].textContent = this.currentPlayer;
    }

    SoundManager.beep(540, 0.03);

    const winner = this.checkWinner();

    if (winner) {
      document.getElementById("tttStatus").textContent = `Player ${winner} wins!`;
      this.gameOver = true;
      ConfettiManager.trigger(18);
      return;
    }

    if (!this.board.includes("")) {
      document.getElementById("tttStatus").textContent = "It's a draw!";
      this.gameOver = true;
      return;
    }

    this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
    document.getElementById("tttStatus").textContent = `Player ${this.currentPlayer}'s turn`;
  },

  checkWinner() {
    const wins = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];

    for (const [a,b,c] of wins) {
      if (this.board[a] && this.board[a] === this.board[b] && this.board[a] === this.board[c]) {
        return this.board[a];
      }
    }

    return null;
  }
};
