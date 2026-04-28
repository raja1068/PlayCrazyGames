// Updated game.js for carrom game functions

class Player {
    constructor(name, isBot = false) {
        this.name = name;
        // Indicates if the player is a bot
        this.isBot = isBot;
        this.score = 0;
        this.turn = false; // Indicates if it's this player's turn
    }
}

class Game {
    constructor() {
        this.players = [];
        this.currentPlayerIndex = 0;
    }

    addPlayer(name, isBot = false) {
        const player = new Player(name, isBot);
        this.players.push(player);
    }

    startGame() {
        this.players[0].turn = true; // Randomly assign the first turn - for simplicity assigned to the first player
    }

    nextTurn() {
        // End current player's turn
        this.players[this.currentPlayerIndex].turn = false;
        // Move to next player
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        // Start next player's turn
        this.players[this.currentPlayerIndex].turn = true;

        // If it's a bot's turn, execute bot logic
        if (this.players[this.currentPlayerIndex].isBot) {
            this.botPlay();
        }
    }

    botPlay() {
        console.log(`${this.players[this.currentPlayerIndex].name}'s turn (Bot) - making a move...`);
        // Implement bot AI move logic here, for example:
        // 1. Analyze board
        // 2. Make a move accordingly
        // 3. Update score
        this.nextTurn(); // Call nextTurn after bot plays
    }

    playerScores(point) {
        this.players[this.currentPlayerIndex].score += point;
        // Check win condition after scoring
        this.checkWinCondition();
    }

    checkWinCondition() {
        if (this.players[this.currentPlayerIndex].score >= 10) { // Example win score
            console.log(`${this.players[this.currentPlayerIndex].name} wins!`);
            // Handle game over scenario
        }
    }
}

// Usage Example
const game = new Game();
game.addPlayer('Player 1'); // Human player
game.addPlayer('Bot 1', true); // Bot player

// Start the game
game.startGame();

// Simulate turns
for (let i = 0; i < 10; i++) { // Simulate a few turns
    game.nextTurn();
}